import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import NewsletterSubscriber from '@/models/NewsletterSubscriber'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')
    const email = searchParams.get('email')

    if (!token || !email) {
      return NextResponse.json(
        { success: false, message: 'Invalid unsubscribe link' },
        { status: 400 }
      )
    }

    const subscriber = await NewsletterSubscriber.findOne({
      email: email.toLowerCase(),
      unsubscribeToken: token,
    })

    if (!subscriber) {
      return NextResponse.json(
        { success: false, message: 'Subscriber not found' },
        { status: 404 }
      )
    }

    if (!subscriber.isActive) {
      return NextResponse.json(
        { success: true, message: 'You have already unsubscribed' },
        { status: 200 }
      )
    }

    // Mark as unsubscribed
    subscriber.isActive = false
    subscriber.unsubscribedAt = new Date()
    await subscriber.save()

    // Return a simple success page (could be a redirect to a confirmation page)
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Unsubscribed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
          .container { background: #f9f9f9; padding: 40px; border-radius: 10px; }
          h1 { color: #2563eb; }
          .footer { margin-top: 30px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Unsubscribed</h1>
          <p>You have been successfully unsubscribed from our newsletter.</p>
          <p>We're sorry to see you go. You can subscribe again anytime.</p>
          <div class="footer">
            <p>© ${new Date().getFullYear()} E-Shop. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    })
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to unsubscribe' },
      { status: 500 }
    )
  }
}
