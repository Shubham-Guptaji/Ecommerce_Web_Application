// File path: src/app/api/orders/[id]/return/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Order from '@/models/Order'
import Product from '@/models/Product'
import { auth } from '@/lib/auth'
import { requireCSRF } from '@/lib/csrf'
import { razorpay } from '@/lib/razorpay'
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
    }).populate('items.product', 'name stock soldCount')

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if order is delivered and within 7 days of delivery
    if (order.status !== 'delivered') {
      return NextResponse.json(
        { success: false, message: 'Only delivered orders are eligible for return/refund' },
        { status: 400 }
      )
    }

    const deliveredDate = new Date(order.updatedAt)
    const now = new Date()
    const daysDiff = (now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24)

    if (daysDiff > 7) {
      return NextResponse.json(
        { success: false, message: 'Return/refund request can only be made within 7 days of delivery' },
        { status: 400 }
      )
    }

    // Check if payment was made via Razorpay and is paid
    if (order.paymentInfo.method !== 'razorpay' || order.paymentInfo.status !== 'paid') {
      return NextResponse.json(
        { success: false, message: 'Only Razorpay payments are eligible for instant refund' },
        { status: 400 }
      )
    }

    if (!order.paymentInfo.razorpayPaymentId) {
      return NextResponse.json(
        { success: false, message: 'Payment ID not found' },
        { status: 400 }
      )
    }

    // Initiate refund via Razorpay
    const refundAmount = Math.round(order.pricing.total * 100) // in paise, rounded to nearest integer
    const paymentId = order.paymentInfo.razorpayPaymentId

    let refund
    try {
      refund = await (razorpay as any).refunds.create({
        payment_id: paymentId,
        amount: refundAmount,
        notes: {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          reason: 'Return requested by customer',
        },
      })
    } catch (razorpayError: any) {
      console.error('Razorpay refund error:', razorpayError)
      return NextResponse.json(
        { success: false, message: razorpayError.message || 'Failed to process refund with payment gateway' },
        { status: 500 }
      )
    }

    // Update order status to refunded
    order.paymentInfo.status = 'refunded'
    order.status = 'refunded'
    order.refundStatus = 'processed'
    order.refundAmount = order.pricing.total
    order.refundReason = 'Return processed and refunded via Razorpay'
    order.statusHistory.push({
      status: 'refunded',
      timestamp: new Date(),
      note: `Refund of â‚¹${order.pricing.total} processed (Razorpay Refund ID: ${refund.id})`,
    })
    await order.save()

    // Restock products and adjust soldCount
    for (const item of order.items) {
      const product = item.product as any
      const productId = product._id
      const quantity = item.quantity
      await Product.findByIdAndUpdate(productId, {
        $inc: { stock: quantity, soldCount: -quantity },
      })
    }

    // Send notification email to user
    try {
      const userDoc = await Order.findById(id)
        .populate('user', 'name email')
        .exec()
      if (userDoc?.user?.email) {
        sendOrderStatusEmail(order, userDoc.user)
      }
    } catch (emailError) {
      console.error('Failed to send order status email:', emailError)
    }

    return NextResponse.json({
      success: true,
      message: 'Return accepted and refund processed successfully',
      data: order,
    })
  } catch (error) {
    console.error('Return order error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to process return' },
      { status: 500 }
    )
  }
}
