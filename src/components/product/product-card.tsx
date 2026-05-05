'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Heart, ShoppingCart, Star, Package } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import type { IProduct } from '@/models/Product'
import { useCartStore } from '@/store/cartStore'
import { useWishlist } from '@/hooks/useWishlist'
import { useSession } from 'next-auth/react'
import { toast } from '@/hooks/use-toast'
import { ProductCardSkeleton } from '@/components/shared/skeleton'

interface ProductCardProps {
  product?: IProduct
  showWishlist?: boolean
  isLoading?: boolean
  variant?: 'default' | 'editorial'
}

export function ProductCard({
  product,
  showWishlist = true,
  isLoading = false,
  variant = 'default',
}: ProductCardProps) {
  // Call hooks first (unconditionally)
  const { addItem } = useCartStore()
  const { toggleWishlist, items: wishlistItems } = useWishlist()
  const { data: session } = useSession()
  const isAuthenticated = !!session?.user

  if (isLoading) {
    return <ProductCardSkeleton />
  }

  if (!product) {
    return null
  }

  const isInWishlist = wishlistItems.some((p) => p._id.toString() === product._id.toString())

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add items to cart',
        variant: 'destructive',
      })
      return
    }

    addItem({
      product: product._id,
      name: product.name,
      image: product.images?.[0]?.url,
      price: product.price,
      discountedPrice: product.discountedPrice,
      quantity: 1,
    })

    toast({
      title: 'Added to cart',
      description: `${product.name} has been added to your cart`,
    })
  }

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to manage wishlist',
        variant: 'destructive',
      })
      return
    }

    try {
      await toggleWishlist(product._id.toString())
      toast({
        title: 'Wishlist updated',
      })
    } catch (error) {
      // Error handled in hook
    }
  }

  const currentPrice = product.discountedPrice || product.price
  const hasDiscount = product.discountedPrice && product.discountedPrice < product.price
  const isEditorial = variant === 'editorial'

  return (
    <Link href={`/products/${product.slug}`}>
      <Card
        className={cn(
          'group overflow-hidden transition-all',
          isEditorial
            ? 'rounded-[1.9rem] border border-white/70 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl duration-500 hover:-translate-y-2 hover:shadow-[0_28px_80px_rgba(15,23,42,0.16)] dark:border-white/10 dark:bg-slate-950/90 dark:shadow-[0_20px_60px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_28px_80px_rgba(0,0,0,0.4)]'
            : 'hover:shadow-lg'
        )}
      >
        <div
          className={cn(
            'relative bg-muted',
            isEditorial ? 'aspect-[4/4.7] overflow-hidden' : 'aspect-square'
          )}
        >
          {product.images?.[0]?.url ? (
            <Image
              src={product.images[0].url}
              alt={product.name}
              fill
              className={cn(
                'object-cover transition-transform',
                isEditorial ? 'duration-700 group-hover:scale-110' : 'group-hover:scale-105'
              )}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div
              className={cn(
                'flex h-full w-full items-center justify-center text-muted-foreground',
                isEditorial &&
                  'bg-gradient-to-br from-amber-100 via-stone-100 to-sky-100 dark:from-slate-800 dark:via-slate-900 dark:to-sky-950'
              )}
            >
              <Package className="h-16 w-16 opacity-20" />
            </div>
          )}

          {/* Overlay Actions */}
          <div
            className={cn(
              'absolute inset-0 transition-colors',
              isEditorial
                ? 'bg-gradient-to-t from-slate-950/45 via-slate-950/0 to-transparent group-hover:from-slate-950/55'
                : 'bg-black/0 group-hover:bg-black/10'
            )}
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {hasDiscount && (
              <Badge
                variant="destructive"
                className={cn(
                  'text-xs',
                  isEditorial && 'rounded-full border-0 bg-amber-400 px-3 py-1 text-slate-950'
                )}
              >
                {product.discountPercent}% OFF
              </Badge>
            )}
            {product.isFeatured && (
              <Badge
                variant="default"
                className={cn(
                  'text-xs bg-blue-500',
                  isEditorial && 'rounded-full border-0 bg-slate-950/90 px-3 py-1 text-white dark:bg-white/90 dark:text-slate-950'
                )}
              >
                Featured
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div
            className={cn(
              'absolute top-2 right-2 flex flex-col gap-2 opacity-0 transition-all group-hover:opacity-100',
              isEditorial ? 'translate-y-2 group-hover:translate-y-0' : ''
            )}
          >
            {showWishlist && (
              <Button
                size="icon"
                variant="secondary"
                className={cn(
                  'h-8 w-8 bg-background/80 backdrop-blur-sm',
                  isEditorial &&
                    'rounded-full border border-white/60 bg-white/90 text-slate-950 shadow-lg hover:bg-white dark:border-white/10 dark:bg-slate-900/85 dark:text-white dark:hover:bg-slate-800'
                )}
                onClick={handleWishlistToggle}
              >
                <Heart
                  className={`h-4 w-4 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`}
                />
              </Button>
            )}
            <Button
              size="icon"
              className={cn(
                'h-8 w-8 bg-primary/90 backdrop-blur-sm hover:bg-primary',
                isEditorial &&
                  'rounded-full bg-slate-950 text-white shadow-lg hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100'
              )}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Add */}
          <div
            className={cn(
              'absolute bottom-2 left-2 right-2 opacity-0 transition-all group-hover:opacity-100',
              isEditorial ? 'translate-y-3 group-hover:translate-y-0' : ''
            )}
          >
            <Button
              size="sm"
              className={cn(
                'w-full',
                isEditorial &&
                  'rounded-full bg-white/92 font-semibold text-slate-950 shadow-lg backdrop-blur hover:bg-white dark:bg-slate-950/90 dark:text-white dark:hover:bg-slate-900'
              )}
              onClick={handleAddToCart}
            >
              {isEditorial ? 'Quick Add' : 'Add to Cart'}
            </Button>
          </div>
        </div>

        <CardContent className={cn(isEditorial ? 'p-5' : 'p-4')}>
          <div className="mb-2 flex items-center gap-1">
            <div className="flex items-center">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            </div>
            <span
              className={cn(
                'text-sm text-muted-foreground',
                isEditorial && 'text-slate-500 dark:text-slate-400'
              )}
            >
              {(product.ratings?.average || 0).toFixed(1)} ({product.ratings?.count || 0})
            </span>
          </div>

          <h3
            className={cn(
              'mb-2 line-clamp-2 text-lg font-semibold transition-colors group-hover:text-primary',
              isEditorial &&
                'text-xl font-black tracking-tight text-slate-950 group-hover:text-amber-700 dark:text-white dark:group-hover:text-amber-300'
            )}
          >
            {product.name}
          </h3>

          <p
            className={cn(
              'mb-3 line-clamp-2 text-sm text-muted-foreground',
              isEditorial && 'leading-6 text-slate-600 dark:text-slate-300'
            )}
          >
            {product.shortDescription}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'text-xl font-bold text-red-600',
                  isEditorial && 'text-slate-950 dark:text-white'
                )}
              >
                {formatCurrency(currentPrice)}
              </span>
              {hasDiscount && (
                <span
                  className={cn(
                    'text-sm text-muted-foreground line-through',
                    isEditorial && 'text-slate-400 dark:text-slate-500'
                  )}
                >
                  {formatCurrency(product.price)}
                </span>
              )}
            </div>

            {product.stock > 0 ? (
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs',
                  isEditorial &&
                    'rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                )}
              >
                In Stock
              </Badge>
            ) : (
              <Badge
                variant="destructive"
                className={cn(
                  'text-xs',
                  isEditorial && 'rounded-full px-3 py-1'
                )}
              >
                Out of Stock
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
