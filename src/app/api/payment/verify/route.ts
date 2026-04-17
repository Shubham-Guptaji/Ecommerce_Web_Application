// File path: src/app/api/payment/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { dbConnect } from '@/lib/db'
import Order from '@/models/Order'
import Cart from '@/models/Cart'
import Coupon from '@/models/Coupon'
import { auth } from '@/lib/auth'
import { env } from '@/lib/env'
import { sendOrderConfirmationEmail } from '@/lib/emails'
import { decrementInventory } from '@/lib/inventory'
import { logger } from '@/lib/logger'
import { paymentVerifySchema } from '@/schemas'

function toHexBuffer(signature: string) {
  return /^[0-9a-f]+$/i.test(signature) && signature.length % 2 === 0
    ? Buffer.from(signature, 'hex')
    : null
}

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
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = paymentVerifySchema.parse(body)

    logger.debug('Payment verification request', {
      razorpayOrderId,
      razorpayPaymentId,
      userId: session.user.id,
    })

    // Verify signature using timing-safe comparison
    const generatedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex')

    const generatedBuffer = toHexBuffer(generatedSignature)
    const receivedBuffer = toHexBuffer(razorpaySignature)
    const isSignatureValid =
      generatedBuffer !== null &&
      receivedBuffer !== null &&
      generatedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(generatedBuffer, receivedBuffer)

    logger.debug('Payment signature verification result', {
      razorpayOrderId,
      userId: session.user.id,
      isSignatureValid,
    })

    if (!isSignatureValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid payment signature' },
        { status: 400 }
      )
    }

    // Fetch every order tied to the Razorpay order. Under normal flow there
    // should only be one, but this keeps payment confirmation resilient.
    const orders = await Order.find({
      'paymentInfo.razorpayOrderId': razorpayOrderId,
    })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name price discountedPrice quantity')
      .populate('coupon')
      .populate('user', 'name email')

    logger.debug('Orders found for Razorpay order', {
      razorpayOrderId,
      orderIds: orders.map((order: any) => order._id),
      userId: session.user.id,
    })

    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      )
    }

    const unauthorizedOrder = orders.find((order: any) => {
      const orderUserId = order.user?._id || order.user
      return orderUserId?.toString() !== session.user.id
    })

    if (unauthorizedOrder) {
      const orderUserId = unauthorizedOrder.user?._id || unauthorizedOrder.user
      logger.warn('Payment verification user mismatch', {
        orderUserId,
        sessionUserId: session.user.id,
        razorpayOrderId,
      })
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Order does not belong to this user' },
        { status: 403 }
      )
    }

    const primaryOrder = orderId
      ? orders.find((order: any) => order._id.toString() === orderId) || orders[0]
      : orders[0]

    const pendingOrders = orders.filter(
      (order: any) => order.status === 'pending' && order.paymentInfo.status === 'pending'
    )

    if (pendingOrders.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          orderId: primaryOrder._id,
          orderNumber: primaryOrder.orderNumber,
          message: 'Payment already verified',
          redirectUrl: `/orders/${primaryOrder._id}/success`,
        },
      })
    }

    for (const order of pendingOrders) {
      const claimedOrder = await Order.findOneAndUpdate(
        {
          _id: order._id,
          status: 'pending',
          'paymentInfo.status': 'pending',
        },
        {
          $set: {
            'paymentInfo.razorpayPaymentId': razorpayPaymentId,
            'paymentInfo.razorpaySignature': razorpaySignature,
            'paymentInfo.status': 'paid',
            status: 'confirmed',
          },
          $push: {
            statusHistory: {
              status: 'confirmed',
              timestamp: new Date(),
              note: 'Payment confirmed',
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

      if (order.coupon) {
        const couponId = (order.coupon as any)._id || order.coupon
        await Coupon.findByIdAndUpdate(couponId, {
          $inc: { usedCount: 1 },
          $push: { usedBy: session.user.id },
        })
      }

      try {
        if (order.user?.email) {
          sendOrderConfirmationEmail(claimedOrder, order.user)
        }
      } catch (emailError) {
        logger.error('Failed to send confirmation email', emailError)
      }
    }

    // Clear user's cart
    await Cart.findOneAndDelete({ user: session.user.id })

    return NextResponse.json({
      success: true,
      data: {
        orderId: primaryOrder._id,
        orderNumber: primaryOrder.orderNumber,
        message: 'Payment verified successfully',
        redirectUrl: `/orders/${primaryOrder._id}/success`,
      },
    })
  } catch (error) {
    logger.error('Payment verification error', error)
    return NextResponse.json(
      { success: false, message: 'Payment verification failed' },
      { status: 500 }
    )
  }
}
