// src/app/api/payment/create-order/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { dbConnect } from '@/lib/db'
import Order from '@/models/Order'
import Cart from '@/models/Cart'
import Product from '@/models/Product'
import Coupon from '@/models/Coupon'
import Address from '@/models/Address'
import Counter from '@/models/Counter'
import { auth } from '@/lib/auth'
import { requireCSRF } from '@/lib/csrf'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'
import { checkoutSchema } from '@/schemas'

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
})

function normalizeText(value?: string | null) {
  return value?.trim() || ''
}

function areOrderItemsEqual(orderItems: any[], checkoutItems: any[]) {
  if (orderItems.length !== checkoutItems.length) return false

  return orderItems.every((orderItem, index) => {
    const checkoutItem = checkoutItems[index]
    return (
      orderItem.product?.toString() === checkoutItem.product?.toString() &&
      orderItem.quantity === checkoutItem.quantity &&
      orderItem.price === checkoutItem.price &&
      (orderItem.discountedPrice || 0) === (checkoutItem.discountedPrice || 0) &&
      orderItem.subtotal === checkoutItem.subtotal
    )
  })
}

function isMatchingPendingOrder(order: any, payload: {
  items: any[]
  shippingAddress: any
  pricing: any
  notes?: string
  couponId?: string | null
}) {
  return (
    order.status === 'pending' &&
    order.paymentInfo?.method === 'razorpay' &&
    order.paymentInfo?.status === 'pending' &&
    areOrderItemsEqual(order.items || [], payload.items) &&
    order.shippingAddress?.fullName === payload.shippingAddress.fullName &&
    order.shippingAddress?.phone === payload.shippingAddress.phone &&
    order.shippingAddress?.line1 === payload.shippingAddress.line1 &&
    normalizeText(order.shippingAddress?.line2) === normalizeText(payload.shippingAddress.line2) &&
    order.shippingAddress?.city === payload.shippingAddress.city &&
    order.shippingAddress?.state === payload.shippingAddress.state &&
    order.shippingAddress?.pincode === payload.shippingAddress.pincode &&
    order.shippingAddress?.country === payload.shippingAddress.country &&
    (order.pricing?.subtotal || 0) === payload.pricing.subtotal &&
    (order.pricing?.couponDiscount || 0) === payload.pricing.couponDiscount &&
    (order.pricing?.deliveryCharge || 0) === payload.pricing.deliveryCharge &&
    (order.pricing?.tax || 0) === payload.pricing.tax &&
    (order.pricing?.total || 0) === payload.pricing.total &&
    normalizeText(order.notes) === normalizeText(payload.notes) &&
    (order.coupon?.toString?.() || order.coupon?.toString?.() || '') === (payload.couponId || '')
  )
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

    // CSRF check
    const csrf = await requireCSRF(request)
    if (!csrf.valid) {
      return csrf.response
    }

    await dbConnect()

    const body = await request.json()
    const { addressId, deliveryMethod, couponCode, notes } = checkoutSchema.parse(body)

    // Fetch and validate address
    const address = await Address.findById(addressId)
    if (!address) {
      return NextResponse.json(
        { success: false, message: 'Address not found' },
        { status: 404 }
      )
    }

    if (address.user.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized address' },
        { status: 403 }
      )
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: session.user.id })
      .populate('items.product', 'name price discountedPrice stock images')
      .lean() as any

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Cart is empty' },
        { status: 400 }
      )
    }

    // Validate stock for all items
    for (const item of cart.items) {
      const product = item.product as any
      if (product.stock < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            message: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
          },
          { status: 400 }
        )
      }
    }

    // Calculate pricing
    const subtotal = cart.items.reduce((total: number, item: any) => {
      const product = item.product as any
      const price = product.discountedPrice || product.price
      return total + price * item.quantity
    }, 0)

    let couponDiscount = 0
    let couponId = null

    // Apply coupon if provided
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true })
      if (coupon) {
        const isValid = await coupon.isValid(session.user.id)
        if (!isValid) {
          return NextResponse.json(
            { success: false, message: 'Coupon is not valid or has expired' },
            { status: 400 }
          )
        }

        if (subtotal < coupon.minOrderValue) {
          return NextResponse.json(
            {
              success: false,
              message: `Minimum order value of ${coupon.minOrderValue} required for this coupon`,
            },
            { status: 400 }
          )
        }

        couponDiscount = coupon.calculateDiscount(subtotal)
        couponId = coupon._id
      }
    }

    // Delivery charge
    const freeDeliveryThreshold = 499 // Can be made configurable
    let deliveryCharge = subtotal >= freeDeliveryThreshold ? 0 : 49

    if (deliveryMethod === 'express') {
      deliveryCharge = 99 // Express delivery charge
    }

    // Tax calculation (assuming 18% GST)
    const taxRate = 0.18
    const taxableAmount = subtotal - couponDiscount
    const tax = Math.round(taxableAmount * taxRate)

    // Total
    const total = taxableAmount + deliveryCharge + tax

    const orderItems = cart.items.map((item: any) => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.images?.[0]?.url,
      price: item.product.price,
      discountedPrice: item.product.discountedPrice,
      quantity: item.quantity,
      subtotal: (item.product.discountedPrice || item.product.price) * item.quantity,
    }))

    const shippingAddress = {
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country,
    }

    const pricing = {
      subtotal,
      discount: 0,
      couponDiscount,
      deliveryCharge,
      tax,
      total,
    }

    const existingPendingOrders = await Order.find({
      user: session.user.id,
      status: 'pending',
      'paymentInfo.method': 'razorpay',
      'paymentInfo.status': 'pending',
    }).sort({ createdAt: -1 })

    const matchingPendingOrder = existingPendingOrders.find((existingOrder: any) =>
      isMatchingPendingOrder(existingOrder, {
        items: orderItems,
        shippingAddress,
        pricing,
        notes,
        couponId: couponId?.toString() || '',
      })
    )

    if (matchingPendingOrder?.paymentInfo?.razorpayOrderId) {
      return NextResponse.json({
        success: true,
        data: {
          orderId: matchingPendingOrder._id,
          razorpayOrderId: matchingPendingOrder.paymentInfo.razorpayOrderId,
          amount: matchingPendingOrder.pricing.total,
          currency: 'INR',
          key: env.RAZORPAY_KEY_ID,
          name: 'E-Shop',
          description: `Order ${matchingPendingOrder.orderNumber}`,
          prefill: {
            name: session.user.name || '',
            email: session.user.email || '',
            phone: '',
          },
        },
      })
    }

    const stalePendingOrderIds = existingPendingOrders
      .filter((existingOrder: any) => existingOrder._id.toString() !== matchingPendingOrder?._id?.toString())
      .map((existingOrder: any) => existingOrder._id)

    if (stalePendingOrderIds.length > 0) {
      await Order.updateMany(
        { _id: { $in: stalePendingOrderIds } },
        {
          $set: {
            status: 'cancelled',
            'paymentInfo.status': 'failed',
          },
          $push: {
            statusHistory: {
              status: 'cancelled',
              timestamp: new Date(),
              note: 'Cancelled automatically because a newer checkout attempt was started',
            },
          },
        }
      )
    }

    // Generate order number
    let orderNumber: string
    try {
      const counter = await Counter.findOneAndUpdate(
        { _id: 'order' },
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
      )
      orderNumber = `ORD-${String(counter.seq).padStart(6, '0')}`
    } catch (error) {
      // Fallback to timestamp-based order number if counter fails
      const timestamp = Date.now().toString(36).toUpperCase()
      const random = Math.random().toString(36).substring(2, 6).toUpperCase()
      orderNumber = `ORD-${timestamp}-${random}`
    }

    // Create order document
    const order = new Order({
      orderNumber,
      user: session.user.id,
      items: orderItems,
      shippingAddress,
      status: 'pending',
      paymentInfo: {
        method: 'razorpay',
        status: 'pending',
      },
      pricing,
      coupon: couponId,
      notes,
      expectedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      statusHistory: [{
        status: 'pending',
        timestamp: new Date(),
        note: 'Order placed',
      }],
    })

    await order.save()
    logger.info('Pending order created', { orderId: order._id, orderNumber })

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100), // Razorpay expects amount in paise
      currency: 'INR',
      receipt: order._id.toString(),
      notes: {
        orderId: order._id.toString(),
        userId: session.user.id!,
      },
    })

    logger.info('Razorpay order created', { razorpayOrderId: razorpayOrder.id, orderId: order._id })

    // Update order with razorpay order ID
    order.paymentInfo.razorpayOrderId = razorpayOrder.id
    await order.save()
    logger.debug('Order updated with Razorpay order id', {
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
    })

    return NextResponse.json({
      success: true,
      data: {
        orderId: order._id,
        razorpayOrderId: razorpayOrder.id,
        amount: total,
        currency: 'INR',
        key: env.RAZORPAY_KEY_ID,
        name: 'E-Shop',
        description: `Order ${order.orderNumber}`,
        prefill: {
          name: session.user.name || '',
          email: session.user.email || '',
          phone: '',
        },
      },
    })
  } catch (error) {
    logger.error('Create payment order error', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create payment order' },
      { status: 500 }
    )
  }
}
