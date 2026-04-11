// src/app/api/admin/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Product from '@/models/Product'
import { requireAdmin } from '@/lib/adminAuth'
import { z } from 'zod'
import { sanitizeHtml } from '@/lib/sanitize'

const productListQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['active', 'inactive', 'out_of_stock']).optional(),
  sortBy: z.enum(['price', 'stock', 'date', 'name']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { session, error } = await requireAdmin()
    if (error) return error

    await dbConnect()

    const searchParams = request.nextUrl.searchParams
    const queryObj = Object.fromEntries(searchParams.entries())

    // Validate query
    const validatedQuery = productListQuerySchema.parse({
      search: queryObj.search,
      category: queryObj.category,
      status: queryObj.status,
      sortBy: queryObj.sortBy,
      sortOrder: queryObj.sortOrder,
      page: queryObj.page ? parseInt(queryObj.page as string) : 1,
      limit: queryObj.limit ? parseInt(queryObj.limit as string) : 20,
    })

    const page = validatedQuery.page!
    const limit = validatedQuery.limit!
    const skip = (page - 1) * limit

    // Build query
    const buildQuery: any = {}

    // Search
    if (validatedQuery.search) {
      const searchRegex = { $regex: validatedQuery.search, $options: 'i' }
      buildQuery.$or = [
        { name: searchRegex },
        { sku: searchRegex },
        { description: searchRegex },
      ]
    }

    // Category filter (accept comma-separated IDs)
    if (validatedQuery.category) {
      const categoryIds = validatedQuery.category.split(',').map(id => id.trim()).filter(Boolean)
      if (categoryIds.length > 0) {
        buildQuery.category = { $in: categoryIds }
      }
    }

    // Status filter
    if (validatedQuery.status === 'active') {
      buildQuery.isActive = true
    } else if (validatedQuery.status === 'inactive') {
      buildQuery.isActive = false
    } else if (validatedQuery.status === 'out_of_stock') {
      buildQuery.stock = 0
    }
    // If status not provided, no default filter (show all)

    // Sorting
    let sort: any = {}
    if (validatedQuery.sortBy) {
      let sortField: string
      switch (validatedQuery.sortBy) {
        case 'price':
          sortField = 'price'
          break
        case 'stock':
          sortField = 'stock'
          break
        case 'date':
          sortField = 'createdAt'
          break
        case 'name':
          sortField = 'name'
          break
        default:
          sortField = 'createdAt'
      }
      sort[sortField] = validatedQuery.sortOrder === 'asc' ? 1 : -1
    } else {
      sort.createdAt = -1 // default newest first
    }

    // Query
    const [products, total] = await Promise.all([
      Product.find(buildQuery)
        .populate('category', 'name slug image')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(buildQuery),
    ])

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Admin products GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch products' },
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

    // Validate using productSchema (imported from schemas)
    const productSchema = z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().min(1),
      shortDescription: z.string().min(1).max(300),
      price: z.number().positive(),
      discountedPrice: z.number().positive().optional().nullable(),
      category: z.string().min(1),
      stock: z.number().int().min(0),
      sku: z.string().min(1),
      tags: z.array(z.string()).optional(),
      isActive: z.boolean().optional(),
      isFeatured: z.boolean().optional(),
      specifications: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
      images: z.array(z.object({ url: z.string(), publicId: z.string() })).optional(),
    })

    const validatedData = productSchema.parse(body)

    // Sanitize description
    if (validatedData.description) {
      validatedData.description = sanitizeHtml(validatedData.description)
    }

    // Check slug uniqueness
    const existingSlug = await Product.findOne({ slug: validatedData.slug })
    if (existingSlug) {
      return NextResponse.json(
        { success: false, message: 'Product with this slug already exists' },
        { status: 400 }
      )
    }

    // Check SKU uniqueness
    const existingSku = await Product.findOne({ sku: validatedData.sku })
    if (existingSku) {
      return NextResponse.json(
        { success: false, message: 'Product with this SKU already exists' },
        { status: 400 }
      )
    }

    // Create product
    const product = new Product({
      name: validatedData.name,
      slug: validatedData.slug,
      description: validatedData.description,
      shortDescription: validatedData.shortDescription,
      price: validatedData.price,
      discountedPrice: validatedData.discountedPrice || 0,
      category: validatedData.category,
      stock: validatedData.stock,
      sku: validatedData.sku,
      tags: validatedData.tags || [],
      isActive: validatedData.isActive ?? true,
      isFeatured: validatedData.isFeatured ?? false,
      specifications: validatedData.specifications || [],
      images: validatedData.images || [],
    })

    await product.save()

    return NextResponse.json(
      { success: true, data: product },
      { status: 201 }
    )
  } catch (error) {
    console.error('Admin products POST error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, message: 'Failed to create product' },
      { status: 500 }
    )
  }
}
