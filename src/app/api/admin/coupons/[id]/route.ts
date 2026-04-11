import { NextRequest, NextResponse } from 'next/server'
import Coupon from '@/models/Coupon'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { session, error } = await requireAdmin()
    if (error) return error

    const coupon = await Coupon.findById(id).lean()

    if (!coupon) {
      return NextResponse.json(
        { success: false, message: 'Coupon not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: coupon,
    })
  } catch (error) {
    console.error('Admin coupon GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch coupon' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { session, error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const { code, type, value, minOrderValue, maxDiscount, usageLimit, expiresAt, isActive } = body

    const updateData: any = {}

    if (code) updateData.code = code.toUpperCase()
    if (type) updateData.type = type
    if (value !== undefined) updateData.value = value
    if (minOrderValue !== undefined) updateData.minOrderValue = minOrderValue
    if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit
    if (expiresAt) updateData.expiresAt = new Date(expiresAt)
    if (isActive !== undefined) updateData.isActive = isActive

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )

    if (!coupon) {
      return NextResponse.json(
        { success: false, message: 'Coupon not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: coupon,
    })
  } catch (error) {
    console.error('Admin coupon PUT error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update coupon' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { session, error } = await requireAdmin()
    if (error) return error

    const coupon = await Coupon.findByIdAndDelete(id)

    if (!coupon) {
      return NextResponse.json(
        { success: false, message: 'Coupon not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Coupon deleted',
    })
  } catch (error) {
    console.error('Admin coupon DELETE error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete coupon' },
      { status: 500 }
    )
  }
}
