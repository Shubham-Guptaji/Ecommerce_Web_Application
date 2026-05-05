// src/app/(store)/products/page.tsx
import Link from 'next/link'
import { Metadata } from 'next'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Layers3,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react'
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

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

function countActiveFilters(search: Record<string, string | string[] | undefined>) {
  let count = 0

  if (search.category) count += 1
  if (search.minPrice || search.maxPrice) count += 1
  if (search.minRating) count += 1
  if (search.minDiscount) count += 1
  if (search.inStock === 'true') count += 1
  if (search.isFeatured === 'true') count += 1
  if (search.search) count += 1

  return count
}

function StatCard({
  value,
  label,
  icon: Icon,
  delay = 0,
}: {
  value: string
  label: string
  icon: typeof ShieldCheck
  delay?: number
}) {
  return (
    <div
      className="catalog-reveal rounded-[1.8rem] border border-white/15 bg-white/10 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-3xl font-black tracking-tight text-white">{value}</p>
          <p className="mt-1 text-sm text-slate-300">{label}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300 text-slate-950 shadow-lg shadow-amber-300/10">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await dbConnect()
  const search = await searchParams

  const buildPageHref = (nextPage: number) => {
    const params = new URLSearchParams()

    Object.entries(search).forEach(([key, value]) => {
      if (value === undefined) return

      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item) params.append(key, item)
        })
        return
      }

      if (value) {
        params.set(key, value)
      }
    })

    if (nextPage <= 1) {
      params.delete('page')
    } else {
      params.set('page', String(nextPage))
    }

    const query = params.toString()
    return query ? `/products?${query}` : '/products'
  }

  // Build query from searchParams
  const buildQuery: any = { isActive: true }

  // Category filter (single or comma-separated)
  if (search.category) {
    const slugs = Array.isArray(search.category)
      ? search.category
      : search.category.split(',').map((s) => s.trim()).filter(Boolean)
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
  if (
    sortBy === 'price' ||
    sortBy === 'ratings.average' ||
    sortBy === 'soldCount' ||
    sortBy === 'discountPercent' ||
    sortBy === 'createdAt'
  ) {
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

  const searchTerm = getSearchValue(search.search)
  const selectedCategorySlugs = search.category
    ? Array.isArray(search.category)
      ? search.category
      : search.category.split(',').map((slug) => slug.trim()).filter(Boolean)
    : []
  const categoryNameMap = new Map(
    categories.map((category: any) => [category.slug as string, category.name as string])
  )
  const selectedCategoryNames = selectedCategorySlugs
    .map((slug) => categoryNameMap.get(slug))
    .filter(Boolean) as string[]
  const activeFilterCount = countActiveFilters(search)
  const hasContextFilters = activeFilterCount > 0
  const rangeStart = pagination.total === 0 ? 0 : skip + 1
  const rangeEnd = skip + products.length

  return (
    <div className="min-h-screen overflow-hidden bg-[#f8f5ef] text-slate-950 dark:bg-slate-950 dark:text-white">
      <style>{`
@keyframes catalogFadeUp {
  from { opacity: 0; transform: translateY(26px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes catalogFloat {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(0, -16px, 0); }
}
@keyframes catalogDrift {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(18px, -12px, 0) scale(1.06); }
}
.catalog-reveal {
  opacity: 0;
  animation: catalogFadeUp 0.82s cubic-bezier(.22,1,.36,1) forwards;
}
.catalog-delay-1 { animation-delay: 110ms; }
.catalog-delay-2 { animation-delay: 220ms; }
.catalog-delay-3 { animation-delay: 330ms; }
.catalog-float { animation: catalogFloat 8s ease-in-out infinite; }
.catalog-drift { animation: catalogDrift 12s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .catalog-reveal,
  .catalog-float,
  .catalog-drift {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
  * {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
`}</style>

      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(251,191,36,0.22),transparent_24%),radial-gradient(circle_at_86%_20%,rgba(125,211,252,0.16),transparent_28%),linear-gradient(135deg,#020617_0%,#0f172a_58%,#1e293b_100%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:54px_54px]" />
        <div className="absolute left-[-8%] top-20 h-56 w-56 rounded-full bg-amber-300/25 blur-3xl catalog-drift" />
        <div className="absolute right-0 top-24 h-72 w-72 rounded-full bg-sky-300/15 blur-3xl catalog-float" />

        <div className="container relative z-10 mx-auto px-4 py-16 md:py-20 lg:py-24">
          <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1.08fr)_340px]">
            <div className="max-w-4xl">
              <Badge className="catalog-reveal rounded-full border border-amber-300/30 bg-amber-300/15 px-4 py-1.5 text-amber-100 hover:bg-amber-300/20">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Premium product discovery
              </Badge>

              <h1 className="catalog-reveal catalog-delay-1 mt-5 text-4xl font-black leading-[0.95] tracking-[-0.06em] text-white sm:text-5xl md:text-6xl">
                Explore the catalog with a sharper editorial edge.
              </h1>

              <p className="catalog-reveal catalog-delay-2 mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
                Every filter, sort, and merchandising control is still here. The difference now is
                the experience feels curated, modern, and far more intentional.
              </p>

              <div className="catalog-reveal catalog-delay-2 mt-6 flex flex-wrap gap-2">
                {searchTerm && (
                  <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm text-white/90 backdrop-blur">
                    <Search className="mr-2 h-3.5 w-3.5 text-amber-300" />
                    Searching for &quot;{searchTerm}&quot;
                  </span>
                )}
                {selectedCategoryNames.slice(0, 2).map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm text-white/90 backdrop-blur"
                  >
                    <Layers3 className="mr-2 h-3.5 w-3.5 text-amber-300" />
                    {name}
                  </span>
                ))}
                {search.inStock === 'true' && (
                  <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm text-white/90 backdrop-blur">
                    <ShieldCheck className="mr-2 h-3.5 w-3.5 text-amber-300" />
                    In stock only
                  </span>
                )}
                {search.isFeatured === 'true' && (
                  <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm text-white/90 backdrop-blur">
                    <Sparkles className="mr-2 h-3.5 w-3.5 text-amber-300" />
                    Featured picks
                  </span>
                )}
              </div>

              <div className="catalog-reveal catalog-delay-3 mt-8 flex flex-wrap gap-3">
                <Sheet>
                  <SheetTrigger
                    type="button"
                    className={`${buttonVariants({
                      variant: 'outline',
                    })} w-full rounded-full border-white/20 bg-white/10 font-semibold text-white backdrop-blur hover:bg-white/20 md:hidden`}
                  >
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Open Filters
                  </SheetTrigger>
                  <SheetContent
                    side="bottom"
                    className="h-[85vh] w-full max-w-none overflow-y-auto border-0 bg-[#f8f5ef] px-4 pb-8 pt-4 dark:bg-slate-950 sm:px-6"
                  >
                    <div className="mx-auto w-full max-w-2xl py-4">
                      <h2 className="mb-4 text-xl font-black tracking-tight text-slate-950 dark:text-white">
                        Refine the catalog
                      </h2>
                      <ProductFilters categories={categoryTree} />
                    </div>
                  </SheetContent>
                </Sheet>

                <Button
                  size="lg"
                  asChild
                  className="rounded-full bg-white px-6 text-base font-bold text-slate-950 shadow-2xl shadow-amber-500/10 transition-transform hover:-translate-y-0.5 hover:bg-amber-100"
                >
                  <Link href="/products?isFeatured=true">
                    Featured Picks <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="rounded-full border-white/20 bg-white/10 px-6 text-base font-bold text-white backdrop-blur hover:bg-white/20"
                >
                  <Link href="/products?sortBy=ratings.average&sortOrder=desc">
                    Best Rated <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <StatCard
                value={pagination.total.toString()}
                label="Products matching this catalog view"
                icon={ShieldCheck}
              />
              <StatCard
                value={categories.length.toString()}
                label="Active categories available to browse"
                icon={Layers3}
                delay={100}
              />
              <StatCard
                value={activeFilterCount.toString()}
                label="Filters currently shaping the result set"
                icon={SlidersHorizontal}
                delay={200}
              />
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#f8f5ef] to-transparent dark:from-slate-950" />
      </section>

      <section className="relative z-10 -mt-10 pb-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-[310px_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <ProductFilters categories={categoryTree} />
              </div>
            </aside>

            <main className="min-w-0">
              <div className="catalog-reveal rounded-[2rem] border border-white/70 bg-white/88 p-5 shadow-[0_22px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/82 dark:shadow-[0_22px_70px_rgba(0,0,0,0.32)] md:p-6">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full border border-amber-300/50 bg-amber-100/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200">
                        Curated results
                      </span>
                      {hasContextFilters && (
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
                          {activeFilterCount} active filter{activeFilterCount === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>

                    <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                      {pagination.total > 0
                        ? `Showing ${rangeStart}-${rangeEnd} of ${pagination.total} products`
                        : 'No products matched this view'}
                    </h2>

                    <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                      {searchTerm
                        ? `Results for "${searchTerm}" with the current catalog filters and sort order.`
                        : 'Browse the full catalog with premium filtering, quick sorting, and a cleaner discovery flow.'}
                    </p>

                    {selectedCategoryNames.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {selectedCategoryNames.map((name) => (
                          <span
                            key={name}
                            className="inline-flex rounded-full border border-slate-200/80 bg-white px-3 py-1 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <SortDropdown className="h-11 px-5" />
                  </div>
                </div>
              </div>

              {products.length > 0 ? (
                <div className="catalog-reveal catalog-delay-1 mt-6 rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,245,239,0.78))] p-4 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.84))] dark:shadow-[0_24px_80px_rgba(0,0,0,0.34)] md:p-6">
                  <ProductGrid
                    products={products as any[]}
                    columns={3}
                    variant="editorial"
                    itemClassName="catalog-reveal"
                    stagger
                  />
                </div>
              ) : (
                <div className="catalog-reveal catalog-delay-1 mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-white/82 px-6 py-14 text-center shadow-[0_20px_60px_rgba(15,23,42,0.06)] dark:border-white/15 dark:bg-slate-950/70 dark:shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
                  <div className="mx-auto max-w-xl">
                    <span className="inline-flex rounded-full border border-amber-300/50 bg-amber-100/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200">
                      No matches yet
                    </span>
                    <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                      No products found matching your criteria.
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                      Try widening the price range, clearing a few filters, or browsing the full catalog again.
                    </p>
                    <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                      <Button
                        asChild
                        className="rounded-full bg-slate-950 px-6 font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                      >
                        <Link href="/products">
                          Clear Filters <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        asChild
                        className="rounded-full border-slate-300 bg-white/80 px-6 font-semibold hover:bg-white dark:border-white/10 dark:bg-slate-900/70 dark:hover:bg-slate-800"
                      >
                        <Link href="/">
                          Back Home <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {pagination.pages > 1 && (
                <div className="catalog-reveal catalog-delay-2 mt-8 flex flex-col items-center gap-4">
                  <div className="inline-flex items-center rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-200">
                    Page {pagination.page} of {pagination.pages}
                  </div>

                  <div className="flex flex-wrap justify-center gap-2">
                    {pagination.page > 1 && (
                      <Link
                        href={buildPageHref(pagination.page - 1)}
                        className="inline-flex items-center rounded-full border border-slate-300/80 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-200 dark:hover:bg-slate-900"
                      >
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Prev
                      </Link>
                    )}

                    {Array.from({ length: pagination.pages }).map((_, i) => (
                      <Link
                        key={i}
                        href={buildPageHref(i + 1)}
                        className={`inline-flex min-w-11 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                          pagination.page === i + 1
                            ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/15 dark:bg-white dark:text-slate-950'
                            : 'border border-slate-300/80 bg-white/85 text-slate-700 shadow-sm backdrop-blur hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-200 dark:hover:bg-slate-900'
                        }`}
                        aria-current={pagination.page === i + 1 ? 'page' : undefined}
                      >
                        {i + 1}
                      </Link>
                    ))}

                    {pagination.page < pagination.pages && (
                      <Link
                        href={buildPageHref(pagination.page + 1)}
                        className="inline-flex items-center rounded-full border border-slate-300/80 bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-200 dark:hover:bg-slate-900"
                      >
                        Next
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </section>
    </div>
  )
}
