// src/app/api/user/addresses/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Address from '@/models/Address'
import { auth } from '@/lib/auth'
import { addressSchema } from '@/schemas'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    const { id: addressId } = await params
    const body = await request.json()

    // Validate input
    const validatedData = addressSchema.parse(body)

    // Find address belonging to user
    const address = await Address.findOne({
      _id: addressId,
      user: session.user.id,
    })

    if (!address) {
      return NextResponse.json(
        { success: false, message: 'Address not found' },
        { status: 404 }
      )
    }

    // If setting as default, unset other defaults
    if (validatedData.isDefault) {
      await Address.updateMany(
        { user: session.user.id, _id: { $ne: addressId } },
        { $set: { isDefault: false } }
      )
    } else {
      // Check if this is the only default address
      const defaultCount = await Address.countDocuments({
        user: session.user.id,
        isDefault: true,
      })

      if (defaultCount <= 1 && address.isDefault) {
        // Set as default if it's the only default being unset
        validatedData.isDefault = true
      }
    }

    // Update address
    Object.assign(address, validatedData)
    await address.save()

    return NextResponse.json({
      success: true,
      data: address,
    })
  } catch (error: any) {
    console.error('Address PUT error:', error)

    if (error.errors) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to update address' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    const { id: addressId } = await params

    // Find the address first
    const address = await Address.findOne({
      _id: addressId,
      user: session.user.id,
    })

    if (!address) {
      return NextResponse.json(
        { success: false, message: 'Address not found' },
        { status: 404 }
      )
    }

    const wasDefault = address.isDefault

    // Delete the address
    await address.deleteOne()

    // If the deleted address was default, set another address as default
    if (wasDefault) {
      const nextDefault = await Address.findOne({ user: session.user.id })
        .sort({ createdAt: -1 })
        .limit(1)

      if (nextDefault) {
        nextDefault.isDefault = true
        await nextDefault.save()
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully',
    })
  } catch (error) {
    console.error('Address DELETE error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete address' },
      { status: 500 }
    )
  }
}
