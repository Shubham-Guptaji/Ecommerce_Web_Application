// src/app/(store)/category/[slug]/page.tsx
import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { SlidersHorizontal } from 'lucide-react'
import { Breadcrumb } from '@/components/shared/breadcrumb'
import { ProductGrid } from '@/components/product/product-grid'
import { CategorySidebar } from '@/components/category/category-sidebar'
import { SortDropdown } from '@/components/shared/sort-dropdown'
import { Skeleton } from '@/components/shared/skeleton'
import { dbConnect } from '@/lib/db'
import { toPlainObject } from '@/lib/utils'
import Category from '@/models/Category'
import Product from '@/models/Product'

interface PageProps {
  params: { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await dbConnect()
  const { slug } = await params

  const category = await Category.findOne({ slug, isActive: true }).lean<any>()

  return {
    title: category ? `${category.name} - Products` : 'Category',
    description: category?.description || `Browse products in ${category?.name || 'this category'}`,
  }
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  await dbConnect()
  const { slug } = await params
  const search = await searchParams

  const buildPageHref = (nextPage: number) => {
    const queryParams = new URLSearchParams()

    Object.entries(search).forEach(([key, value]) => {
      if (value === undefined) return

      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item) queryParams.append(key, item)
        })
        return
      }

      if (value) {
        queryParams.set(key, value)
      }
    })

    if (nextPage <= 1) {
      queryParams.delete('page')
    } else {
      queryParams.set('page', String(nextPage))
    }

    const query = queryParams.toString()
    return query ? `/category/${slug}?${query}` : `/category/${slug}`
  }

  // Fetch category
  const categoryRaw = await Category.findOne({ slug, isActive: true })
    .populate('parent', 'name slug')
    .populate('children', 'name slug image')
    .lean<any>()

  if (!categoryRaw) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Category not found</h1>
        <p className="text-muted-foreground mb-6">
          The category you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    )
  }

  const category = toPlainObject(categoryRaw)

  // Build product query
  const buildQuery: any = { isActive: true }

  // Category filter
  const categoryIds = [category._id]
  buildQuery.category = { $in: categoryIds }

  // Optional filters
  if (search.search) {
    buildQuery.$text = { $search: search.search as string }
  }

  if (search.minPrice || search.maxPrice) {
    buildQuery.price = {}
    if (search.minPrice) buildQuery.price.$gte = parseFloat(search.minPrice as string)
    if (search.maxPrice) buildQuery.price.$lte = parseFloat(search.maxPrice as string)
  }

  if (search.minRating) {
    buildQuery['ratings.average'] = { $gte: parseFloat(search.minRating as string) }
  }

  if (search.minDiscount) {
    buildQuery.discountPercent = { $gte: parseFloat(search.minDiscount as string) }
  }

  if (search.inStock === 'true') {
    buildQuery.stock = { $gt: 0 }
  }

  if (search.isFeatured !== undefined) {
    buildQuery.isFeatured = search.isFeatured === 'true'
  }

  // Sorting
  const sortBy = search.sortBy as string || 'createdAt'
  const sortOrder = search.sortOrder === 'asc' ? 1 : -1
  const sort: any = {}
  if (sortBy && ['price', 'ratings.average', 'soldCount', 'discountPercent', 'createdAt'].includes(sortBy)) {
    sort[sortBy] = sortOrder
  } else {
    sort.createdAt = -1
  }

  // Pagination
  const page = parseInt(search.page as string) || 1
  const limit = parseInt(search.limit as string) || 12
  const skip = (page - 1) * limit

  // Fetch products
  const [products, total] = await Promise.all([
    Product.find(buildQuery)
      .populate('category', 'name slug image')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(buildQuery),
  ])

  const productsPlain = products.map(toPlainObject)

  const pagination = {
    page,
    pages: Math.ceil(total / limit),
    total,
  }

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Categories', href: '/products' },
    { label: category.name },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb items={breadcrumbItems} />

      <div className="my-8">
        <div className="relative h-64 rounded-lg overflow-hidden mb-4">
          {category.image?.url ? (
            <Image
              src={category.image.url}
              alt={category.name}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/5 flex items-center justify-center">
              <span className="text-6xl font-bold text-primary/30">{category.name.charAt(0)}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h1 className="text-4xl font-bold mb-2">{category.name}</h1>
            {category.description && (
              <p className="text-lg text-white/80">{category.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Mobile Filter Button */}
        <div className="lg:hidden mb-4">
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
                <CategorySidebar category={category as any} />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24">
            <CategorySidebar category={category as any} />
          </div>
        </aside>

        {/* Product Grid */}
        <main className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-muted-foreground">
              {pagination.total} products found
            </div>
            <div className="flex items-center gap-2">
              <SortDropdown />
            </div>
          </div>

          {productsPlain.length > 0 ? (
            <ProductGrid products={productsPlain} />
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found in this category.</p>
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: pagination.pages }).map((_, i) => (
                <Link
                  key={i}
                  href={buildPageHref(i + 1)}
                  className={`px-3 py-2 rounded-md ${
                    pagination.page === i + 1
                      ? 'bg-primary text-primary-foreground'
                      : 'border hover:bg-muted'
                  }`}
                  aria-current={pagination.page === i + 1 ? 'page' : undefined}
                >
                  {i + 1}
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
