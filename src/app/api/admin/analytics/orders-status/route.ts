import { NextRequest, NextResponse } from 'next/server'
import Order from '@/models/Order'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET() {
  try {
    const { session, error } = await requireAdmin()
    if (error) return error

    const result = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ])

    // Format as array of objects with status and count
    const ordersByStatus = result.map((item) => ({
      status: item._id,
      count: item.count,
    }))

    return NextResponse.json({
      success: true,
      data: ordersByStatus,
    })
  } catch (error) {
    console.error('Analytics orders status error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch orders by status' },
      { status: 500 }
    )
  }
}
