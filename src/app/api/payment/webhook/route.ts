// src/app/api/payment/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { dbConnect } from '@/lib/db'
import Order from '@/models/Order'
import Cart from '@/models/Cart'
import Coupon from '@/models/Coupon'
import { env } from '@/lib/env'
import { decrementInventory } from '@/lib/inventory'
import { logger } from '@/lib/logger'

function toHexBuffer(signature: string) {
  return /^[0-9a-f]+$/i.test(signature) && signature.length % 2 === 0
    ? Buffer.from(signature, 'hex')
    : null
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()

    // Get raw body for signature verification
    const rawBody = await request.arrayBuffer()
    const signature = request.headers.get('x-razorpay-signature') as string

    if (!signature) {
      return NextResponse.json(
        { success: false, message: 'Missing signature' },
        { status: 400 }
      )
    }

    // Verify webhook signature using raw body
    const bodyBuffer = Buffer.from(rawBody)
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET || env.RAZORPAY_KEY_SECRET!)
      .update(bodyBuffer)
      .digest('hex')

    // Use timingSafeEqual to avoid timing attacks
    const sigBuffer = toHexBuffer(signature)
    const expectedBuffer = toHexBuffer(expectedSignature)
    const isSignatureValid =
      sigBuffer !== null &&
      expectedBuffer !== null &&
      sigBuffer.length === expectedBuffer.length &&
      crypto.timingSafeEqual(sigBuffer, expectedBuffer)

    if (!isSignatureValid) {
      logger.warn('Invalid Razorpay webhook signature')
      // Always return 200 to acknowledge receipt (Razorpay retries on non-200)
      return NextResponse.json(
        { success: false, message: 'Invalid signature' },
        { status: 200 }
      )
    }

    // Parse JSON payload from raw buffer
    const bodyString = bodyBuffer.toString('utf-8')
    const payload = JSON.parse(bodyString)
    const event = payload.event

    logger.info('Razorpay webhook received', { event })

    switch (event) {
      case 'payment.captured':
      case 'payment.successful': {
        const paymentId = payload.payload.payment.entity.id
        const orderId = payload.payload.payment.entity.order_id

        const orders = await Order.find({
          'paymentInfo.razorpayOrderId': orderId,
        })
          .populate('items.product', 'name stock')
          .populate('coupon')
          .sort({ createdAt: -1 })

        if (orders.length === 0) {
          logger.warn('Order not found for Razorpay webhook', { razorpayOrderId: orderId })
          // Always return 200 even if order not found, to avoid Razorpay retries
          return NextResponse.json(
            { success: false, message: 'Order not found' },
            { status: 200 }
          )
        }

        const pendingOrders = orders.filter(
          (order: any) => order.status === 'pending' && order.paymentInfo.status === 'pending'
        )

        for (const order of pendingOrders) {
          const claimedOrder = await Order.findOneAndUpdate(
            {
              _id: order._id,
              status: 'pending',
              'paymentInfo.status': 'pending',
            },
            {
              $set: {
                'paymentInfo.razorpayPaymentId': paymentId,
                'paymentInfo.status': 'paid',
                status: 'confirmed',
              },
              $push: {
                statusHistory: {
                  status: 'confirmed',
                  timestamp: new Date(),
                  note: 'Payment confirmed via webhook',
                },
              },
            },
            { new: true }
          )

          if (!claimedOrder) {
            continue
          }

          await decrementInventory(
            claimedOrder.items.map((item: any) => ({
              product: item.product,
              quantity: item.quantity,
            }))
          )

          // Update coupon usage
          if (order.coupon && order.user) {
            const couponId = order.coupon._id || order.coupon
            await Coupon.findByIdAndUpdate(couponId, {
              $inc: { usedCount: 1 },
              $push: { usedBy: order.user },
            })
          }
        }

        const userIds = Array.from(
          new Set(
            pendingOrders
              .map((order: any) => order.user?.toString())
              .filter(Boolean)
          )
        )

        await Promise.all(
          userIds.map((userId) => Cart.findOneAndDelete({ user: userId }))
        )
        break
      }

      case 'payment.failed': {
        const orderId = payload.payload.payment.entity.order_id

        await Order.updateMany(
          { 'paymentInfo.razorpayOrderId': orderId },
          {
            'paymentInfo.status': 'failed',
            status: 'cancelled',
            $push: {
              statusHistory: {
                status: 'cancelled',
                timestamp: new Date(),
                note: 'Payment failed',
              },
            },
          }
        )
        break
      }

      case 'refund.processed': {
        const paymentId = payload.payload.refund.entity.payment_id

        const orders = await Order.find({
          'paymentInfo.razorpayPaymentId': paymentId,
        })

        for (const order of orders) {
          const refund = payload.payload.refund.entity
          order.paymentInfo.status = 'refunded'
          order.refundStatus = 'processed'
          order.refundAmount = refund.amount / 100 // Convert paise to rupees
          order.refundReason = refund.note || 'Refund processed'

          await order.save()
        }
        break
      }

      default:
        logger.debug('Unhandled Razorpay webhook event', { event })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Webhook error', error)
    return NextResponse.json(
      { success: false, message: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
