import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import User from '@/models/User'
import { auth } from '@/lib/auth'
import { signOut } from 'next-auth/react'

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    // Anonymize user data but keep orders intact
    const anonData = {
      name: 'Deleted User',
      email: `deleted-${session.user.id}@deleted.com`,
      password: 'deleted',
      avatar: {},
      isEmailVerified: false,
      isActive: false,
    }

    const user = await User.findByIdAndUpdate(
      session.user.id,
      anonData,
      { new: true }
    ).select('-password -resetPasswordToken -emailVerifyToken')

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Sign out the user
    await signOut({ redirect: false })

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete account' },
      { status: 500 }
    )
  }
}
