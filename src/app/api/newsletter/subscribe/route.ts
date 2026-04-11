// File path: src/app/api/newsletter/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import NewsletterSubscriber from '@/models/NewsletterSubscriber'
import { sendEmail } from '@/lib/nodemailer'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

const newsletterSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const body = await request.json()
    const { email } = newsletterSchema.parse(body)

    const emailLower = email.toLowerCase()

    let subscriber
    let isNew = false

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
      isNew = true
    }

    // Send welcome email
    let emailSent = false
    try {
      const unsubscribeLink = `${process.env.NEXTAUTH_URL}/api/newsletter/unsubscribe?token=${subscriber.unsubscribeToken}&email=${encodeURIComponent(emailLower)}`
      await sendEmail(
        email,
        'Welcome to E-Shop Newsletter!',
        `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .container { background: #f9f9f9; padding: 30px; border-radius: 10px; }
              .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; margin: -30px -30px 30px; }
              .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
              .unsubscribe { font-size: 12px; color: #999; margin-top: 20px; }
              .unsubscribe a { color: #999; text-decoration: underline; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to E-Shop!</h1>
              </div>
              <p>Thank you for subscribing to our newsletter!</p>
              <p>We'll keep you updated with the latest deals, new arrivals, and exclusive offers.</p>
              <div class="unsubscribe">
                <p>If you wish to unsubscribe, <a href="${unsubscribeLink}">click here</a>.</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} E-Shop. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
      )
      emailSent = true
      console.log(`Newsletter welcome email sent successfully to ${emailLower}`)
    } catch (emailError) {
      console.error('Failed to send newsletter welcome email:', emailError)
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
    console.error('Newsletter subscribe error:', error)

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
