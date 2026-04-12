// File path: src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import User from '@/models/User'
import { forgotPasswordSchema } from '@/schemas'
import { checkRateLimit, forgotPasswordRateLimiter, getClientIp } from '@/lib/ratelimit'
import { sendPasswordResetEmail } from '@/lib/emails'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    // Rate limiting
    const clientIp = getClientIp(request)
    const { limited } = await checkRateLimit(forgotPasswordRateLimiter, clientIp)
    if (limited) {
      return NextResponse.json(
        { success: false, message: 'Too many reset attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      // Don't reveal that user doesn't exist
      return NextResponse.json({
        success: true,
        message: 'If an account exists, a password reset email has been sent.',
      })
    }

    // Generate reset token using User method
    const rawToken = user.generatePasswordResetToken()
    await user.save()

    // Send password reset email (fire-and-forget)
    sendPasswordResetEmail(user, rawToken)

    return NextResponse.json({
      success: true,
      message: 'If an account exists, a password reset email has been sent.',
    })
  } catch (error: any) {
    console.error('Forgot password error:', error)

    if (error.errors) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to process request' },
      { status: 500 }
    )
  }
}
