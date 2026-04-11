import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Order, { type IOrder } from '@/models/Order'
import { sendOrderStatusEmail } from '@/lib/emails'

type TrackOrderUser = {
  name: string
  email: string
}

type TrackOrderResult = Omit<IOrder, 'user'> & {
  user: TrackOrderUser
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderNumber, email } = body

    if (!orderNumber || !email) {
      return NextResponse.json(
        { success: false, message: 'Order number and email are required' },
        { status: 400 }
      )
    }

    await dbConnect()

    // Find order by orderNumber and populate user details
    const order = await Order.findOne({ orderNumber: orderNumber.toUpperCase() })
      .populate('user', 'name email')
      .lean<TrackOrderResult | null>()

    if (!order || !order.user) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      )
    }

    // Verify email matches (case insensitive)
    const userEmail = order.user.email
    if (userEmail.toLowerCase() !== email.toLowerCase()) {
      // Don't reveal too much information for security
      return NextResponse.json(
        { success: false, message: 'Order not found or email does not match' },
        { status: 404 }
      )
    }

    const user = {
      name: order.user.name,
      email: userEmail,
    }

    // Send tracking email notification
    try {
      if (user.email) {
        sendOrderStatusEmail(order, { name: user.name, email: user.email })
      }
    } catch (emailError) {
      console.error('Failed to send tracking email:', emailError)
      // Don't fail the request if email fails
    }

    // Return tracking data (exclude sensitive information)
    const {
      _id,
      user: _,
      items,
      shippingAddress,
      pricing,
      coupon,
      refundReason,
      refundAmount,
      refundStatus,
      ...trackingData
    } = order

    return NextResponse.json({
      success: true,
      data: {
        ...trackingData,
        user: { name: user.name, email: user.email },
        items: items.map((item: any) => ({
          name: item.name,
          image: item.image,
          price: item.price,
          discountedPrice: item.discountedPrice,
          quantity: item.quantity,
          subtotal: item.subtotal,
        })),
        shippingAddress,
        pricing,
      },
      message: 'Tracking information retrieved successfully',
    })
  } catch (error) {
    console.error('Track order error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to track order' },
      { status: 500 }
    )
  }
}
