import { NextRequest, NextResponse } from 'next/server'
import Order from '@/models/Order'
import '@/models/Coupon'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { session, error } = await requireAdmin()
    if (error) return error

    const order = await Order.findOne({ _id: id })
      .populate('user', 'name email')
      .populate('items.product', 'name images sku')
      .populate('coupon')
      .populate('shippingAddress', '_id fullName phone line1 line2 city state pincode country')
      .lean() as any

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: order,
    })
  } catch (error) {
    console.error('Admin order GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { session, error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const { status, trackingNumber, courierName, adminNote } = body

    const order = await Order.findOne({ _id: id })
      .populate('user', 'name email')
      .lean() as any as any

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}

    if (status) {
      updateData.status = status
      // Add status history entry if status changed or note provided
      const statusChanged = status !== order.status
      if (statusChanged || adminNote) {
        const historyEntry: any = {
          status,
          timestamp: new Date(),
        }
        if (adminNote) {
          historyEntry.note = adminNote
        } else {
          historyEntry.note = `Status updated to ${status} by admin`
        }
        updateData.$push = { statusHistory: historyEntry }
      }
    }

    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber
    if (courierName !== undefined) updateData.courierName = courierName

    // If only adminNote provided and no status change, store in adminNote field
    if (adminNote && (!status || status === order.status)) {
      updateData.adminNote = adminNote
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )

    // Send status update email if status changed
    if (status && status !== order.status) {
      try {
        // Dynamically import to avoid heavy dependency
        const { sendOrderStatusEmail } = await import('@/lib/emails')
        if (order.user?.email) {
          await sendOrderStatusEmail(updatedOrder.toObject(), { name: order.user.name, email: order.user.email })
        }
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedOrder,
    })
  } catch (error) {
    console.error('Admin order PUT error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update order' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { session, error } = await requireAdmin()
    if (error) return error

    // Soft delete - set status to cancelled
    const order = await Order.findByIdAndUpdate(
      id,
      {
        status: 'cancelled',
        $push: {
          statusHistory: {
            status: 'cancelled',
            timestamp: new Date(),
            note: 'Order deleted by admin',
          },
        },
      },
      { new: true }
    )

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Order deleted',
      data: order,
    })
  } catch (error) {
    console.error('Admin order DELETE error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete order' },
      { status: 500 }
    )
  }
}
