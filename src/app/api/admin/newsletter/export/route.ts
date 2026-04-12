import { NextRequest, NextResponse } from 'next/server'
import NewsletterSubscriber from '@/models/NewsletterSubscriber'
import { requireAdmin } from '@/lib/adminAuth'
import {
  buildNewsletterAdminQuery,
  buildNewsletterAdminSort,
  csvEscape,
  parseNewsletterAdminFilters,
} from '@/lib/newsletter'

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const filters = parseNewsletterAdminFilters(request.nextUrl.searchParams)
    const query = buildNewsletterAdminQuery(filters)
    const sort = buildNewsletterAdminSort(filters)

    const subscribers = await NewsletterSubscriber.find(query)
      .sort(sort)
      .limit(10000)
      .lean()

    const headers = ['Email', 'Status', 'Subscribed At', 'Unsubscribed At']
    const rows = subscribers.map((subscriber: any) => [
      subscriber.email,
      subscriber.isActive ? 'Active' : 'Unsubscribed',
      subscriber.subscribedAt ? new Date(subscriber.subscribedAt).toISOString() : '',
      subscriber.unsubscribedAt ? new Date(subscriber.unsubscribedAt).toISOString() : '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map(csvEscape).join(',')),
    ].join('\n')

    const filename = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Admin newsletter export error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to export newsletter subscribers' },
      { status: 500 }
    )
  }
}
