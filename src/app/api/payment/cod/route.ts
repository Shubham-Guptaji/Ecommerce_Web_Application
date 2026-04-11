// src/app/api/payment/cod/route.ts
// src/app/api/payment/cod/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Order from '@/models/Order'
import Cart from '@/models/Cart'
import Product from '@/models/Product'
import Coupon from '@/models/Coupon'
import Address from '@/models/Address'
import User from '@/models/User'
import Counter from '@/models/Counter'
import { auth } from '@/lib/auth'
import { sendOrderConfirmationEmail } from '@/lib/emails'

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
    const { addressId, deliveryMethod, couponCode, notes } = body

    // Validation
    if (!addressId) {
      return NextResponse.json(
        { success: false, message: 'Delivery address is required' },
        { status: 400 }
      )
    }

    // Validate COD limit: total <= 5000
    // We'll calculate after getting cart to ensure total is within limit
    // But for now, we'll validate after calculations

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
    let couponData = null

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

        couponData = {
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          discountAmount: couponDiscount,
        }
      }
    }

    // Delivery charge
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

    // Validate COD limit (max ₹5000)
    if (total > 5000) {
      return NextResponse.json(
        { success: false, message: 'Cash on Delivery is not available for orders above ₹5000' },
        { status: 400 }
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
      status: 'confirmed',
      paymentInfo: {
        method: 'cod',
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
      coupon: couponData,
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

    // Reduce stock
    for (const item of cart.items) {
      const product = item.product as any
      const productId = product._id
      const quantity = item.quantity
      await Product.findByIdAndUpdate(productId, {
        $inc: { stock: -quantity, soldCount: quantity },
      })
    }

    // Update coupon usage if applied
    if (order.coupon) {
      await Coupon.findByIdAndUpdate(order.coupon._id, {
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
    console.error('COD payment error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to place COD order' },
      { status: 500 }
    )
  }
}