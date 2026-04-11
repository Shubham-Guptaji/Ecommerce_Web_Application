import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Product from '@/models/Product'
import Review from '@/models/Review'
import Coupon from '@/models/Coupon'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await dbConnect()

    const { slug } = await params

    // Validate slug
    if (!slug) {
      return NextResponse.json(
        { success: false, message: 'Product slug is required' },
        { status: 400 }
      )
    }

    // Find product with populated category
    const product = await Product.findOne({ slug, isActive: true })
      .populate('category', 'name slug image')
      .lean() as any

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      )
    }

    // Fetch reviews
    const reviews = await Review.find({ product: product._id, isApproved: true })
      .populate('user', 'name avatar createdAt')
      .sort({ createdAt: -1 })
      .lean() as any

    // Calculate rating distribution
    const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    reviews.forEach((review: any) => {
      ratingDist[review.rating as keyof typeof ratingDist]++
    })

    // Fetch related products (same category)
    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      isActive: true,
    })
      .sort({ soldCount: -1, ratings: -1 })
      .limit(8)
      .lean()

    return NextResponse.json({
      success: true,
      data: {
        product,
        reviews: {
          list: reviews,
          total: reviews.length,
          average: product.ratings?.average || 0,
          distribution: ratingDist,
        },
        relatedProducts,
      },
    })
  } catch (error) {
    console.error('Product API error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}