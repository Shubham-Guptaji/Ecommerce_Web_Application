import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { dbConnect } from '@/lib/db'
import Order from '@/models/Order'
import { auth } from '@/lib/auth'
import { env } from '@/lib/env'
import { formatCurrency } from '@/lib/utils'

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    const order = await Order.findOne({
      _id: id,
      'paymentInfo.razorpayPaymentId': { $exists: true },
      'paymentInfo.status': 'paid',
    }).lean() as any

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found or not eligible for refund' },
        { status: 404 }
      )
    }

    // Check if order already refunded
    if (order.paymentInfo.status === 'refunded') {
      return NextResponse.json(
        { success: false, message: 'Order already refunded' },
        { status: 400 }
      )
    }

    const paymentId = order.paymentInfo.razorpayPaymentId
    const amount = order.pricing.total * 100 // in paise

    // Create refund in Razorpay
    const refund = await (razorpay as any).refunds.create({
      payment_id: paymentId,
      amount: amount,
      notes: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        reason: 'Requested by admin',
      },
    })

    // Update order status to refunded
    await Order.findByIdAndUpdate(id, {
      'paymentInfo.status': 'refunded',
      status: 'refunded',
      refundStatus: 'processed',
      refundAmount: order.pricing.total,
      refundReason: 'Refund processed via Razorpay',
      $push: {
        statusHistory: {
          status: 'refunded',
          timestamp: new Date(),
          note: `Refund of ${formatCurrency(order.pricing.total)} processed`,
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
      },
      message: 'Refund initiated successfully',
    })
  } catch (error: any) {
    console.error('Refund error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to process refund' },
      { status: 500 }
    )
  }
}
