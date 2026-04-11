// src/app/api/admin/orders/[id]/refund/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { dbConnect } from '@/lib/db'
import Order from '@/models/Order'
import { requireAdmin } from '@/lib/adminAuth'
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
    const { session, error } = await requireAdmin()
    if (error) return error

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
    const refund = await (razorpay.refunds as any).create({
      payment_id: paymentId,
      amount: amount,
      notes: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        reason: 'Refund requested by admin',
      },
    })

    // Update order status to refunded
    await Order.findByIdAndUpdate(id, {
      'paymentInfo.status': 'refunded',
      status: 'refunded',
      $push: {
        statusHistory: {
          status: 'refunded',
          timestamp: new Date(),
          note: `Refund of ${formatCurrency(order.pricing.total)} processed via Razorpay`,
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
