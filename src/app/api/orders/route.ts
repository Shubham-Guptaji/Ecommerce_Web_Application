// File path: src/app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Order from '@/models/Order'
import Coupon from '@/models/Coupon'
import Cart from '@/models/Cart'
import Address from '@/models/Address'
import User from '@/models/User'
import Counter from '@/models/Counter'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { sendOrderConfirmationEmail } from '@/lib/emails'
import { decrementInventory } from '@/lib/inventory'
import { checkoutSchema } from '@/schemas'

const orderQuerySchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  status: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    const searchParams = request.nextUrl.searchParams
    const query = Object.fromEntries(searchParams.entries())

    const { page = 1, limit = 10, status } = orderQuerySchema.parse({
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 10,
      status: query.status,
    })

    const buildQuery: any = { user: session.user.id }

    if (status === 'active') {
      buildQuery.status = {
        $in: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery'],
      }
    } else if (status) {
      buildQuery.status = status
    }

    const skip = (page - 1) * limit

    const [orders, total] = await Promise.all([
      Order.find(buildQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean() as any,
      Order.countDocuments(buildQuery),
    ])

    // Get order status statistics
    const statusCounts = await Order.aggregate([
      { $match: { user: session.user.id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ])

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: statusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count
        return acc
      }, {} as Record<string, number>),
    })
  } catch (error) {
    console.error('Orders GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
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
    const { addressId, deliveryMethod, couponCode, notes } = checkoutSchema.parse(body)
    const paymentMethod = body.paymentMethod || 'cod'

    // addressId is validated by checkoutSchema

    // Fetch address
    const address = await Address.findById(addressId)
    if (!address) {
      return NextResponse.json(
        { success: false, message: 'Address not found' },
        { status: 404 }
      )
    }

    // Verify address belongs to user
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

    // Delivery charge (same as create-order)
    const freeDeliveryThreshold = 499
    let deliveryCharge = subtotal >= freeDeliveryThreshold ? 0 : 49
    if (deliveryMethod === 'express') {
      deliveryCharge = 99
    }

    // Tax (18% GST)
    const taxRate = 0.18
    const taxableAmount = subtotal - couponDiscount
    const tax = Math.round(taxableAmount * taxRate)

    // Total
    const total = taxableAmount + deliveryCharge + tax

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

    // Create order
    const order = new Order({
      orderNumber,
      user: session.user.id,
      items: cart.items.map((item: any) => ({
        product: item.product._id,
        name: item.product.name,
        image: item.product.images?.[0]?.url,
        price: item.product.price,
        discountedPrice: item.product.discountedPrice,
        quantity: item.quantity,
        subtotal: (item.product.discountedPrice || item.product.price) * item.quantity,
      })),
      shippingAddress: {
        fullName: address.fullName,
        phone: address.phone,
        line1: address.line1,
        line2: address.line2 || '',
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country,
      },
      status: 'confirmed', // COD orders are confirmed immediately
      paymentInfo: {
        method: paymentMethod as 'cod',
        status: 'pending', // Payment to be collected on delivery
      },
      pricing: {
        subtotal,
        discount: 0,
        couponDiscount,
        deliveryCharge,
        tax,
        total,
      },
      coupon: couponId,
      notes,
      expectedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
      statusHistory: [
        {
          status: 'confirmed',
          timestamp: new Date(),
          note: 'Order confirmed (Cash on Delivery)',
        },
      ],
    })

    await order.save()

    try {
      await decrementInventory(
        cart.items.map((item: any) => ({
          product: item.product._id,
          quantity: item.quantity,
        }))
      )
    } catch (inventoryError) {
      await Order.findByIdAndDelete(order._id)
      return NextResponse.json(
        {
          success: false,
          message: 'One or more products went out of stock before the order could be confirmed',
        },
        { status: 409 }
      )
    }

    // Update coupon usage if applied
    if (order.coupon) {
      await Coupon.findByIdAndUpdate(order.coupon, {
        $inc: { usedCount: 1 },
        $push: { usedBy: session.user.id },
      })
    }

    // Send order confirmation email
    try {
      const user = await User.findById(session.user.id).select('name email').lean() as any
      if (user?.email) {
        sendOrderConfirmationEmail(order, user)
      }
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
      // Don't fail the request if email fails
    }

    // Clear user's cart
    await Cart.findOneAndDelete({ user: session.user.id })

    // Return the created order
    return NextResponse.json({
      success: true,
      data: order,
    })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create order' },
      { status: 500 }
    )
  }
}
