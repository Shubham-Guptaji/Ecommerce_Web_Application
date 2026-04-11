// src/app/api/reviews/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Review from '@/models/Review'
import Product from '@/models/Product'
import { auth } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    // Only admin can delete reviews
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    const review = await Review.findById(id)

    if (!review) {
      return NextResponse.json(
        { success: false, message: 'Review not found' },
        { status: 404 }
      )
    }

    // Store product ID for rating recalculation
    const productId = review.product

    // Delete the review
    await Review.findByIdAndDelete(id)

    // Update product ratings after deletion
    await Product.updateRatings(productId)

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    })
  } catch (error) {
    console.error('Review DELETE error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete review' },
      { status: 500 }
    )
  }
}
