// src/app/api/admin/categories/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Category from '@/models/Category'
import Product from '@/models/Product'
import { requireAdmin } from '@/lib/adminAuth'
import { categorySchema } from '@/schemas'

const getCategoryId = (value: any): string | null => {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value._id) {
    return value._id.toString()
  }
  if (typeof value?.toString === 'function') {
    const id = value.toString()
    return id && id !== '[object Object]' ? id : null
  }
  return null
}

export async function GET() {
  try {
    const { session, error } = await requireAdmin()
    if (error) return error
    await dbConnect()

    // Fetch all categories with parent populated
    const categories = await Category.find()
      .populate('parent', 'name slug')
      .sort({ name: 1 })
      .lean()

    // Get product counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await Product.countDocuments({ category: cat._id })
        return {
          ...cat,
          productCount,
        } as any
      })
    )

    // Build tree structure
    const buildCategoryTree = (cats: any[]) => {
      const map = new Map()
      const roots: any[] = []

      cats.forEach((cat) => {
        map.set(cat._id.toString(), { ...cat, children: [] })
      })

      cats.forEach((cat) => {
        const node = map.get(cat._id.toString())
        const parentId = getCategoryId(cat.parent)
        if (parentId) {
          const parentNode = map.get(parentId)
          if (parentNode) {
            parentNode.children.push(node)
          } else {
            roots.push(node)
          }
        } else {
          roots.push(node)
        }
      })

      return roots
    }

    const categoryTree = buildCategoryTree(categoriesWithCounts)

    // Also return flat list for the tree view (with product counts)
    const flatCategories = categoriesWithCounts.map((cat) => ({
      _id: cat._id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      parent: cat.parent,
      productCount: cat.productCount,
      isActive: cat.isActive,
      hasChildren: cat.children && cat.children.length > 0,
    }))

    return NextResponse.json({
      success: true,
      data: {
        tree: categoryTree,
        flat: flatCategories,
      },
    })
  } catch (error) {
    console.error('Admin categories GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { session, error } = await requireAdmin()
    if (error) return error
    await dbConnect()

    const body = await request.json()
    const { name, description, parent, isActive, imageUrl, imagePublicId } = body

    // Validate required fields
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Category name is required' },
        { status: 400 }
      )
    }

    // Generate slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check slug uniqueness
    const existingCategory = await Category.findOne({ slug })
    if (existingCategory) {
      return NextResponse.json(
        { success: false, message: 'Category with this name already exists' },
        { status: 400 }
      )
    }

    // Validate parent if provided (must exist)
    if (parent) {
      const parentCategory = await Category.findById(parent)
      if (!parentCategory) {
        return NextResponse.json(
          { success: false, message: 'Parent category not found' },
          { status: 404 }
        )
      }
    }

    const categoryData: any = {
      name,
      slug,
      description,
      parent: parent || null,
      isActive: isActive ?? true,
    }

    // Add image if provided
    if (imageUrl && imagePublicId) {
      categoryData.image = { url: imageUrl, publicId: imagePublicId }
    }

    const category = new Category(categoryData)
    await category.save()

    return NextResponse.json(
      { success: true, data: category },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Admin categories POST error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create category' },
      { status: 500 }
    )
  }
}
