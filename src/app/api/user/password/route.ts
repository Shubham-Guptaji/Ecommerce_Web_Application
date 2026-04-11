// File path: src/app/api/user/password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import User from '@/models/User'
import { auth } from '@/lib/auth'
import { compare, hash } from 'bcryptjs'
import { z } from 'zod'
import { sendPasswordChangedEmail } from '@/lib/emails'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
})

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    const body = await request.json()
    const { currentPassword, newPassword } = changePasswordSchema.parse(body)

    // Fetch user with password
    const user = await User.findById(session.user.id).select('+password')
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Verify current password
    const isValid = await compare(currentPassword, user.password)
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 12)

    // Update password
    user.password = hashedPassword
    user.updatedAt = new Date()
    await user.save()

    // Send password changed email
    try {
      sendPasswordChangedEmail(user)
    } catch (emailError) {
      console.error('Failed to send password changed email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    })
  } catch (error: any) {
    console.error('Change password error:', error)

    if (error.errors) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to change password' },
      { status: 500 }
    )
  }
}
