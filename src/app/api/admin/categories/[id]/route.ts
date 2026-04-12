// src/app/api/admin/categories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Category from '@/models/Category'
import Product from '@/models/Product'
import { z } from 'zod'
import { requireAdmin } from '@/lib/adminAuth'

const categoryUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  parent: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
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

    const category = await Category.findById(id)
      .populate('parent', 'name slug')
      .populate('children', 'name slug')
      .lean()

    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      )
    }

    // Get product count
    const productCount = await Product.countDocuments({ category: id })

    return NextResponse.json({
      success: true,
      data: {
        ...category,
        productCount,
      },
    })
  } catch (error) {
    console.error('Admin category GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch category' },
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
    const { name, description, parent, isActive, imageUrl, imagePublicId } = body

    // Fetch the existing category
    const existingCategory = await Category.findById(id)
    if (!existingCategory) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: any = {}

    if (name !== undefined) {
      // Generate slug if name changed
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      // Check slug uniqueness (excluding current category)
      const slugExists = await Category.findOne({
        slug,
        _id: { $ne: id },
      })
      if (slugExists) {
        return NextResponse.json(
          { success: false, message: 'Category name already exists' },
          { status: 400 }
        )
      }

      updateData.name = name
      updateData.slug = slug
    }

    if (description !== undefined) {
      updateData.description = description
    }

    if (parent !== undefined) {
      // Prevent setting self as parent
      if (parent && parent === id) {
        return NextResponse.json(
          { success: false, message: 'Category cannot be its own parent' },
          { status: 400 }
        )
      }
      updateData.parent = parent || null
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive
    }

    // Handle image update
    if (imageUrl !== undefined || imagePublicId !== undefined) {
      if (imageUrl && imagePublicId) {
        updateData.image = { url: imageUrl, publicId: imagePublicId }
      } else if (imageUrl === null || imagePublicId === null) {
        // Removing image
        updateData.image = undefined
      }
    }

    const category = await Category.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('parent', 'name slug')

    return NextResponse.json({
      success: true,
      data: category,
    })
  } catch (error: any) {
    console.error('Admin category PUT error:', error)

    if (error.errors) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, message: 'Failed to update category' },
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

    const category = await Category.findById(id)

    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if category has children
    const childCount = await Category.countDocuments({ parent: id })
    if (childCount > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete category with subcategories' },
        { status: 400 }
      )
    }

    // Check if category has products
    const productCount = await Product.countDocuments({ category: id })
    if (productCount > 0) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete category with associated products' },
        { status: 400 }
      )
    }

    await Category.findByIdAndDelete(id)

    return NextResponse.json({
      success: true,
      message: 'Category deleted',
    })
  } catch (error) {
    console.error('Admin category DELETE error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
