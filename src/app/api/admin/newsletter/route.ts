import { NextRequest, NextResponse } from 'next/server'
import NewsletterSubscriber from '@/models/NewsletterSubscriber'
import { requireAdmin } from '@/lib/adminAuth'
import {
  buildNewsletterAdminQuery,
  buildNewsletterAdminSort,
  getNewsletterAdminSummary,
  parseNewsletterAdminFilters,
} from '@/lib/newsletter'

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const filters = parseNewsletterAdminFilters(request.nextUrl.searchParams)
    const query = buildNewsletterAdminQuery(filters)
    const sort = buildNewsletterAdminSort(filters)
    const skip = (filters.page - 1) * filters.limit

    const [subscribers, total, summary] = await Promise.all([
      NewsletterSubscriber.find(query)
        .sort(sort)
        .skip(skip)
        .limit(filters.limit)
        .lean(),
      NewsletterSubscriber.countDocuments(query),
      getNewsletterAdminSummary(),
    ])

    return NextResponse.json({
      success: true,
      data: subscribers,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: Math.ceil(total / filters.limit),
      },
      summary,
    })
  } catch (error) {
    console.error('Admin newsletter GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch newsletter subscribers' },
      { status: 500 }
    )
  }
}
