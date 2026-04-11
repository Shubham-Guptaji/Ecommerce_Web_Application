import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import User from '@/models/User'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
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
        select: 'name slug price discountedPrice images stock isActive',
      })
      .lean() as any

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Transform: extract product from each wishlist item and filter active products
    const activeWishlist = (user.wishlist || [])
      .filter((item: any) => item.product?.isActive)
      .map((item: any) => item.product)
      // Deduplicate by _id to prevent React key conflicts
      .filter((product: any, index: number, self: any[]) =>
        index === self.findIndex((p: any) => p._id.toString() === product._id.toString())
      )

    return NextResponse.json({
      success: true,
      data: {
        wishlist: activeWishlist,
        total: activeWishlist.length,
      },
    })
  } catch (error) {
    console.error('Fetch wishlist error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch wishlist' },
      { status: 500 }
    )
  }
}
