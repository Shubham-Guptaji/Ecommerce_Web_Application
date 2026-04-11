import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import { requireAdmin } from '@/lib/adminAuth'
import Cart from '@/models/Cart'

export async function POST(request: NextRequest) {
  try {
    const { session, error } = await requireAdmin()
    if (error) return error

    await dbConnect()

    // Delete all carts
    const result = await Cart.deleteMany({})

    return NextResponse.json({
      success: true,
      message: `Cleared ${result.deletedCount} carts`,
      deletedCount: result.deletedCount,
    })
  } catch (error) {
    console.error('Clear carts error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to clear carts' },
      { status: 500 }
    )
  }
}
