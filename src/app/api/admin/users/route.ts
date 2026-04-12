import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import User from '@/models/User'
import Order from '@/models/Order'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET(request: NextRequest) {
  try {
    const { session, error } = await requireAdmin()
    if (error) return error

    await dbConnect()

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const role = searchParams.get('role') // 'user' or 'admin'
    const isEmailVerified = searchParams.get('isEmailVerified') // 'true' or 'false'
    const isActive = searchParams.get('isActive') // 'true' or 'false'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const query: any = {}

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }

    if (role) {
      query.role = role
    }

    if (isEmailVerified !== null && isEmailVerified !== undefined) {
      query.isEmailVerified = isEmailVerified === 'true'
    }

    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === 'true'
    }

    const skip = (page - 1) * limit

    const sort: any = {}
    if (sortBy === 'name' || sortBy === 'email' || sortBy === 'createdAt') {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1
    } else {
      sort.createdAt = -1
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -resetPasswordToken -emailVerifyToken')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ])

    const userIds = users.map((user: any) => user._id)
    const orderStats = userIds.length > 0
      ? await Order.aggregate([
          {
            $match: {
              user: { $in: userIds },
              status: { $in: ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'] },
            },
          },
          {
            $group: {
              _id: '$user',
              orderCount: { $sum: 1 },
              totalSpent: { $sum: '$pricing.total' },
            },
          },
        ])
      : []

    const statsByUser = new Map(
      orderStats.map((stat: any) => [stat._id.toString(), stat])
    )

    const usersWithStats = users.map((user: any) => {
      const stats = statsByUser.get(user._id.toString())
      return {
        ...user,
        orderCount: stats?.orderCount || 0,
        totalSpent: stats?.totalSpent || 0,
      }
    })

    return NextResponse.json({
      success: true,
      data: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Admin users GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
