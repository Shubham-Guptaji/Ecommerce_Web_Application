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

