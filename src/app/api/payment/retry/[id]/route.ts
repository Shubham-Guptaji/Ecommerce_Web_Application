import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Order from '@/models/Order'
import { auth } from '@/lib/auth'
import { requireCSRF } from '@/lib/csrf'
import { env } from '@/lib/env'

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

    const csrf = await requireCSRF(request)
    if (!csrf.valid) {
      return csrf.response
    }

    const { id } = await params

    await dbConnect()

    const order = await Order.findOne({
      _id: id,
      user: session.user.id,
      status: 'pending',
      'paymentInfo.method': 'razorpay',
      'paymentInfo.status': 'pending',
    }).lean() as any

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: 'Pending Razorpay order not found or it is no longer payable',
        },
        { status: 404 }
      )
    }

    if (!order.paymentInfo?.razorpayOrderId) {
      return NextResponse.json(
        {
          success: false,
          message: 'This order cannot be retried because its payment session is missing',
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId: order._id,
        razorpayOrderId: order.paymentInfo.razorpayOrderId,
        amount: order.pricing.total,
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
    console.error('Retry payment error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to load payment session' },
      { status: 500 }
    )
  }
}
