import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import User from '@/models/User'
import Address from '@/models/Address'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { normalizeAvatar } from '@/lib/avatar'

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  avatar: z.union([
    z.string(),
    z.object({
      url: z.string().optional(),
      publicId: z.string().optional(),
    }),
  ]).optional(),
})

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    const user = await User.findById(session.user.id)
      .select('-password -resetPasswordToken -emailVerifyToken')
      .populate('defaultAddress')
      .populate('addresses')
      .lean()

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error('Profile GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

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
    const { name, phone, avatar } = updateProfileSchema.parse(body)
    const normalizedAvatar = normalizeAvatar(avatar)

    const updates: any = {}

    if (name !== undefined) updates.name = name
    if (phone !== undefined) updates.phone = phone.trim()
    if (normalizedAvatar) updates.avatar = normalizedAvatar

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No updates provided' },
        { status: 400 }
      )
    }

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .select('-password -resetPasswordToken -emailVerifyToken')
      .lean()

    return NextResponse.json({
      success: true,
      data: user,
    })
  } catch (error: any) {
    console.error('Profile PUT error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.flatten() },
        { status: 400 }
      )
    }

    if (error.errors) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
