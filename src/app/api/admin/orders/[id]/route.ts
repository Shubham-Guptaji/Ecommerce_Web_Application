import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import Order from '@/models/Order'
import '@/models/Coupon'
import { requireAdmin } from '@/lib/adminAuth'
import { updateAdminOrder } from '@/lib/admin-orders'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { session, error } = await requireAdmin()
    if (error) return error

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid order ID' },
        { status: 400 }
      )
    }

    const order = await Order.findOne({ _id: id })
      .populate('user', 'name email')
      .populate('items.product', 'name images sku')
      .populate('coupon')
      .populate('shippingAddress', '_id fullName phone line1 line2 city state pincode country')
      .lean() as any

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: order,
    })
  } catch (error) {
    console.error('Admin order GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch order' },
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
    return updateAdminOrder(id, body)
  } catch (error) {
    console.error('Admin order PUT error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update order' },
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid order ID' },
        { status: 400 }
      )
    }

    // Soft delete - set status to cancelled
    const order = await Order.findByIdAndUpdate(
      id,
      {
        status: 'cancelled',
        $push: {
          statusHistory: {
            status: 'cancelled',
            timestamp: new Date(),
            note: 'Order deleted by admin',
          },
        },
      },
      { new: true }
    )

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Order deleted',
      data: order,
    })
  } catch (error) {
    console.error('Admin order DELETE error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete order' },
      { status: 500 }
    )
  }
}
