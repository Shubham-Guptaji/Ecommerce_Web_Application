import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { dbConnect } from '@/lib/db'
import Coupon from '@/models/Coupon'
import { auth } from '@/lib/auth'
import { couponValidateSchema } from '@/schemas'

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
    const { code, orderTotal: subtotal } = couponValidateSchema.parse(body)

    if (!code || subtotal === undefined) {
      return NextResponse.json(
        { success: false, message: 'Code and subtotal are required' },
        { status: 400 }
      )
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() })

    if (!coupon) {
      return NextResponse.json(
        { success: false, message: 'Invalid coupon code' },
        { status: 404 }
      )
    }

    const isValid = await coupon.isValid(session.user.id)

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Coupon is not valid or has expired' },
        { status: 400 }
      )
    }

    if (subtotal < coupon.minOrderValue) {
      return NextResponse.json(
        {
          success: false,
          message: `Minimum order of ${coupon.minOrderValue} required`,
        },
        { status: 400 }
      )
    }

    const discountAmount = coupon.calculateDiscount(subtotal)

    return NextResponse.json({
      success: true,
      data: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discountAmount,
        minOrderValue: coupon.minOrderValue,
        remainingUsage: coupon.usageLimit - coupon.usedCount,
      },
    })
  } catch (error: any) {
    console.error('Coupon validate error:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to validate coupon' },
      { status: 500 }
    )
  }
}
