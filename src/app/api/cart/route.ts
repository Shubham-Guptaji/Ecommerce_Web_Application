import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Cart from '@/models/Cart'
import Product from '@/models/Product'
import { auth } from '@/lib/auth'
import { cartSchema } from '@/schemas'

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

    const cart = await Cart.findOne({ user: session.user.id }).lean() as any

    if (!cart) {
      return NextResponse.json({
        success: true,
        data: { items: [], coupon: null, subtotal: 0, itemCount: 0 },
      })
    }

    const subtotal = cart.items.reduce((total: number, item: any) => {
      const price = item.discountedPrice || item.price
      return total + price * item.quantity
    }, 0)

    return NextResponse.json({
      success: true,
      data: {
        items: cart.items,
        coupon: cart.coupon || null,
        subtotal,
        itemCount: cart.items.reduce((total: number, item: any) => total + item.quantity, 0),
      },
    })
  } catch (error) {
    console.error('Cart GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch cart' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    const body = await request.json()
    const { items, coupon } = cartSchema.parse(body)

    // Validate each item: check product exists, is active, and stock sufficient
    const validatedItems: any[] = []
    for (const item of items) {
      try {
        const product = await Product.findById(item.product).select('isActive stock').lean() as any
        if (!product) {
          // Product not found, skip
          continue
        }
        if (!product.isActive) {
          continue
        }
        if (product.stock < item.quantity) {
          // Insufficient stock, skip
          continue
        }
      } catch (err) {
        // If DB error, skip this item
        continue
      }

      validatedItems.push({
        product: item.product,
        name: item.name,
        image: item.image,
        price: item.price,
        discountedPrice: item.discountedPrice,
        quantity: item.quantity,
        addedAt: new Date(),
      })
    }

    // Prepare update
    const update: any = {
      items: validatedItems,
      coupon: coupon || null,
    }

    // Upsert cart
    const cart = await Cart.findOneAndUpdate(
      { user: session.user.id },
      { $set: update },
      { upsert: true, new: true }
    ).lean() as any

    const subtotal = cart.items.reduce((total: number, item: any) => {
      const price = item.discountedPrice || item.price
      return total + price * item.quantity
    }, 0)

    return NextResponse.json({
      success: true,
      data: {
        items: cart.items,
        coupon: cart.coupon || null,
        subtotal,
        itemCount: cart.items.reduce((total: number, item: any) => total + item.quantity, 0),
      },
    })
  } catch (error) {
    console.error('Cart POST error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to sync cart' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    await Cart.findOneAndDelete({ user: session.user.id })

    return NextResponse.json({
      success: true,
      data: { items: [], subtotal: 0, itemCount: 0 },
    })
  } catch (error) {
    console.error('Cart DELETE error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to clear cart' },
      { status: 500 }
    )
  }
}
