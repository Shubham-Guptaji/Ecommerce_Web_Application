// src/app/api/admin/analytics/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Product from '@/models/Product'
import Order from '@/models/Order'
import User from '@/models/User'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET() {
  try {
    const { session, error } = await requireAdmin()
    if (error) return error

    await dbConnect()

    // 1. Top 5 products by soldCount with name and revenue
    const topProducts = await Order.aggregate([
      { $match: { 'paymentInfo.status': 'paid' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          quantitySold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.subtotal' },
        },
      },
      { $sort: { quantitySold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: 1,
          quantitySold: 1,
          revenue: 1,
        },
      },
    ])

    // 2. Revenue by category
    const revenueByCategory = await Order.aggregate([
      { $match: { 'paymentInfo.status': 'paid' } },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      { $unwind: '$productDetails' },
      {
        $group: {
          _id: '$productDetails.category',
          revenue: { $sum: '$items.subtotal' },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          categoryName: '$category.name',
          revenue: 1,
        },
      },
      { $sort: { revenue: -1 } },
    ])

    // 3. Orders by status
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ])

    // 4. New users per day (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const newUsersPerDay = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ])

    return NextResponse.json({
      success: true,
      data: {
        topProducts,
        revenueByCategory,
        ordersByStatus,
        newUsersPerDay,
      },
    })
  } catch (error) {
    console.error('Analytics products error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch product analytics' },
      { status: 500 }
    )
  }
}
