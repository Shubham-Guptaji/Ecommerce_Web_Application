import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import Order from '@/models/Order'

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'refunded',
] as const

type AdminOrderUpdate = {
  status?: string
  trackingNumber?: string
  courierName?: string
  adminNote?: string
  note?: string
}

export function isValidOrderId(id: string) {
  return mongoose.Types.ObjectId.isValid(id)
}

function isValidOrderStatus(status: string) {
  return ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])
}

export async function updateAdminOrder(id: string, body: AdminOrderUpdate) {
  if (!isValidOrderId(id)) {
    return NextResponse.json(
      { success: false, message: 'Invalid order ID' },
      { status: 400 }
    )
  }

  const { status, trackingNumber, courierName, adminNote, note } = body

  if (status !== undefined && !isValidOrderStatus(status)) {
    return NextResponse.json(
      { success: false, message: 'Invalid order status' },
      { status: 400 }
    )
  }

  const order = await Order.findOne({ _id: id })
    .populate('user', 'name email')
    .lean() as any

  if (!order) {
    return NextResponse.json(
      { success: false, message: 'Order not found' },
      { status: 404 }
    )
  }

  const updateData: any = {}

  if (status) {
    updateData.status = status
    const statusChanged = status !== order.status
    if (statusChanged || adminNote || note) {
      updateData.$push = {
        statusHistory: {
          status,
          timestamp: new Date(),
          note: note || adminNote || `Status updated to ${status} by admin`,
        },
      }
    }
  }

  if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber
  if (courierName !== undefined) updateData.courierName = courierName

  if ((adminNote || note) && (!status || status === order.status)) {
    updateData.adminNote = adminNote || note
  }

  const updatedOrder = await Order.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  )

  if (status && status !== order.status) {
    try {
      const { sendOrderStatusEmail } = await import('@/lib/emails')
      if (order.user?.email) {
        await sendOrderStatusEmail(updatedOrder.toObject(), {
          name: order.user.name,
          email: order.user.email,
        })
      }
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError)
    }
  }

  return NextResponse.json({
    success: true,
    data: updatedOrder,
  })
}
