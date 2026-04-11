// src/app/api/admin/orders/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Order from '@/models/Order'
import { requireAdmin } from '@/lib/adminAuth'

const getItemCount = (items: Array<{ quantity?: number }> = []) =>
  items.reduce((total, item) => total + (item.quantity || 0), 0)

export async function GET(request: NextRequest) {
  try {
    const { session, error } = await requireAdmin()
    if (error) return error

    await dbConnect()

    // Reuse the same query logic as the orders list, but without pagination
    const searchParams = request.nextUrl.searchParams
    // Build query similar to GET /api/admin/orders (could factor out, but for simplicity duplicate)
    // We'll copy the query parsing from the orders route but limit to a large number.
    // For simplicity, we can call the orders route itself? Not ideal due to double limit. We'll replicate.

    // For brevity, we'll fetch all matching orders with a high limit (e.g., 10000)
    // In production, consider streaming for large data.

    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')
    const method = searchParams.get('method')
    const search = searchParams.get('search')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const sort = searchParams.get('sort') || 'date'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const buildQuery: any = {}

    if (status) buildQuery.status = status
    if (paymentStatus) buildQuery['paymentInfo.status'] = paymentStatus
    if (method) buildQuery['paymentInfo.method'] = method

    if (search) {
      buildQuery.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } },
      ]
    }

    if (dateFrom || dateTo) {
      buildQuery.createdAt = {}
      if (dateFrom) buildQuery.createdAt.$gte = new Date(dateFrom)
      if (dateTo) {
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        buildQuery.createdAt.$lte = toDate
      }
    }

    // Sorting
    let sortObj: any = {}
    if (sort === 'date') {
      sortObj.createdAt = sortOrder === 'asc' ? 1 : -1
    } else if (sort === 'total') {
      sortObj['pricing.total'] = sortOrder === 'asc' ? 1 : -1
    } else {
      sortObj.createdAt = -1
    }

    const orders = await Order.find(buildQuery)
      .populate('user', 'name email')
      .populate('items.product', 'name')
      .sort(sortObj)
      .limit(10000) // prevent insane exports
      .lean()

    // Build CSV
    const headers = [
      'Order Number',
      'Customer Name',
      'Customer Email',
      'Items Count',
      'Total',
      'Payment Method',
      'Payment Status',
      'Order Status',
      'Created At',
      'Shipping Address',
    ]

    const rows = orders.map((order: any) => {
      const address = order.shippingAddress
        ? `${order.shippingAddress.fullName}, ${order.shippingAddress.line1}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.pincode}`
        : ''
      return [
        order.orderNumber,
        order.user?.name || '',
        order.user?.email || '',
        getItemCount(order.items),
        order.pricing?.total || 0,
        order.paymentInfo?.method || '',
        order.paymentInfo?.status || '',
        order.status,
        new Date(order.createdAt).toISOString().split('T')[0],
        address,
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    const encodedCsv = encodeURIComponent(csvContent)
    const filename = `orders-export-${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Admin orders export error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to export orders' },
      { status: 500 }
    )
  }
}
