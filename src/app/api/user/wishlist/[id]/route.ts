import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import User from '@/models/User'
import Product from '@/models/Product'
import { auth } from '@/lib/auth'

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

    // Check if product exists
    const product = await Product.findById(productId)
      .select('_id name slug price discountedPrice images stock')
      .lean() as any

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      )
    }

    const user = await User.findById(session.user.id)

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const isInWishlist = user.wishlist.some(
      (item: any) => item.product.toString() === productId
    )

    if (isInWishlist) {
      // Remove from wishlist
      user.wishlist = user.wishlist.filter(
        (item: any) => item.product.toString() !== productId
      )
      await user.save()

      return NextResponse.json({
        success: true,
        data: {
          product: product,
          isInWishlist: false,
          message: 'Removed from wishlist',
        },
      })
    } else {
      // Add to wishlist
      user.wishlist.push({
        product: productId,
        addedAt: new Date(),
      })
      await user.save()

      return NextResponse.json({
        success: true,
        data: {
          product: product,
          isInWishlist: true,
          message: 'Added to wishlist',
        },
      })
    }
  } catch (error) {
    console.error('Wishlist toggle error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update wishlist' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    const user = await User.findById(session.user.id)
      .populate({
        path: 'wishlist.product',
        select: '_id name slug shortDescription price discountedPrice images rating soldCount',
      })
      .lean() as any

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const wishlistProducts = user.wishlist.map((item: any) => item.product)

    return NextResponse.json({
      success: true,
      data: {
        products: wishlistProducts,
        count: wishlistProducts.length,
      },
    })
  } catch (error) {
    console.error('Wishlist GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch wishlist' },
      { status: 500 }
    )
  }
}
