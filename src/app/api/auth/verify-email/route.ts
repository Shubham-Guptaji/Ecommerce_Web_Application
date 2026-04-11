// File path: src/app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import User from '@/models/User'
import EmailVerification from '@/models/EmailVerification'
import crypto from 'crypto'
import { sendWelcomeEmail } from '@/lib/emails'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token is required' },
        { status: 400 }
      )
    }

    // Hash the provided token with sha256
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Find verification record with matching token hash and not expired
    const verification = await EmailVerification.findOne({
      token: tokenHash,
      expiresAt: { $gt: new Date() },
    }).populate('user')

    if (!verification) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    // Mark user as verified
    verification.user.isEmailVerified = true
    // Clear verify token fields on user
    verification.user.emailVerifyToken = undefined
    verification.user.emailVerifyExpiry = undefined
    await verification.user.save()

    // Delete verification record
    await verification.deleteOne()

    // Send welcome email (fire-and-forget)
    sendWelcomeEmail(verification.user)

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { success: false, message: 'Verification failed' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { success: false, message: 'Method not allowed' },
    { status: 405 }
  )
}
