// src/app/api/products/[id]/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Product from '@/models/Product'
import Order from '@/models/Order'
import Review from '@/models/Review'
import { auth } from '@/lib/auth'
import { reviewSchema } from '@/schemas'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    const { id: productId } = await params
    const body = await request.json()

    // Validate request body
    const { rating, title, body: reviewBody } = reviewSchema.parse(body)

    // Check if product exists
    const product = await Product.findById(productId)
    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if user has purchased this product (verified purchase)
    const verifiedOrder = await Order.findOne({
      user: session.user.id,
      'paymentInfo.status': 'paid',
      'items.product': productId,
    }).lean()

    if (!verifiedOrder) {
      return NextResponse.json(
        { success: false, message: 'You can only review products you have purchased' },
        { status: 403 }
      )
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      user: session.user.id,
    }).lean()

    if (existingReview) {
      return NextResponse.json(
        { success: false, message: 'You have already reviewed this product' },
        { status: 400 }
      )
    }

    // Create review
    const review = new Review({
      product: productId,
      user: session.user.id,
      rating,
      title: title || undefined,
      body: reviewBody,
      isVerifiedPurchase: true,
      isApproved: true, // Auto-approve for now, can be set to false for admin moderation
    })

    await review.save()

    // Populate response
    const populatedReview = await Review.findById(review._id)
      .populate('user', 'name avatar createdAt')
      .lean()

    return NextResponse.json({
      success: true,
      data: populatedReview,
    }, { status: 201 })

  } catch (error: any) {
    console.error('Review submission error:', error)

    if (error.errors) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to submit review' },
      { status: 500 }
    )
  }
}

// GET reviews for a product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect()

    const { id: productId } = await params
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Build query
    const query: any = { product: productId, isApproved: true }

    // Count total
    const total = await Review.countDocuments(query)

    // Fetch reviews with pagination
    const reviews = await Review.find(query)
      .populate('user', 'name avatar createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    // Calculate rating distribution
    const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    reviews.forEach((review: any) => {
      ratingDist[review.rating as keyof typeof ratingDist]++
    })

    // Get average from product
    const product = await Product.findById(productId).lean() as any
    const average = product?.ratings?.average || 0
    const count = product?.ratings?.count || 0

    return NextResponse.json({
      success: true,
      data: {
        list: reviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        average,
        count,
        distribution: ratingDist,
      },
    })
  } catch (error) {
    console.error('Fetch reviews error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}
