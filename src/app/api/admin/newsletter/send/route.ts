import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/adminAuth'
import { createNewsletterCampaign, processNewsletterCampaign } from '@/lib/newsletter-campaigns'
import { normalizeNewsletterCampaignBody } from '@/lib/newsletter'
import { stripHtml } from '@/lib/sanitize'

const newsletterCampaignSchema = z.object({
  mode: z.enum(['single', 'selected', 'all']),
  ids: z.array(z.string()).default([]),
  subject: z.string().trim().min(3).max(160),
  body: z.string().trim().min(1).max(20000),
}).superRefine((value, ctx) => {
  if (value.mode === 'single' && value.ids.length !== 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['ids'],
      message: 'Single-send mode requires exactly one subscriber.',
    })
  }

  if (value.mode === 'selected' && value.ids.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['ids'],
      message: 'Please select at least one subscriber.',
    })
  }
})

export async function POST(request: NextRequest) {
  try {
    const { session, error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const parsed = newsletterCampaignSchema.parse(body)
    const sanitizedBody = normalizeNewsletterCampaignBody(parsed.body)

    if (!stripHtml(sanitizedBody).trim()) {
      return NextResponse.json(
        { success: false, message: 'Campaign body cannot be empty.' },
        { status: 400 }
      )
    }

    const campaign = await createNewsletterCampaign({
      mode: parsed.mode,
      ids: parsed.ids,
      subject: parsed.subject,
      bodyHtml: sanitizedBody,
      bodyText: stripHtml(sanitizedBody),
      createdByName: session?.user?.name || undefined,
      createdByEmail: session?.user?.email || undefined,
    })

    void processNewsletterCampaign(campaign._id).catch((processError) => {
      console.error(`Background newsletter campaign processing failed for ${campaign._id}:`, processError)
    })

    return NextResponse.json({
      success: true,
      message: `Campaign queued for ${campaign.activeRecipientCount} active recipients. Processing started in the background.`,
      data: campaign,
    })
  } catch (error: any) {
    console.error('Admin newsletter send error:', error)

    if (error?.issues) {
      return NextResponse.json(
        { success: false, message: error.issues[0]?.message || 'Invalid campaign payload.' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to send newsletter campaign' },
      { status: 500 }
    )
  }
}
