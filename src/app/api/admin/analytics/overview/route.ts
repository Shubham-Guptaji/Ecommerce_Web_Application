import { NextRequest, NextResponse } from 'next/server'
import Order from '@/models/Order'
import User from '@/models/User'
import Product from '@/models/Product'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET() {
  try {
    const { session, error } = await requireAdmin()
    if (error) return error

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = startOfMonth

    // Total revenue this month
    const [thisMonthRevenue, lastMonthRevenue, todayOrders, thisWeekOrders, thisMonthOrders, newUsers, activeProducts, lowStockCount, lowStockProducts] = await Promise.all([
      Order.aggregate([
        { $match: { 'paymentInfo.status': 'paid', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } },
      ]),
      Order.aggregate([
        { $match: { 'paymentInfo.status': 'paid', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } },
      ]),
      Order.countDocuments({
        createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
      }),
      Order.countDocuments({
        createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      }),
      Order.countDocuments({
        createdAt: { $gte: startOfMonth },
      }),
      User.countDocuments({
        createdAt: { $gte: startOfMonth },
      }),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ stock: { $lt: 10 }, isActive: true }),
      Product.find({ stock: { $lt: 10 }, isActive: true })
        .select('_id name sku stock images')
        .sort({ stock: 1 })
        .limit(10)
        .lean(),
    ])

    const currentRevenue = thisMonthRevenue[0]?.total || 0
    const previousRevenue = lastMonthRevenue[0]?.total || 0
    const revenueChange = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue: currentRevenue,
        revenueChange: Math.round(revenueChange * 100) / 100,
        totalOrders: thisMonthOrders,
        ordersToday: todayOrders,
        ordersThisWeek: thisWeekOrders,
        newUsers: newUsers,
        activeProducts: activeProducts,
        lowStockProductsCount: lowStockCount,
        lowStockProducts: lowStockProducts,
      },
    })
  } catch (error) {
    console.error('Analytics overview error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
