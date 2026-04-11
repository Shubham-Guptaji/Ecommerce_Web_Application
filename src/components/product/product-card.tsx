'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Heart, ShoppingCart, Star, Package } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
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
}

export function ProductCard({ product, showWishlist = true, isLoading = false }: ProductCardProps) {
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

  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg">
        <div className="aspect-square relative bg-muted">
          {product.images?.[0]?.url ? (
            <Image
              src={product.images[0].url}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Package className="h-16 w-16 opacity-20" />
            </div>
          )}

          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {hasDiscount && (
              <Badge variant="destructive" className="text-xs">
                {product.discountPercent}% OFF
              </Badge>
            )}
            {product.isFeatured && (
              <Badge variant="default" className="text-xs bg-blue-500">
                Featured
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {showWishlist && (
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 bg-background/80 backdrop-blur-sm"
                onClick={handleWishlistToggle}
              >
                <Heart
                  className={`h-4 w-4 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`}
                />
              </Button>
            )}
            <Button
              size="icon"
              className="h-8 w-8 bg-primary/90 backdrop-blur-sm hover:bg-primary"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Add */}
          <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              className="w-full"
              onClick={handleAddToCart}
            >
              Add to Cart
            </Button>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            </div>
            <span className="text-sm text-muted-foreground">
              {(product.ratings?.average || 0).toFixed(1)} ({product.ratings?.count || 0})
            </span>
          </div>

          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {product.shortDescription}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-red-600">
                {formatCurrency(currentPrice)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatCurrency(product.price)}
                </span>
              )}
            </div>

            {product.stock > 0 ? (
              <Badge variant="secondary" className="text-xs">
                In Stock
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">
                Out of Stock
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
