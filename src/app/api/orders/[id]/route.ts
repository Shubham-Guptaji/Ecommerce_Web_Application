import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Order from '@/models/Order'
import '@/models/Coupon'
import { auth } from '@/lib/auth'

export async function GET(
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

    const { id } = await params

    const order = await Order.findOne({ _id: id, user: session.user.id })
      .populate('items.product', 'name images slug')
      .populate('coupon')
      .lean()

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
    console.error('Order GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch order' },
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

    const { id } = await params

    // Only allow cancelling orders that are pending/confirmed
    const order = await Order.findOne({
      _id: id,
      user: session.user.id,
      status: { $in: ['pending', 'confirmed'] },
    })

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found or cannot be cancelled' },
        { status: 404 }
      )
    }

    order.status = 'cancelled'
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: 'Cancelled by user',
    })

    await order.save()

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
    })
  } catch (error) {
    console.error('Order DELETE error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to cancel order' },
      { status: 500 }
    )
  }
}
