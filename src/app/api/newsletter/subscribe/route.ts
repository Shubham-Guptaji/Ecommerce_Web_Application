// File path: src/app/api/newsletter/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import NewsletterSubscriber from '@/models/NewsletterSubscriber'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { sendNewsletterWelcomeEmail } from '@/lib/emails'
import { logger } from '@/lib/logger'
import { buildNewsletterUnsubscribeLink } from '@/lib/newsletter'
import { checkRateLimit, getClientIp, newsletterSubscribeRateLimiter } from '@/lib/ratelimit'

const newsletterSchema = z.object({
  email: z.string().email('Invalid email address'),
})

const formatResetTime = (resetTime: number) => {
  if (!resetTime) return 'Please try again later.'

  const minutes = Math.max(1, Math.ceil((resetTime - Date.now()) / 60000))
  return `Please wait about ${minutes} minute${minutes === 1 ? '' : 's'} before trying again.`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = newsletterSchema.parse(body)

    const emailLower = email.toLowerCase()
    const clientIp = getClientIp(request)
    const { limited, resetTime } = await checkRateLimit(
      newsletterSubscribeRateLimiter,
      `${clientIp}:${emailLower}`
    )

    if (limited) {
      return NextResponse.json(
        {
          success: false,
          message: `Too many newsletter signups from this address. ${formatResetTime(resetTime)}`,
        },
        { status: 429 }
      )
    }

    await dbConnect()

    let subscriber

    // Check if already subscribed
    const existing = await NewsletterSubscriber.findOne({ email: emailLower })
    if (existing) {
      if (existing.isActive) {
        return NextResponse.json(
          { success: false, message: 'This email is already subscribed to our newsletter.' },
          { status: 409 }
        )
      } else {
        // Re-subscribe: reactivate
        existing.isActive = true
        existing.unsubscribedAt = undefined
        existing.subscribedAt = new Date()
        await existing.save()
        subscriber = existing
      }
    } else {
      // Create new subscriber with unsubscribe token
      const unsubscribeToken = uuidv4()
      subscriber = new NewsletterSubscriber({
        email: emailLower,
        unsubscribeToken,
        isActive: true,
      })
      await subscriber.save()
    }

    // Send welcome email
    let emailSent = false
    try {
      const unsubscribeLink = buildNewsletterUnsubscribeLink(emailLower, subscriber.unsubscribeToken)
      await sendNewsletterWelcomeEmail(emailLower, unsubscribeLink)
      emailSent = true
      logger.info('Newsletter welcome email sent', { email: emailLower })
    } catch (emailError) {
      logger.error('Failed to send newsletter welcome email', emailError)
      // Don't fail the request if email fails, but we'll note it in the response
    }

    const responseMessage = emailSent
      ? 'Successfully subscribed to newsletter! Check your email for confirmation.'
      : 'Successfully subscribed to newsletter! (Note: Confirmation email may be delayed or in spam folder)'

    return NextResponse.json({
      success: true,
      message: responseMessage,
      emailSent,
    })
  } catch (error: any) {
    logger.error('Newsletter subscribe error', error)

    if (error.errors) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to subscribe' },
      { status: 500 }
    )
  }
}
