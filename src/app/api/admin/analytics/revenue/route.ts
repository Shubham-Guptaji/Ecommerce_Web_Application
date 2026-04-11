import { NextRequest, NextResponse } from 'next/server'
import Order from '@/models/Order'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET(request: NextRequest) {
  try {
    const { session, error } = await requireAdmin()
    if (error) return error

    // Get last 30 days revenue
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const revenueData = await Order.aggregate([
      {
        $match: {
          'paymentInfo.status': 'paid',
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          revenue: { $sum: '$pricing.total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // Fill missing dates
    const dates: any[] = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const existing = revenueData.find((r) => r._id === dateStr)
      dates.push({
        date: dateStr,
        revenue: existing?.revenue || 0,
        orders: existing?.orders || 0,
      })
    }

    return NextResponse.json({
      success: true,
      data: dates,
    })
  } catch (error) {
    console.error('Analytics revenue error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch revenue data' },
      { status: 500 }
    )
  }
}
