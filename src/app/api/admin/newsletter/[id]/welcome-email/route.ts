import { NextRequest, NextResponse } from 'next/server'
import NewsletterSubscriber from '@/models/NewsletterSubscriber'
import { requireAdmin } from '@/lib/adminAuth'
import { sendNewsletterWelcomeEmail } from '@/lib/emails'
import { buildNewsletterUnsubscribeLink } from '@/lib/newsletter'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error } = await requireAdmin()
    if (error) return error

    const subscriber = await NewsletterSubscriber.findById(id)

    if (!subscriber) {
      return NextResponse.json(
        { success: false, message: 'Subscriber not found' },
        { status: 404 }
      )
    }

    const unsubscribeLink = buildNewsletterUnsubscribeLink(
      subscriber.email,
      subscriber.unsubscribeToken
    )

    await sendNewsletterWelcomeEmail(subscriber.email, unsubscribeLink)

    return NextResponse.json({
      success: true,
      message: 'Welcome email sent successfully',
    })
  } catch (error) {
    console.error('Admin newsletter welcome email error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to send welcome email' },
      { status: 500 }
    )
  }
}
