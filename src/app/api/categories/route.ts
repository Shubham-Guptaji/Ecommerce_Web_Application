import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Category from '@/models/Category'
import { auth } from '@/lib/auth'
import cloudinary from 'cloudinary'

export async function GET() {
  try {
    await dbConnect()

    // Fetch all categories with parent-populated tree
    const categories = await Category.find({ isActive: true })
      .populate('parent', 'name slug')
      .populate('children', 'name slug image')
      .sort({ name: 1 })
      .lean()

    // Build tree structure
    const buildCategoryTree = (cats: any[]) => {
      const map = new Map()
      const roots: any[] = []

      // First pass: create map
      cats.forEach((cat) => {
        map.set(cat._id.toString(), { ...cat, children: [] })
      })

      // Second pass: build tree
      cats.forEach((cat) => {
        const node = map.get(cat._id.toString())
        if (cat.parent) {
          const parentNode = map.get(cat.parent._id.toString())
          if (parentNode) {
            parentNode.children.push(node)
          }
        } else {
          roots.push(node)
        }
      })

      return roots
    }

    const categoryTree = buildCategoryTree(categories)

    // Also return flat list for filters
    const flatCategories = categories.map((cat) => ({
      _id: cat._id,
      name: cat.name,
      slug: cat.slug,
      image: cat.image,
      parent: cat.parent,
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
    console.error('Categories API error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    const body = await request.json()
    const { name, description, parent, isActive } = body

    if (!name) {
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

    const category = new Category({
      name,
      slug,
      description,
      parent: parent || null,
      isActive: isActive ?? true,
    })

    await category.save()

    return NextResponse.json(
      { success: true, data: category },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create category error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create category' },
      { status: 500 }
    )
  }
}
