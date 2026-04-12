import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import NewsletterSubscriber from '@/models/NewsletterSubscriber'
import { requireAdmin } from '@/lib/adminAuth'

const bulkNewsletterActionSchema = z.object({
  action: z.enum(['activate', 'deactivate', 'delete']),
  ids: z.array(z.string()).min(1),
})

export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const { action, ids } = bulkNewsletterActionSchema.parse(body)

    if (action === 'activate') {
      const result = await NewsletterSubscriber.updateMany(
        { _id: { $in: ids } },
        {
          $set: {
            isActive: true,
            subscribedAt: new Date(),
          },
          $unset: {
            unsubscribedAt: 1,
          },
        }
      )

      return NextResponse.json({
        success: true,
        message: `${result.modifiedCount} subscribers activated`,
        modifiedCount: result.modifiedCount,
      })
    }

    if (action === 'deactivate') {
      const result = await NewsletterSubscriber.updateMany(
        { _id: { $in: ids } },
        {
          $set: {
            isActive: false,
            unsubscribedAt: new Date(),
          },
        }
      )

      return NextResponse.json({
        success: true,
        message: `${result.modifiedCount} subscribers deactivated`,
        modifiedCount: result.modifiedCount,
      })
    }

    const result = await NewsletterSubscriber.deleteMany({ _id: { $in: ids } })

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount || 0} subscribers deleted`,
      deletedCount: result.deletedCount || 0,
    })
  } catch (error) {
    console.error('Admin newsletter bulk action error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to perform bulk action' },
      { status: 500 }
    )
  }
}
