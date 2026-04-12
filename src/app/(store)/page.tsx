// src/app/(store)/page.tsx
// src/app/(store)/page.tsx
import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  Truck,
  Shield,
  CreditCard,
  Star,
  Users,
  Package,
  CheckCircle,
} from 'lucide-react'
import { formatCurrency, toPlainObject } from '@/lib/utils'
import { ProductGrid } from '@/components/product/product-grid'

export const dynamic = 'force-dynamic'

import { CategoryGrid } from '@/components/category/category-grid'
import { Skeleton } from '@/components/shared/skeleton'
import { NewsletterForm } from '@/components/shared/newsletter-form'
import { CountdownTimer } from '@/components/shared/countdown-timer'
import { dbConnect } from '@/lib/db'
import Product, { type IProduct } from '@/models/Product'
import Category, { type ICategory } from '@/models/Category'

function getNextMidnightIST(): Date {
  const OFFSET_MS = 5.5 * 60 * 60 * 1000 // IST offset in milliseconds (UTC+5:30)
  const now = Date.now()
  // Current time adjusted to IST perspective
  const nowIST = new Date(now + OFFSET_MS)
  const year = nowIST.getUTCFullYear()
  const month = nowIST.getUTCMonth()
  const day = nowIST.getUTCDate()
  // Create a timestamp for midnight IST of that day (in UTC it's 18:30 previous day)
  const midnightIST = new Date(Date.UTC(year, month, day, 0, 0, 0) - OFFSET_MS)
  // If this midnight has already passed, add 24 hours
  if (midnightIST.getTime() <= now) {
    midnightIST.setTime(midnightIST.getTime() + 24 * 60 * 60 * 1000)
  }
  return midnightIST
}

async function getFeaturedProducts() {
  try {
    await dbConnect()
    const products = await Product.find({ isFeatured: true, isActive: true })
      .limit(8)
      .lean()
    return { data: products }
  } catch (error) {
    console.error('Failed to fetch featured products:', error)
    return { data: [] }
  }
}

async function getCategories() {
  try {
    await dbConnect()
    const categories = await Category.find({ isActive: true })
      .populate('parent', 'name slug')
      .populate('children', 'name slug image')
      .sort({ name: 1 })
      .lean()

    // Build tree structure
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

    const flatCategories = categories.map((cat: any) => ({
      _id: cat._id,
      name: cat.name,
      slug: cat.slug,
      image: cat.image,
      parent: cat.parent,
      hasChildren: cat.children && cat.children.length > 0,
    }))

    return { data: { tree: categoryTree, flat: flatCategories } }
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return { data: { tree: [], flat: [] } }
  }
}

async function getFlashSaleProducts() {
  try {
    await dbConnect()
    const products = await Product.find({
      isActive: true,
      discountPercent: { $gte: 20 },
    })
      .sort({ discountPercent: -1 })
      .limit(8)
      .lean()
    return { data: products }
  } catch (error) {
    console.error('Failed to fetch flash sale products:', error)
    return { data: [] }
  }
}

async function getBestSellers() {
  try {
    await dbConnect()
    const products = await Product.find({ isActive: true })
      .sort({ soldCount: -1 })
      .limit(8)
      .lean()
    return { data: products }
  } catch (error) {
    console.error('Failed to fetch best sellers:', error)
    return { data: [] }
  }
}

async function getNewArrivals() {
  try {
    await dbConnect()
    const products = await Product.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean()
    return { data: products }
  } catch (error) {
    console.error('Failed to fetch new arrivals:', error)
    return { data: [] }
  }
}

