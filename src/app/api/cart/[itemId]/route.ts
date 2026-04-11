import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Cart from '@/models/Cart'
import { auth } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
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

    const { itemId } = await params

    const cart = await Cart.findOne({ user: session.user.id })

    if (!cart) {
      return NextResponse.json(
        { success: false, message: 'Cart not found' },
        { status: 404 }
      )
    }

    cart.items = cart.items.filter(
      (item: any) => item.product.toString() !== itemId
    )

    await cart.save()

    const subtotal = cart.items.reduce((total: number, item: any) => {
      const price = item.discountedPrice || item.price
      return total + price * item.quantity
    }, 0)

    return NextResponse.json({
      success: true,
      data: {
        items: cart.items,
        subtotal,
        itemCount: cart.items.reduce((total: number, item: any) => total + item.quantity, 0),
      },
    })
  } catch (error) {
    console.error('Cart item DELETE error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to remove item from cart' },
      { status: 500 }
    )
  }
}
