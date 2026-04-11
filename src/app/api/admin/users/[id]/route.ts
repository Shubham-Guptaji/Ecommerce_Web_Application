import { NextRequest, NextResponse } from 'next/server'
import User from '@/models/User'
import Order from '@/models/Order'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { session, error } = await requireAdmin()
    if (error) return error

    const user = await User.findById(id)
      .select('-password -resetPasswordToken -emailVerifyToken')
      .populate('addresses')
      .populate('defaultAddress')
      .lean() as any

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Get order statistics
    const orderStats = await Order.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalSpent: { $sum: '$pricing.total' },
        },
      },
    ])

    // Get recent orders
    const recentOrders = await Order.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()

    const stats = {
      totalOrders: orderStats.reduce((sum, stat) => sum + stat.count, 0),
      totalSpent: orderStats.reduce((sum, stat) => sum + (stat.totalSpent || 0), 0),
      statusBreakdown: orderStats.reduce((acc, stat) => {
        acc[stat._id] = { count: stat.count, total: stat.totalSpent }
        return acc
      }, {}),
    }

    // Transform orders for response
    const orders = recentOrders.map((order: any) => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.pricing?.total || 0,
      createdAt: order.createdAt,
      items: order.items || [],
    }))

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        orders,
        ...stats,
      },
    })
  } catch (error) {
    console.error('Admin user GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user' },
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
    const { role, isActive } = body

    const updateData: any = {}

    if (role) updateData.role = role
    if (isActive !== undefined) updateData.isActive = isActive

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken -emailVerifyToken')

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error('Admin user PUT error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update user' },
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

    // Anonymize user data but keep orders intact
    const anonData = {
      name: 'Deleted User',
      email: `deleted-${id}@deleted.com`,
      password: 'deleted',
      avatar: {},
      isActive: false,
    }

    const user = await User.findByIdAndUpdate(
      id,
      anonData,
      { new: true }
    ).select('-password -resetPasswordToken -emailVerifyToken')

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted (anonymized)',
    })
  } catch (error) {
    console.error('Admin user DELETE error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
