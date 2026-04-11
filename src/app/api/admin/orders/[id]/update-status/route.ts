// File path: src/app/api/admin/orders/[id]/update-status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Order from '@/models/Order'
import { requireAdmin } from '@/lib/adminAuth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const { status, trackingNumber, courierName, note, adminNote } = body

    if (!status) {
      return NextResponse.json(
        { success: false, message: 'Status is required' },
        { status: 400 }
      )
    }

    const order = await Order.findOne({ _id: id }).lean()

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      )
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
          ...(trackingNumber && { trackingNumber }),
          ...(courierName && { courierName }),
        },
        $push: {
          statusHistory: {
            status,
            timestamp: new Date(),
            note: note || adminNote || `Status updated to ${status}`,
          },
        },
      },
      { new: true }
    ).populate('user', 'name email')

    // Send notification email to customer
    try {
      if (updatedOrder.user?.email) {
        const { sendOrderStatusEmail } = await import('@/lib/emails')
        sendOrderStatusEmail(updatedOrder, updatedOrder.user)
      }
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      data: updatedOrder,
    })
  } catch (error) {
    console.error('Update order status error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update order status' },
      { status: 500 }
    )
  }
}
