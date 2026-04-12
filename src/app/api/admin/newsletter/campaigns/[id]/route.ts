import { NextRequest, NextResponse } from 'next/server'
import NewsletterCampaign from '@/models/NewsletterCampaign'
import NewsletterCampaignDelivery from '@/models/NewsletterCampaignDelivery'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error } = await requireAdmin()
    if (error) return error

    const campaign = await NewsletterCampaign.findById(id).lean()

    if (!campaign) {
      return NextResponse.json(
        { success: false, message: 'Campaign not found' },
        { status: 404 }
      )
    }

    const deliveries = await NewsletterCampaignDelivery.find({ campaign: id })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(50)
      .lean()

    return NextResponse.json({
      success: true,
      data: {
        campaign,
        deliveries,
      },
    })
  } catch (error) {
    console.error('Admin newsletter campaign detail GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch campaign details' },
      { status: 500 }
    )
  }
}
