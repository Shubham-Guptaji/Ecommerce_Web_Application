import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Product from '@/models/Product'
import Category from '@/models/Category'
import { auth } from '@/lib/auth'
import { requireAdmin } from '@/lib/adminAuth'
import { z } from 'zod'
import { sanitizeHtml } from '@/lib/sanitize'

const updateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').optional(),
  slug: z.string().min(1, 'Slug is required').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  shortDescription: z.string().min(1, 'Short description is required').optional(),
  price: z.number().positive('Price must be positive').optional(),
  discountedPrice: z.number().positive().optional().nullable(),
  category: z.string().min(1, 'Category is required').optional(),
  tags: z.array(z.string()).optional(),
  stock: z.number().int().min(0, 'Stock must be non-negative').optional(),
  sku: z.string().min(1, 'SKU is required').optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  specifications: z.array(
    z.object({
      key: z.string().min(1),
      value: z.string().min(1),
    })
  ).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    console.error('Product GET error:', error)
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

    // Validate partial update
    let validatedData = updateProductSchema.parse(body)

    // Sanitize HTML fields if present
    if (validatedData.description) {
      validatedData.description = sanitizeHtml(validatedData.description)
    }

    // If slug is provided, check if it's already taken by another product
    if (validatedData.slug) {
      const existing = await Product.findOne({
        slug: validatedData.slug,
        _id: { $ne: id },
      })
      if (existing) {
        return NextResponse.json(
          { success: false, message: 'Product with this slug already exists' },
          { status: 400 }
        )
      }
    }

    // If SKU is provided, check if it's already taken by another product
    if (validatedData.sku) {
      const existing = await Product.findOne({
        sku: validatedData.sku,
        _id: { $ne: id },
      })
      if (existing) {
        return NextResponse.json(
          { success: false, message: 'Product with this SKU already exists' },
          { status: 400 }
        )
      }
    }

    // Build update object
    const updateData: any = { ...validatedData }

    // If category is provided as string, convert to ObjectId
    if (updateData.category && typeof updateData.category === 'string') {
      const category = await Category.findOne({ slug: updateData.category })
      if (category) {
        updateData.category = category._id
      } else {
        return NextResponse.json(
          { success: false, message: 'Category not found' },
          { status: 404 }
        )
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('category', 'name slug image')
      .lean()

    if (!updatedProduct) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedProduct,
    })
  } catch (error: any) {
    console.error('Product PUT error:', error)

    if (error.errors) {
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

    const product = await Product.findByIdAndDelete(id)

    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted',
    })
  } catch (error) {
    console.error('Product DELETE error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
