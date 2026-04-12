import { NextRequest, NextResponse } from 'next/server'
import NewsletterCampaign from '@/models/NewsletterCampaign'
import NewsletterCampaignDelivery from '@/models/NewsletterCampaignDelivery'
import { requireAdmin } from '@/lib/adminAuth'
import { processNewsletterCampaign } from '@/lib/newsletter-campaigns'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error } = await requireAdmin()
    if (error) return error

    const body = await request.json().catch(() => ({}))
    const retryFailed = body?.retryFailed === true

    const campaign = await NewsletterCampaign.findById(id)

    if (!campaign) {
      return NextResponse.json(
        { success: false, message: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (retryFailed) {
      const failedResetResult = await NewsletterCampaignDelivery.updateMany(
        { campaign: id, status: 'failed' },
        {
          $set: {
            status: 'pending',
          },
          $unset: {
            errorMessage: 1,
            processingStartedAt: 1,
            sentAt: 1,
          },
        }
      )

      if (failedResetResult.modifiedCount > 0) {
        await NewsletterCampaign.findByIdAndUpdate(id, {
          $set: {
            status: 'queued',
          },
          $unset: {
            completedAt: 1,
            lastError: 1,
          },
        })
      }
    }

    void processNewsletterCampaign(id).catch((processError) => {
      console.error(`Background newsletter campaign processing failed for ${id}:`, processError)
    })

    return NextResponse.json({
      success: true,
      message: retryFailed
        ? 'Failed deliveries were re-queued and campaign processing resumed.'
        : 'Campaign processing resumed in the background.',
    })
  } catch (error) {
    console.error('Admin newsletter campaign process POST error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to resume campaign processing' },
      { status: 500 }
    )
  }
}
