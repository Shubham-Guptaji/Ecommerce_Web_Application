// src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { dbConnect } from '@/lib/db'
import Product from '@/models/Product'
import Category from '@/models/Category'
import { auth } from '@/lib/auth'
import { requireAdmin } from '@/lib/adminAuth'
import { z } from 'zod'
import { sanitizeHtml } from '@/lib/sanitize'

const productFilterSchema = z.object({
  category: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minRating: z.number().min(0).max(5).optional(),
  minDiscount: z.number().min(0).max(100).optional(),
  inStock: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['price', 'createdAt', 'ratings.average', 'soldCount', 'discountPercent']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
})

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const searchParams = request.nextUrl.searchParams
    const query = Object.fromEntries(searchParams.entries())

    // Parse and validate query parameters
    const validatedQuery = productFilterSchema.parse({
      category: query.category,
      minPrice: query.minPrice ? parseFloat(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? parseFloat(query.maxPrice) : undefined,
      minRating: query.minRating ? parseFloat(query.minRating) : undefined,
      minDiscount: query.minDiscount ? parseFloat(query.minDiscount) : undefined,
      inStock: query.inStock === 'true' || query.inStock === 'false' ? query.inStock === 'true' : undefined,
      isFeatured: query.isFeatured === 'true' || query.isFeatured === 'false' ? query.isFeatured === 'true' : undefined,
      isActive: query.isActive === 'true' || query.isActive === 'false' ? query.isActive === 'true' : undefined,
      search: query.search,
      sortBy: query.sortBy as any,
      sortOrder: query.sortOrder as any,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 12,
    })

    // Build query
    const buildQuery: any = {}

    if (validatedQuery.isActive !== undefined) {
      buildQuery.isActive = validatedQuery.isActive
    }

    if (validatedQuery.isActive === undefined) {
      buildQuery.isActive = true
    }

    if (validatedQuery.category) {
      const slugs = validatedQuery.category.split(',').map(s => s.trim()).filter(Boolean)
      if (slugs.length > 0) {
        const categories = await Category.find({ slug: { $in: slugs } }).lean()
        const categoryIds = (categories as any[]).map(c => c._id)
        buildQuery.category = { $in: categoryIds }
      } else {
        buildQuery.category = { $in: [] } // forces no results
      }
    }

    if (validatedQuery.search) {
      buildQuery.$text = { $search: validatedQuery.search }
    }

    if (validatedQuery.inStock !== undefined) {
      if (validatedQuery.inStock) {
        buildQuery.stock = { $gt: 0 }
      } else {
        buildQuery.stock = { $lte: 0 }
      }
    }

    if (validatedQuery.minDiscount) {
      buildQuery.discountPercent = { $gte: validatedQuery.minDiscount }
    }

    if (validatedQuery.minRating) {
      buildQuery['ratings.average'] = { $gte: validatedQuery.minRating }
    }

    if (validatedQuery.isFeatured !== undefined) {
      buildQuery.isFeatured = validatedQuery.isFeatured
    }

    // Price filtering
    if (validatedQuery.minPrice !== undefined || validatedQuery.maxPrice !== undefined) {
      buildQuery.price = {}
      if (validatedQuery.minPrice !== undefined) {
        buildQuery.price.$gte = validatedQuery.minPrice
      }
      if (validatedQuery.maxPrice !== undefined) {
        buildQuery.price.$lte = validatedQuery.maxPrice
      }
    }

    // Sorting
    const sort: any = {}
    if (validatedQuery.sortBy) {
      if (validatedQuery.sortBy === 'price' || validatedQuery.sortBy === 'ratings.average' || validatedQuery.sortBy === 'soldCount') {
        sort[validatedQuery.sortBy] = validatedQuery.sortOrder === 'desc' ? -1 : 1
      } else {
        sort[validatedQuery.sortBy] = validatedQuery.sortOrder === 'desc' ? -1 : 1
      }
    } else {
      sort.createdAt = -1
    }

    // Pagination
    const skip = (validatedQuery.page! - 1) * validatedQuery.limit!
    const limit = validatedQuery.limit!

    // Query products
    const [products, total] = await Promise.all([
      Product.find(buildQuery)
        .populate('category', 'name slug image')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(buildQuery),
    ])

    // Get category counts if no category filter
    let categoryCounts = []
    if (!validatedQuery.category) {
      categoryCounts = await Category.aggregate([
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: 'category',
            as: 'products',
          },
        },
        {
          $project: {
            name: 1,
            slug: 1,
            productCount: { $size: '$products' },
          },
        },
        { $sort: { productCount: -1 } },
        { $limit: 10 },
      ])
    }

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total,
        pages: Math.ceil(total / validatedQuery.limit!),
      },
      filters: {
        categoryCounts: categoryCounts.length > 0 ? categoryCounts : undefined,
      },
    })
  } catch (error) {
    console.error('Products API error:', error)
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

    // Validate product data
    const { name, slug, description, shortDescription, price,
            category, stock, sku, tags, isActive, isFeatured, specifications } = body

    if (!name || !slug || !description || !shortDescription || !price || !category || !stock || !sku) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Sanitize HTML fields
    const sanitizedDescription = sanitizeHtml(description)

    // Check if slug already exists
    const existingProduct = await Product.findOne({ slug })
    if (existingProduct) {
      return NextResponse.json(
        { success: false, message: 'Product with this slug already exists' },
        { status: 400 }
      )
    }

    // Check if SKU already exists
    const existingSku = await Product.findOne({ sku })
    if (existingSku) {
      return NextResponse.json(
        { success: false, message: 'Product with this SKU already exists' },
        { status: 400 }
      )
    }

    const product = new Product({
      name,
      slug,
      description: sanitizedDescription,
      shortDescription,
      price,
      discountedPrice: body.discountedPrice,
      category,
      stock,
      sku,
      tags: tags || [],
      isActive: isActive ?? true,
      isFeatured: isFeatured ?? false,
      specifications: specifications || [],
    })

    await product.save()

    return NextResponse.json(
      { success: true, data: product },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create product' },
      { status: 500 }
    )
  }
}
