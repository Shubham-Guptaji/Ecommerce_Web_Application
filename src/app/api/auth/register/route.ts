// File path: src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import User from '@/models/User'
import EmailVerification from '@/models/EmailVerification'
import { registerSchema } from '@/schemas'
import { checkRateLimit, registerRateLimiter, getClientIp } from '@/lib/ratelimit'
import { sendVerificationEmail } from '@/lib/emails'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    // Rate limiting
    const clientIp = getClientIp(request)
    const { limited } = await checkRateLimit(registerRateLimiter, clientIp)
    if (limited) {
      return NextResponse.json(
        { success: false, message: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { name, email, password, confirmPassword } = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      if (existingUser.isActive === false) {
        return NextResponse.json(
          {
            success: false,
            message: 'This account has been deactivated. Please contact support if you need access again.',
          },
          { status: 403 }
        )
      }

      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Create user - password will be auto-hashed by pre-save hook
    const user = new User({
      name,
      email,
      password,
      role: 'user',
      isEmailVerified: false,
    })

    await user.save()

    // Generate email verification token
    const rawToken = user.generateEmailVerifyToken()
    await user.save() // persist emailVerifyToken and emailVerifyExpiry

    // Create EmailVerification document with sha256 hash (user.emailVerifyToken)
    const verification = new EmailVerification({
      email: user.email,
      token: user.emailVerifyToken!,
      user: user._id,
      expiresAt: user.emailVerifyExpiry!,
    })

    await verification.save()

    // Send verification email (fire-and-forget)
    sendVerificationEmail(user, rawToken)

    return NextResponse.json(
      { success: true, message: 'Account created. Please verify your email.' },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Registration error:', error)

    if (error.errors) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Registration failed' },
      { status: 500 }
    )
  }
}
