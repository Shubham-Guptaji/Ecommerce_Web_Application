import { NextRequest, NextResponse } from 'next/server'
import NewsletterCampaign from '@/models/NewsletterCampaign'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(
      Math.max(Number.parseInt(searchParams.get('limit') || '10', 10) || 10, 1),
      50
    )

    const campaigns = await NewsletterCampaign.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    return NextResponse.json({
      success: true,
      data: campaigns,
    })
  } catch (error) {
    console.error('Admin newsletter campaigns GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch newsletter campaigns' },
      { status: 500 }
    )
  }
}
