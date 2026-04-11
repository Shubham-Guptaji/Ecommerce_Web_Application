// src/app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Order from '@/models/Order'
import { requireAdmin } from '@/lib/adminAuth'
import { z } from 'zod'

const ordersQuerySchema = z.object({
  status: z.string().optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
  method: z.enum(['razorpay', 'cod']).optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sort: z.enum(['date', 'total']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { session, error } = await requireAdmin()
    if (error) return error

    await dbConnect()

    const searchParams = request.nextUrl.searchParams
    const queryObj = Object.fromEntries(searchParams.entries())

    // Validate query
    const validatedQuery = ordersQuerySchema.parse({
      status: queryObj.status,
      paymentStatus: queryObj.paymentStatus,
      method: queryObj.method,
      search: queryObj.search,
      dateFrom: queryObj.dateFrom,
      dateTo: queryObj.dateTo,
      sort: queryObj.sort,
      sortOrder: queryObj.sortOrder,
      page: queryObj.page ? parseInt(queryObj.page as string) : 1,
      limit: queryObj.limit ? parseInt(queryObj.limit as string) : 20,
    })

    const page = validatedQuery.page!
    const limit = validatedQuery.limit!
    const skip = (page - 1) * limit

    // Build query
    const buildQuery: any = {}

    if (validatedQuery.status) {
      buildQuery.status = validatedQuery.status
    }

    if (validatedQuery.paymentStatus) {
      buildQuery['paymentInfo.status'] = validatedQuery.paymentStatus
    }

    if (validatedQuery.method) {
      buildQuery['paymentInfo.method'] = validatedQuery.method
    }

    if (validatedQuery.search) {
      buildQuery.$or = [
        { orderNumber: { $regex: validatedQuery.search, $options: 'i' } },
        { 'user.email': { $regex: validatedQuery.search, $options: 'i' } },
      ]
    }

    // Date range filter (by created date)
    if (validatedQuery.dateFrom || validatedQuery.dateTo) {
      buildQuery.createdAt = {}
      if (validatedQuery.dateFrom) {
        buildQuery.createdAt.$gte = new Date(validatedQuery.dateFrom)
      }
      if (validatedQuery.dateTo) {
        // Include the entire day: set time to end of day
        const toDate = new Date(validatedQuery.dateTo)
        toDate.setHours(23, 59, 59, 999)
        buildQuery.createdAt.$lte = toDate
      }
    }

    // Sorting
    let sort: any = {}
    if (validatedQuery.sort) {
      switch (validatedQuery.sort) {
        case 'date':
          sort.createdAt = validatedQuery.sortOrder === 'asc' ? 1 : -1
          break
        case 'total':
          sort['pricing.total'] = validatedQuery.sortOrder === 'asc' ? 1 : -1
          break
        default:
          sort.createdAt = -1
      }
    } else {
      sort.createdAt = -1
    }

    const [orders, total] = await Promise.all([
      Order.find(buildQuery)
        .populate('user', 'name email')
        .populate('items.product', 'name images sku')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(buildQuery),
    ])

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Admin orders GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}
