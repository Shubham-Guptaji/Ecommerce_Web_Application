import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Order from '@/models/Order'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET() {
  try {
    const { session, error } = await requireAdmin()
    if (error) return error

    await dbConnect()

    // Get paid orders in the last 30 days (or all time)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const pipeline: any[] = [
      {
        $match: {
          status: {
            $in: ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'],
          },
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      { $unwind: { path: '$items' } },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDetail',
        },
      },
      { $unwind: { path: '$productDetail', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'productDetail.category',
          foreignField: '_id',
          as: 'categoryDetail',
        },
      },
      { $unwind: { path: 'categoryDetail', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$categoryDetail._id',
          name: { $first: '$categoryDetail.name' },
          revenue: { $sum: '$items.subtotal' },
        },
      },
      { $sort: { revenue: -1 } },
    ]

    const result = await Order.aggregate(pipeline)

    // Format as array for pie chart
    const revenueByCategory = result
      .filter((item) => item._id)
      .map((item) => ({
        name: item.name,
        value: item.revenue,
      }))

    return NextResponse.json({
      success: true,
      data: revenueByCategory,
    })
  } catch (error) {
    console.error('Analytics revenue by category error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch revenue by category' },
      { status: 500 }
    )
  }
}
