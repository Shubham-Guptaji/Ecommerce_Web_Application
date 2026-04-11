// src/app/(store)/products/page.tsx
import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { SlidersHorizontal } from 'lucide-react'
import { toPlainObject } from '@/lib/utils'
import { ProductGrid } from '@/components/product/product-grid'
import { ProductFilters } from '@/components/product/product-filters'
import { SortDropdown } from '@/components/shared/sort-dropdown'
import { dbConnect } from '@/lib/db'
import Product from '@/models/Product'
import Category from '@/models/Category'

export const metadata: Metadata = {
  title: 'All Products',
  description: 'Browse all products in our store',
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await dbConnect()
  const search = await searchParams

  // Build query from searchParams
  const buildQuery: any = { isActive: true }

  // Category filter (single or comma-separated)
  if (search.category) {
    const slugs = Array.isArray(search.category)
      ? search.category
      : search.category.split(',').map(s => s.trim()).filter(Boolean)
    if (slugs.length > 0) {
      const categories = await Category.find({ slug: { $in: slugs } }).lean()
      const categoryIds = categories.map((c: any) => c._id)
      buildQuery.category = { $in: categoryIds }
    }
  }

  // Search
  if (search.search) {
    buildQuery.$text = { $search: search.search as string }
  }

  // Price range
  if (search.minPrice || search.maxPrice) {
    buildQuery.price = {}
    if (search.minPrice) buildQuery.price.$gte = parseFloat(search.minPrice as string)
    if (search.maxPrice) buildQuery.price.$lte = parseFloat(search.maxPrice as string)
  }

  // Minimum rating
  if (search.minRating) {
    buildQuery['ratings.average'] = { $gte: parseFloat(search.minRating as string) }
  }

  // Minimum discount
  if (search.minDiscount) {
    buildQuery.discountPercent = { $gte: parseFloat(search.minDiscount as string) }
  }

  // In stock
  if (search.inStock === 'true') {
    buildQuery.stock = { $gt: 0 }
  }

  // Featured
  if (search.isFeatured !== undefined) {
    buildQuery.isFeatured = search.isFeatured === 'true'
  }

  // Sorting
  const sortBy = search.sortBy as string || 'createdAt'
  const sortOrder = search.sortOrder === 'asc' ? 1 : -1
  const sort: any = {}
  if (sortBy === 'price' || sortBy === 'ratings.average' || sortBy === 'soldCount' || sortBy === 'discountPercent' || sortBy === 'createdAt') {
    sort[sortBy] = sortOrder
  } else {
    sort.createdAt = -1
  }

  // Pagination
  const page = parseInt(search.page as string) || 1
  const limit = parseInt(search.limit as string) || 12
  const skip = (page - 1) * limit

  // Execute queries in parallel
  const [productsRaw, total, categoriesRaw] = await Promise.all([
    Product.find(buildQuery)
      .populate('category', 'name slug image')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(buildQuery),
    Category.find({ isActive: true })
      .populate('parent', 'name slug')
      .populate('children', 'name slug image')
      .sort({ name: 1 })
      .lean(),
  ])

  const products = productsRaw.map(toPlainObject)
  const categories = categoriesRaw.map(toPlainObject)

  // Build category tree for filters

  const buildCategoryTree = (cats: any[]) => {
    const map = new Map()
    const roots: any[] = []

    cats.forEach((cat) => {
      map.set(cat._id.toString(), { ...cat, children: [] })
    })

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

  const pagination = {
    page,
    pages: Math.ceil(total / limit),
    total,
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Mobile Filter Button */}
        <div className="md:hidden mb-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" className="w-full">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
              <div className="py-4">
                <h3 className="font-semibold mb-4">Filters</h3>
                <ProductFilters categories={categoryTree} />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Sidebar */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-24">
            <ProductFilters categories={categoryTree} />
          </div>
        </aside>

        {/* Product Grid */}
        <main className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">All Products</h1>
            <div className="flex items-center gap-4">
              <SortDropdown />
            </div>
          </div>

          <div className="mb-6 text-sm text-muted-foreground">
            Showing {products.length} of {pagination.total} products
            {search.search && (
              <span>
                {' '}
                for &quot;{Array.isArray(search.search) ? search.search[0] : search.search}&quot;
              </span>
            )}
          </div>

          {products.length > 0 ? (
            <ProductGrid products={products as any[]} columns={3} />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found matching your criteria.</p>
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: pagination.pages }).map((_, i) => (
                <button
                  key={i}
                  className={`px-3 py-2 rounded-md ${
                    pagination.page === i + 1
                      ? 'bg-primary text-primary-foreground'
                      : 'border hover:bg-muted'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
