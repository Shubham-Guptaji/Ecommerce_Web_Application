import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import Coupon from '@/models/Coupon'
import { createCouponSchema } from '@/schemas'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET() {
  try {
    const { session, error } = await requireAdmin()
    if (error) return error

    const coupons = await Coupon.find()
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      data: coupons,
    })
  } catch (error) {
    console.error('Admin coupons GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch coupons' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, error } = await requireAdmin()
    if (error) return error

    const body = await request.json()

    // Validate input
    const validatedData = createCouponSchema.parse(body)

    // Check if code already exists
    const existing = await Coupon.findOne({ code: validatedData.code.toUpperCase() })
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Coupon code already exists' },
        { status: 400 }
      )
    }

    const coupon = new Coupon({
      ...validatedData,
      code: validatedData.code.toUpperCase(),
      expiresAt: new Date(validatedData.expiresAt),
    })

    await coupon.save()

    return NextResponse.json(
      { success: true, data: coupon },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Admin coupons POST error:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to create coupon' },
      { status: 500 }
    )
  }
}
