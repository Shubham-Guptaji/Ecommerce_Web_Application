import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Category from '@/models/Category'
import Product from '@/models/Product'
import { auth } from '@/lib/auth'
import { z } from 'zod'

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

    return NextResponse.json({
      success: true,
      data: category,
    })
  } catch (error) {
    console.error('Category GET error:', error)
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
    const session = await auth()

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    const body = await request.json()
    const { name, description, parent, isActive } = categoryUpdateSchema.parse(body)

    const updateData: any = {}

    // If name is provided, generate slug and check uniqueness
    if (name) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      // Check slug uniqueness
      const existing = await Category.findOne({
        slug,
        _id: { $ne: id },
      })

      if (existing) {
        return NextResponse.json(
          { success: false, message: 'Category name already exists' },
          { status: 400 }
        )
      }

      updateData.name = name
      updateData.slug = slug
    }

    if (description !== undefined) updateData.description = description
    if (parent !== undefined) updateData.parent = parent || null
    if (isActive !== undefined) updateData.isActive = isActive

    const category = await Category.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )

    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: category,
    })
  } catch (error: any) {
    console.error('Category PUT error:', error)

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
    const session = await auth()

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

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

    const category = await Category.findByIdAndDelete(id)

    if (!category) {
      return NextResponse.json(
        { success: false, message: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Category deleted',
    })
  } catch (error) {
    console.error('Category DELETE error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
