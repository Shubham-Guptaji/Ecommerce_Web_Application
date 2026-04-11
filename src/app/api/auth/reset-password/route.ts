// File path: src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import User from '@/models/User'
import { hash } from 'bcryptjs'
import crypto from 'crypto'
import { resetPasswordSchema } from '@/schemas'
import { sendPasswordChangedEmail } from '@/lib/emails'

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    const body = await request.json()
    const { token, password } = resetPasswordSchema.parse(body)

    // Hash the provided token with sha256
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    // Find user with matching reset token hash and valid expiry
    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpiry: { $gt: new Date() },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await hash(password, 12)

    // Update password and clear reset token fields
    user.password = hashedPassword
    user.resetPasswordToken = undefined
    user.resetPasswordExpiry = undefined
    await user.save()

    // Send password changed confirmation email (fire-and-forget)
    sendPasswordChangedEmail(user)

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    })
  } catch (error: any) {
    console.error('Reset password error:', error)

    if (error.errors) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
