// src/app/api/admin/products/bulk/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { dbConnect } from '@/lib/db'
import Product from '@/models/Product'
import { requireAdmin } from '@/lib/adminAuth'
import { z } from 'zod'

const bulkActionSchema = z.object({
  action: z.enum(['activate', 'deactivate', 'delete']),
  ids: z.array(z.string()),
})

export async function POST(request: NextRequest) {
  try {
    const { session, error } = await requireAdmin()
    if (error) return error

    await dbConnect()

    const body = await request.json()
    const { action, ids } = bulkActionSchema.parse(body)

    if (!ids || ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No product IDs provided' },
        { status: 400 }
      )
    }

    const affectedProducts = await Product.find({ _id: { $in: ids } })
      .select('slug')
      .lean()

    const updateData: any = {}
    if (action === 'activate') {
      updateData.isActive = true
    } else if (action === 'deactivate') {
      updateData.isActive = false
    } // delete handled separately

    if (action === 'activate' || action === 'deactivate') {
      const result = await Product.updateMany(
        { _id: { $in: ids } },
        updateData
      )

      revalidatePath('/admin/products')
      revalidatePath('/products')
      revalidatePath('/')
      affectedProducts.forEach((product: any) => {
        if (product.slug) {
          revalidatePath(`/products/${product.slug}`)
        }
      })

      return NextResponse.json({
        success: true,
        message: `${result.modifiedCount} products ${action}d`,
        modifiedCount: result.modifiedCount,
      })
    } else if (action === 'delete') {
      // Soft delete by default (isActive = false). Could support hard via query param? Not specified.
      const result = await Product.updateMany(
        { _id: { $in: ids } },
        { isActive: false }
      )

      revalidatePath('/admin/products')
      revalidatePath('/products')
      revalidatePath('/')
      affectedProducts.forEach((product: any) => {
        if (product.slug) {
          revalidatePath(`/products/${product.slug}`)
        }
      })

      return NextResponse.json({
        success: true,
        message: `${result.modifiedCount} products deleted (deactivated)`,
        modifiedCount: result.modifiedCount,
      })
    }

  } catch (error) {
    console.error('Admin products bulk error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to perform bulk action' },
      { status: 500 }
    )
  }
}
