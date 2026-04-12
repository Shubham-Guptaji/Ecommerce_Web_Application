import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import NewsletterSubscriber from '@/models/NewsletterSubscriber'
import { requireAdmin } from '@/lib/adminAuth'

const newsletterSubscriberUpdateSchema = z.object({
  isActive: z.boolean(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const { isActive } = newsletterSubscriberUpdateSchema.parse(body)

    const updateData = isActive
      ? {
          $set: {
            isActive: true,
            subscribedAt: new Date(),
          },
          $unset: { unsubscribedAt: 1 },
        }
      : {
          $set: {
            isActive: false,
            unsubscribedAt: new Date(),
          },
        }

    const subscriber = await NewsletterSubscriber.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )

    if (!subscriber) {
      return NextResponse.json(
        { success: false, message: 'Subscriber not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: subscriber,
    })
  } catch (error) {
    console.error('Admin newsletter PUT error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update subscriber' },
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
    const { error } = await requireAdmin()
    if (error) return error

    const subscriber = await NewsletterSubscriber.findByIdAndDelete(id)

    if (!subscriber) {
      return NextResponse.json(
        { success: false, message: 'Subscriber not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Subscriber deleted successfully',
    })
  } catch (error) {
    console.error('Admin newsletter DELETE error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete subscriber' },
      { status: 500 }
    )
  }
}
