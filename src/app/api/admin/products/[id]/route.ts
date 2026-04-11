// src/app/api/admin/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Product from '@/models/Product'
import { requireAdmin } from '@/lib/adminAuth'
import { z } from 'zod'
import { deleteFromCloudinary } from '@/lib/cloudinary'
import { sanitizeHtml } from '@/lib/sanitize'

const productUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  shortDescription: z.string().min(1).max(300).optional(),
  price: z.number().positive().optional(),
  discountedPrice: z.number().positive().optional().nullable(),
  category: z.string().min(1).optional(),
  stock: z.number().int().min(0).optional(),
  sku: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  specifications: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
  images: z.array(z.object({ url: z.string(), publicId: z.string() })).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { session, error } = await requireAdmin()
    if (error) return error

    await dbConnect()

    const product = await Product.findById(id)
      .populate('category', 'name slug image')
      .lean()

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: product,
    })
  } catch (error) {
    console.error('Admin product GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { session, error } = await requireAdmin()
    if (error) return error

    await dbConnect()

    const body = await request.json()

    // Validate
    const validatedData = productUpdateSchema.parse(body)

    // Find existing product
    const existingProduct = await Product.findById(id)
    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      )
    }

    // If slug is being changed, ensure uniqueness
    if (validatedData.slug && validatedData.slug !== existingProduct.slug) {
      const slugExists = await Product.findOne({ slug: validatedData.slug, _id: { $ne: id } })
      if (slugExists) {
        return NextResponse.json(
          { success: false, message: 'Product with this slug already exists' },
          { status: 400 }
        )
      }
    }

    // If SKU is being changed, ensure uniqueness
    if (validatedData.sku && validatedData.sku !== existingProduct.sku) {
      const skuExists = await Product.findOne({ sku: validatedData.sku, _id: { $ne: id } })
      if (skuExists) {
        return NextResponse.json(
          { success: false, message: 'Product with this SKU already exists' },
          { status: 400 }
        )
      }
    }

    // Build update object
    const updateData: any = {}
    Object.keys(validatedData).forEach(key => {
      const value = (validatedData as any)[key]
      if (value !== undefined) {
        updateData[key] = value
      }
    })

    // If description provided, sanitize
    if (updateData.description) {
      updateData.description = sanitizeHtml(updateData.description)
    }

    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )

    return NextResponse.json({
      success: true,
      data: product,
    })
  } catch (error) {
    console.error('Admin product PUT error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, message: 'Failed to update product' },
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
    const { session, error } = await requireAdmin()
    if (error) return error

    await dbConnect()

    const product = await Product.findById(id)
    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      )
    }

    const url = new URL(request.url)
    const hardDelete = url.searchParams.get('hard') === 'true'

    if (hardDelete) {
      // Delete associated Cloudinary images
      if (product.images && Array.isArray(product.images)) {
        for (const img of product.images) {
          if (img.publicId) {
            try {
              await deleteFromCloudinary(img.publicId)
            } catch (err) {
              console.error('Failed to delete Cloudinary image:', img.publicId, err)
            }
          }
        }
      }
      await Product.findByIdAndDelete(id)
      return NextResponse.json({
        success: true,
        message: 'Product permanently deleted',
      })
    } else {
      // Soft delete
      await Product.findByIdAndUpdate(id, { isActive: false })
      return NextResponse.json({
        success: true,
        message: 'Product deactivated',
      })
    }
  } catch (error) {
    console.error('Admin product DELETE error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