export default async function HomePage() {
  const [featuredData, categoriesData, flashSaleData, newArrivalsData, bestSellersData] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
    getFlashSaleProducts(),
    getNewArrivals(),
    getBestSellers(),
  ])

  const featuredProducts = (featuredData.data || []).map(toPlainObject)
  const categories = (categoriesData.data?.flat || []).map(toPlainObject)
  const flashSaleProducts = (flashSaleData.data || []).map(toPlainObject)
  const newArrivals = (newArrivalsData.data || []).map(toPlainObject)
  const bestSellers = (bestSellersData.data || []).map(toPlainObject)

  // Calculate countdown to next midnight IST
  const flashSaleEnds = getNextMidnightIST()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 md:py-32 overflow-hidden">
        {/* Geometric shapes */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-white/20 to-white/5 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-gradient-to-br from-yellow-300/20 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-br from-green-300/10 to-transparent rounded-lg rotate-45 animate-pulse" />

        <style>{`
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fadeInUp 1s ease-out forwards;
}
`}</style>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-white/20 hover:bg-white/30">
              New Collection 2026
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight animate-fade-in-up">
              Discover Your Perfect Style
            </h1>
            <p className="text-xl mb-8 text-blue-100 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Shop the latest trends with exclusive deals. Quality products at unbeatable prices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <Button size="lg" asChild className="text-lg">
                <Link href="/products">
                  Shop Now <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg bg-white/10 border-white text-white hover:bg-white/20" asChild>
                <Link href="/products?sort=discount">
                  View Deals <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent"></div>
      </section>

      {/* Trust Badges */}
      <section className="bg-muted/30 py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold">Free Shipping</p>
                <p className="text-sm text-muted-foreground">On orders above ₹499</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold">Secure Payment</p>
                <p className="text-sm text-muted-foreground">100% protected</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold">Easy Returns</p>
                <p className="text-sm text-muted-foreground">7 days return policy</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold">Authentic Products</p>
                <p className="text-sm text-muted-foreground">100% genuine</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Shop by Category</h2>
            <Button variant="outline" asChild>
              <Link href="/products">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <Suspense fallback={<div className="grid grid-cols-2 md:grid-cols-4 gap-4"><Skeleton className="h-48" /><Skeleton className="h-48" /><Skeleton className="h-48" /><Skeleton className="h-48" /></div>}>
            {categories.length > 0 ? (
              <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory">
                {categories.slice(0, 8).map((category: any) => (
                  <Link
                    key={category._id}
                    href={`/category/${category.slug}`}
                    className="flex-shrink-0 w-64 snap-start group relative overflow-hidden rounded-lg border hover:shadow-lg transition-shadow"
                  >
                    <div className="relative aspect-square bg-muted">
                      {category.image?.url ? (
                        <Image
                          src={category.image.url}
                          alt={category.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          sizes="256px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                          <span className="text-4xl font-bold text-muted-foreground/20">
                            {category.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
                      <h3 className="font-semibold text-xl text-center mb-1">
                        {category.name}
                      </h3>
                      {category.hasChildren && (
                        <span className="text-xs bg-white/20 px-2 py-1 rounded">
                          Subcategories
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No categories available</p>
              </div>
            )}
          </Suspense>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Featured Products</h2>
            <Button variant="outline" asChild>
              <Link href="/products?isFeatured=true">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <Suspense fallback={<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"><Skeleton className="h-80" /><Skeleton className="h-80" /><Skeleton className="h-80" /><Skeleton className="h-80" /></div>}>
            {featuredProducts.length > 0 ? (
              <ProductGrid products={featuredProducts} />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No featured products</p>
              </div>
            )}
          </Suspense>
        </div>
      </section>

      {/* Flash Sale */}
      {flashSaleProducts.length > 0 && (
        <section className="py-16 bg-gradient-to-r from-orange-500 to-red-600 text-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
              <div>
                <Badge variant="secondary" className="mb-2">Limited Time</Badge>
                <h2 className="text-3xl font-bold">Flash Sale</h2>
                <p className="mt-2">Ends in: <CountdownTimer targetDate={flashSaleEnds} /></p>
              </div>
              <Button variant="outline" asChild className="mt-4 md:mt-0 bg-white/10 border-white text-white hover:bg-white/20">
                <Link href="/products?sort=discount">
                  View All Deals <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {flashSaleProducts.slice(0, 4).map((product: any) => (
                <Card key={product._id} className="overflow-hidden group hover:shadow-lg transition-shadow bg-background text-foreground">
                  <Link href={`/products/${product.slug}`}>
                    <div className="aspect-square relative bg-muted">
                      {product.images?.[0]?.url && (
                        <Image
                          src={product.images[0].url}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      )}
                      {product.discountPercent > 0 && (
                        <Badge className="absolute top-2 left-2 bg-red-500">
                          -{product.discountPercent}%
                        </Badge>
                      )}
                    </div>
                  </Link>
                  <CardContent className="p-4">
                    <Link href={`/products/${product.slug}`}>
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm ml-1">{product.ratings?.average?.toFixed(1) || '0.0'}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({product.ratings?.count || 0} reviews)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {product.discountedPrice ? (
                        <>
                          <span className="text-xl font-bold text-red-600">
                            {formatCurrency(product.discountedPrice)}
                          </span>
                          <span className="text-sm text-muted-foreground line-through">
                            {formatCurrency(product.price)}
                          </span>
                        </>
                      ) : (
                        <span className="text-xl font-bold">
                          {formatCurrency(product.price)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">New Arrivals</h2>
            <Button variant="outline" asChild>
              <Link href="/products?sortBy=createdAt&sortOrder=desc">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.length > 0 ? (
              newArrivals.map((product: any) => (
                <Card key={product._id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                  <Link href={`/products/${product.slug}`}>
                    <div className="aspect-square relative bg-muted">
                      {product.images?.[0]?.url && (
                        <Image
                          src={product.images[0].url}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm ml-1">{product.ratings?.average?.toFixed(1) || '0.0'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {product.discountedPrice ? (
                          <>
                            <span className="text-xl font-bold text-red-600">{formatCurrency(product.discountedPrice)}</span>
                            <span className="text-sm text-muted-foreground line-through">{formatCurrency(product.price)}</span>
                          </>
                        ) : (
                          <span className="text-xl font-bold">{formatCurrency(product.price)}</span>
                        )}
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No new arrivals yet</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="bg-primary text-primary-foreground py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg font-semibold">
            Free delivery on orders above ₹499
          </p>
        </div>
      </section>

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">Best Sellers</h2>
              <Button variant="outline" asChild>
                <Link href="/products?sortBy=soldCount&sortOrder=desc">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bestSellers.slice(0, 4).map((product: any) => (
                <Card key={product._id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                  <Link href={`/products/${product.slug}`}>
                    <div className="aspect-square relative bg-muted">
                      {product.images?.[0]?.url && (
                        <Image
                          src={product.images[0].url}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                      )}
                    </div>
                  </Link>
                  <CardContent className="p-4">
                    <Link href={`/products/${product.slug}`}>
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm ml-1">{product.ratings?.average?.toFixed(1) || '0.0'}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({product.ratings?.count || 0} reviews)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {product.discountedPrice ? (
                        <>
                          <span className="text-xl font-bold text-red-600">
                            {formatCurrency(product.discountedPrice)}
                          </span>
                          <span className="text-sm text-muted-foreground line-through">
                            {formatCurrency(product.price)}
                          </span>
                        </>
                      ) : (
                        <span className="text-xl font-bold">
                          {formatCurrency(product.price)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Customers Love Us</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Experience the difference with our commitment to quality, service, and value
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">10,000+ Happy Customers</h3>
              <p className="text-muted-foreground">
                Join thousands of satisfied customers who trust us for their shopping needs
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality Assured</h3>
              <p className="text-muted-foreground">
                Every product is carefully selected and quality checked before delivery
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">5-Star Service</h3>
              <p className="text-muted-foreground">
                Dedicated support team ready to help you with any questions or concerns
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="mb-8 text-primary-foreground/80 max-w-xl mx-auto">
            Subscribe to our newsletter for the latest deals, new arrivals, and exclusive offers.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </div>
  )
}
