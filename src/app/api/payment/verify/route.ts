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
import { paymentVerifySchema } from '@/schemas'

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

    console.log('Payment verification:', {
      razorpayOrderId,
      razorpayPaymentId,
      userId: session.user.id,
    })

    // Verify signature using timing-safe comparison
    const generatedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex')

    console.log('Signature verification:', {
      generatedSignature,
      receivedSignature: razorpaySignature,
      match: generatedSignature === razorpaySignature,
    })

    const signatureBuffers = [generatedSignature, razorpaySignature].map((sig) =>
      Buffer.from(sig, 'hex')
    )
    if (!crypto.timingSafeEqual(signatureBuffers[0], signatureBuffers[1])) {
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

    console.log('Orders found by razorpayOrderId:', orders.map((order: any) => order._id))
    console.log('Session user ID:', session.user.id)

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
      console.log('User mismatch:', { orderUserId, sessionUserId: session.user.id })
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
        console.error('Failed to send confirmation email:', emailError)
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
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { success: false, message: 'Payment verification failed' },
      { status: 500 }
    )
  }
}
