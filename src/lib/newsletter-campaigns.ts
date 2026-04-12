import mongoose from 'mongoose'
import NewsletterCampaign, { type NewsletterCampaignStatus } from '@/models/NewsletterCampaign'
import NewsletterCampaignDelivery from '@/models/NewsletterCampaignDelivery'
import NewsletterSubscriber from '@/models/NewsletterSubscriber'
import { sendEmail } from '@/lib/nodemailer'
import { dbConnect } from '@/lib/db'
import { getStoreSettings } from '@/lib/settings'
import {
  buildNewsletterCampaignEmail,
  buildNewsletterUnsubscribeLink,
} from '@/lib/newsletter'

const DELIVERY_BATCH_SIZE = 20

type CampaignRecipient = {
  _id: string
  email: string
  unsubscribeToken: string
  isActive: boolean
}

type CreateNewsletterCampaignInput = {
  mode: 'single' | 'selected' | 'all'
  ids: string[]
  subject: string
  bodyHtml: string
  bodyText: string
  createdByName?: string
  createdByEmail?: string
}

type CampaignProgress = {
  sentCount: number
  failedCount: number
  skippedCount: number
  pendingCount: number
  processingCount: number
  status: NewsletterCampaignStatus
  completedAt?: Date
}

async function resolveCampaignRecipients(mode: 'single' | 'selected' | 'all', ids: string[]) {
  if (mode === 'all') {
    return NewsletterSubscriber.find({})
      .select('_id email unsubscribeToken isActive')
      .lean<CampaignRecipient[]>()
  }

  return NewsletterSubscriber.find({ _id: { $in: ids } })
    .select('_id email unsubscribeToken isActive')
    .lean<CampaignRecipient[]>()
}

export async function createNewsletterCampaign(input: CreateNewsletterCampaignInput) {
  await dbConnect()

  const recipients = await resolveCampaignRecipients(input.mode, input.ids)
  const activeRecipients = recipients.filter((recipient) => recipient.isActive)
  const skippedRecipients = recipients.filter((recipient) => !recipient.isActive)

  if (activeRecipients.length === 0) {
    throw new Error('No active subscribers matched this send request.')
  }

  const campaign = await NewsletterCampaign.create({
    subject: input.subject,
    bodyHtml: input.bodyHtml,
    bodyText: input.bodyText,
    targetMode: input.mode,
    requestedCount: recipients.length,
    activeRecipientCount: activeRecipients.length,
    skippedCount: skippedRecipients.length,
    pendingCount: activeRecipients.length,
    status: 'queued',
    createdByName: input.createdByName,
    createdByEmail: input.createdByEmail,
  })

  const deliveryDocs = recipients.map((recipient) => ({
    campaign: campaign._id,
    subscriber: recipient._id,
    email: recipient.email,
    unsubscribeToken: recipient.unsubscribeToken,
    status: recipient.isActive ? 'pending' : 'skipped',
    attempts: 0,
    errorMessage: recipient.isActive ? undefined : 'Skipped because subscriber is inactive.',
  }))

  await NewsletterCampaignDelivery.insertMany(deliveryDocs, { ordered: false })

  return campaign.toObject()
}

async function claimCampaignDeliveries(campaignId: string) {
  const candidates = await NewsletterCampaignDelivery.find({
    campaign: campaignId,
    status: 'pending',
  })
    .sort({ createdAt: 1 })
    .limit(DELIVERY_BATCH_SIZE)
    .lean<Array<{
      _id: string
      email: string
      unsubscribeToken: string
      subscriber?: string
    }>>()

  const claimed = []

  for (const candidate of candidates) {
    const delivery = await NewsletterCampaignDelivery.findOneAndUpdate(
      { _id: candidate._id, status: 'pending' },
      {
        $set: {
          status: 'processing',
          processingStartedAt: new Date(),
        },
        $inc: {
          attempts: 1,
        },
      },
      { new: true }
    ).lean()

    if (delivery) {
      claimed.push(delivery)
    }
  }

  return claimed
}

async function recomputeCampaignProgress(campaignId: string): Promise<CampaignProgress> {
  const counts = await NewsletterCampaignDelivery.aggregate([
    { $match: { campaign: new mongoose.Types.ObjectId(campaignId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ])

  const summary = counts.reduce<Record<string, number>>((acc, item) => {
    acc[item._id] = item.count
    return acc
  }, {})

  const sentCount = summary.sent || 0
  const failedCount = summary.failed || 0
  const skippedCount = summary.skipped || 0
  const pendingCount = summary.pending || 0
  const processingCount = summary.processing || 0

  let status: NewsletterCampaignStatus = 'processing'
  let completedAt: Date | undefined

  if (pendingCount === 0 && processingCount === 0) {
    completedAt = new Date()

    if (sentCount > 0 && failedCount > 0) {
      status = 'completed_with_errors'
    } else if (sentCount > 0) {
      status = 'completed'
    } else {
      status = 'failed'
    }
  }

  return {
    sentCount,
    failedCount,
    skippedCount,
    pendingCount,
    processingCount,
    status,
    completedAt,
  }
}

export async function processNewsletterCampaign(campaignId: string) {
  await dbConnect()

  const campaign = await NewsletterCampaign.findById(campaignId).lean<{
    _id: string
    subject: string
    bodyHtml: string
  } | null>()

  if (!campaign) {
    throw new Error('Campaign not found.')
  }

  const settings = await getStoreSettings()
  const storeName = settings?.storeName || 'E-Shop'

  await NewsletterCampaign.findByIdAndUpdate(campaignId, {
    $set: {
      status: 'processing',
      startedAt: new Date(),
      lastProcessedAt: new Date(),
    },
    $unset: {
      lastError: 1,
    },
  })

  try {
    while (true) {
      const batch = await claimCampaignDeliveries(campaignId)

      if (batch.length === 0) {
        break
      }

      await Promise.all(
        batch.map(async (delivery: any) => {
          try {
            const html = buildNewsletterCampaignEmail({
              subject: campaign.subject,
              body: campaign.bodyHtml,
              unsubscribeLink: buildNewsletterUnsubscribeLink(
                delivery.email,
                delivery.unsubscribeToken
              ),
              storeName,
            })

            await sendEmail(delivery.email, campaign.subject, html)

            await NewsletterCampaignDelivery.findByIdAndUpdate(delivery._id, {
              $set: {
                status: 'sent',
                sentAt: new Date(),
              },
              $unset: {
                processingStartedAt: 1,
                errorMessage: 1,
              },
            })
          } catch (error: any) {
            await NewsletterCampaignDelivery.findByIdAndUpdate(delivery._id, {
              $set: {
                status: 'failed',
                errorMessage: error?.message || 'Send failed',
              },
              $unset: {
                processingStartedAt: 1,
              },
            })
          }
        })
      )

      const progress = await recomputeCampaignProgress(campaignId)
      await NewsletterCampaign.findByIdAndUpdate(campaignId, {
        $set: {
          ...progress,
          lastProcessedAt: new Date(),
        },
      })
    }

    const finalProgress = await recomputeCampaignProgress(campaignId)
    await NewsletterCampaign.findByIdAndUpdate(campaignId, {
      $set: {
        ...finalProgress,
        lastProcessedAt: new Date(),
      },
    })
  } catch (error: any) {
    await NewsletterCampaign.findByIdAndUpdate(campaignId, {
      $set: {
        status: 'failed',
        lastError: error?.message || 'Campaign processing failed',
        lastProcessedAt: new Date(),
      },
    })

    throw error
  }
}
