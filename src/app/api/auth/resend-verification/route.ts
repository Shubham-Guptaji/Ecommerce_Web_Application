// File path: src/app/api/auth/resend-verification/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import User from '@/models/User'
import EmailVerification from '@/models/EmailVerification'
import { sendVerificationEmail } from '@/lib/emails'
import { checkRateLimit, getClientIp, resendVerificationRateLimiter } from '@/lib/ratelimit'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    const clientIp = getClientIp(request)
    const normalizedEmail = email.toLowerCase().trim()
    const { limited } = await checkRateLimit(
      resendVerificationRateLimiter,
      `${clientIp}:${normalizedEmail}:resend-verification`
    )

    if (limited) {
      return NextResponse.json(
        { success: false, message: 'Too many verification attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail })

    if (!user) {
      // Don't reveal that user doesn't exist
      return NextResponse.json({
        success: true,
        message: 'If that email exists, a verification link has been sent.',
      })
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return NextResponse.json({
        success: true,
        message: 'Email is already verified.',
      })
    }

    // Delete any existing verification records for this user
    await EmailVerification.deleteMany({ user: user._id })

    // Generate new verification token using User method
    const rawToken = user.generateEmailVerifyToken()
    await user.save() // persist emailVerifyToken and emailVerifyExpiry

    // Save new verification record with sha256 hash from user
    const emailVerification = new EmailVerification({
      email: user.email,
      token: user.emailVerifyToken!,
      user: user._id,
      expiresAt: user.emailVerifyExpiry!,
    })
    await emailVerification.save()

    // Send verification email (fire-and-forget)
    sendVerificationEmail(user, rawToken)

    return NextResponse.json({
      success: true,
      message: 'If that email exists, a verification link has been sent.',
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to process request' },
      { status: 500 }
    )
  }
}
