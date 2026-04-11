// src/app/api/user/addresses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Address from '@/models/Address'
import { auth } from '@/lib/auth'
import { addressSchema } from '@/schemas'

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

    const addresses = await Address.find({ user: session.user.id })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      data: addresses,
    })
  } catch (error) {
    console.error('Addresses GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch addresses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    // Validate input
    const validatedData = addressSchema.parse(body)

    // If this is set as default, unset other defaults
    if (validatedData.isDefault) {
      await Address.updateMany(
        { user: session.user.id },
        { $set: { isDefault: false } }
      )
    }

    const address = new Address({
      ...validatedData,
      user: session.user.id,
    })

    await address.save()

    return NextResponse.json(
      { success: true, data: address },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Address POST error:', error)

    if (error.errors) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to add address' },
      { status: 500 }
    )
  }
}
