// File path: src/app/api/admin/orders/[id]/update-status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { isValidOrderId, updateAdminOrder } from '@/lib/admin-orders'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error } = await requireAdmin()
    if (error) return error

    if (!isValidOrderId(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid order ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    return updateAdminOrder(id, body)
  } catch (error) {
    console.error('Update order status error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update order status' },
      { status: 500 }
    )
  }
}
