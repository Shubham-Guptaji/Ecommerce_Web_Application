// File path: src/app/api/orders/[id]/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Order from '@/models/Order'
import Product from '@/models/Product'
import { auth } from '@/lib/auth'
import { requireCSRF } from '@/lib/csrf'
import { sendOrderStatusEmail } from '@/lib/emails'

export async function POST(
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

    // CSRF check
    const csrf = await requireCSRF(request)
    if (!csrf.valid) {
      return csrf.response
    }

    await dbConnect()

    const { id } = await params

    // Find order belonging to user
    const order = await Order.findOne({
      _id: id,
      user: session.user.id,
    }).populate('items.product', 'name')

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['pending', 'confirmed', 'processing']
    if (!cancellableStatuses.includes(order.status)) {
      return NextResponse.json(
        {
          success: false,
          message: `Order with status "${order.status}" cannot be cancelled`,
        },
        { status: 400 }
      )
    }

    // Update order status to cancelled
    order.status = 'cancelled'
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: 'Order cancelled by customer',
    })
    await order.save()

    // Restore product stock and soldCount
    for (const item of order.items) {
      const product = item.product as any
      const productId = product._id
      const quantity = item.quantity
      await Product.findByIdAndUpdate(productId, {
        $inc: { stock: quantity, soldCount: -quantity },
      })
    }

    // Send cancellation email
    try {
      const userDoc = await Order.findById(id)
        .populate('user', 'name email')
        .exec()
      if (userDoc?.user?.email) {
        sendOrderStatusEmail(order, userDoc.user)
      }
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError)
      // Don't fail request
    }

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    })
  } catch (error) {
    console.error('Cancel order error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to cancel order' },
      { status: 500 }
    )
  }
}
