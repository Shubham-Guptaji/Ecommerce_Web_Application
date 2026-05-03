// src/app/(store)/products/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Image from 'next/image'
import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/shared/skeleton'
import { ProductGrid } from '@/components/product/product-grid'
import { CartDrawer } from '@/components/cart/cart-drawer'
import { ReviewForm } from '@/components/product/review-form'
import { ProductActions } from '@/components/product/product-actions'
import { ProductImageGallery } from '@/components/product/product-image-gallery'
import { ProductReviewsClient } from '@/components/product/product-reviews-client'
import { formatCurrency, toPlainObject } from '@/lib/utils'
import { getApiBaseUrl } from '@/lib/site-url'




import { auth } from '@/lib/auth'
import { dbConnect } from '@/lib/db'
import Order from '@/models/Order'
import {
  Star,
  Minus,
  Plus,
  ShoppingCart,
  Heart,
  Share2,
  Truck,
  Shield,
  RefreshCw,
} from 'lucide-react'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getProduct(slug: string) {
  try {
    const apiBaseUrl = getApiBaseUrl()
    const res = await fetch(`${apiBaseUrl}/api/products/by-slug/${slug}`, {
      cache: 'no-store',
    })

    if (!res.ok) {
      return null
    }

    return res.json()
  } catch (error) {
    console.error('Failed to fetch product:', error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const productData = await getProduct(slug)

  if (!productData) {
    return {
      title: 'Product Not Found',
    }
  }

  const product = productData.data.product

  return {
    title: `${product.name} | E-Shop`,
    description: product.shortDescription,
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      images: product.images?.map((img: any) => img.url) || [],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.shortDescription,
      images: product.images?.map((img: any) => img.url) || [],
    },
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params
  const productData = await getProduct(slug)

  if (!productData) {
    notFound()
  }

  let { product, reviews, relatedProducts } = productData.data
  product = toPlainObject(product)
  reviews = toPlainObject(reviews)
  relatedProducts = relatedProducts.map(toPlainObject)

  // Check if current user has purchased this product

  const session = await auth()
  let hasPurchased = false
  if (session?.user) {
    try {
      await dbConnect()
      const order = await Order.findOne({
        user: session.user.id,
        'items.product': product._id,
        status: 'delivered',
      })
      hasPurchased = !!order
    } catch (error) {
      console.error('Failed to check purchase status:', error)
    }
  }

  const currentPrice = product.discountedPrice || product.price
  const hasDiscount = product.discountedPrice && product.discountedPrice < product.price

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-6">
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          Home
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link href="/products" className="text-muted-foreground hover:text-foreground">
          Products
        </Link>
        <span className="text-muted-foreground">/</span>
        {product.category && (
          <>
            <Link
              href={`/category/${product.category.slug}`}
              className="text-muted-foreground hover:text-foreground"
            >
              {product.category.name}
            </Link>
            <span className="text-muted-foreground">/</span>
          </>
        )}
        <span className="font-medium">{product.name}</span>
      </nav>

      {/* Product Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Product Images */}
        <ProductImageGallery images={product.images} productName={product.name} />

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.ratings?.average || 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm text-muted-foreground">
                  {product.ratings?.average?.toFixed(1) || '0.0'} ({product.ratings?.count || 0} reviews)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {hasDiscount ? (
                <>
                  <span className="text-4xl font-bold text-red-600">
                    {formatCurrency(currentPrice)}
                  </span>
                  <span className="text-2xl text-muted-foreground line-through">
                    {formatCurrency(product.price)}
                  </span>
                </>
              ) : (
                <span className="text-4xl font-bold">
                  {formatCurrency(product.price)}
                </span>
              )}
            </div>

            <div className="mt-2">
              <Badge
                variant={
                  product.stock === 0
                    ? 'destructive'
                    : product.stock <= 10
                    ? 'secondary'
                    : 'default'
                }
                className="text-sm"
              >
                {product.stock === 0
                  ? 'Out of Stock'
                  : product.stock <= 10
                  ? `Only ${product.stock} left!`
                  : 'In Stock'}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Product Actions */}
          <ProductActions product={product} />

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-4 py-4 border rounded-lg">
            <div className="text-center">
              <Truck className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Free Shipping</p>
              <p className="text-xs text-muted-foreground">Above ₹499</p>
            </div>
            <div className="text-center">
              <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Secure</p>
              <p className="text-xs text-muted-foreground">Payment</p>
            </div>
            <div className="text-center">
              <RefreshCw className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Easy</p>
              <p className="text-xs text-muted-foreground">Returns</p>
            </div>
          </div>

          {/* Short Description */}
          <div className="prose dark:prose-invert max-w-none">
            <p>{product.shortDescription}</p>
          </div>

          {/* SKU */}
          <div className="text-sm text-muted-foreground">
            <p>SKU: {product.sku}</p>
          </div>
        </div>
      </div>

      {/* Product Details + Reviews (Client Component) */}
      <Suspense fallback={
        <div className="mb-16">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-3/4 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      }>
        <ProductReviewsClient product={product} reviews={reviews} hasPurchased={hasPurchased} />
      </Suspense>

      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <ProductGrid products={relatedProducts} columns={4} />
        </div>
      )}
    </div>
  )
}
