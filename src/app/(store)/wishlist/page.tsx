// src/app/(store)/wishlist/page.tsx
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Heart, ShoppingBag, Trash2 } from 'lucide-react'
import { useWishlist } from '@/hooks/useWishlist'
import Image from 'next/image'
import Link from 'next/link'
import { useCartStore } from '@/store/cartStore'
import { toast } from '@/hooks/use-toast'
import { getPrimaryProductImage } from '@/lib/product-image'

export default function WishlistPage() {
  const { items, removeItem, clearWishlist, loadWishlist } = useWishlist()
  const { addItem: addToCart } = useCartStore()

  useEffect(() => {
    // Scroll to top on page load
    window.scrollTo(0, 0)
    // Load wishlist data
    loadWishlist()
  }, [loadWishlist])

  const handleAddToCart = (product: any) => {
    const image = getPrimaryProductImage(product)

    // Add to cart
    addToCart({
      product: product._id,
      name: product.name,
      image: image || undefined,
      price: product.discountedPrice ?? product.price ?? 0,
      quantity: 1,
    })
    // Remove from wishlist
    removeItem(product._id.toString())
    toast({
      title: 'Added to Cart',
      description: `${product.name} has been added to your cart and removed from wishlist`,
    })
  }

  const handleRemoveItem = (productId: string, productName: string) => {
    removeItem(productId)
    toast({
      title: 'Removed from Wishlist',
      description: `${productName} has been removed`,
    })
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <Heart className="h-24 w-24 text-muted-foreground mx-auto" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Your Wishlist is Empty</h1>
          <p className="text-muted-foreground mb-8">
            Save items you love by clicking the heart icon on product pages.
            They&apos;ll show up here for easy access.
          </p>
          <Button asChild size="lg">
            <Link href="/products">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Start Shopping
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Wishlist</h1>
          <p className="text-muted-foreground mt-1">
            {items.length} {items.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>
        <Button
          variant="outline"
          onClick={clearWishlist}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear All
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item) => {
          const image = getPrimaryProductImage(item)

          return (
            <div
              key={item._id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
            <Link href={`/products/${item.slug}`} className="block">
              <div className="relative aspect-square mb-4 bg-muted rounded-md overflow-hidden">
                {image ? (
                  <Image
                    src={image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl text-muted-foreground/30">
                      {item.name.charAt(0)}
                    </span>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                  onClick={(e) => {
                    e.preventDefault()
                    handleRemoveItem(item._id, item.name)
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                {item.name}
              </h3>
              <div className="flex items-center gap-2 mb-4">
                {item.discountedPrice ? (
                  <>
                    <span className="font-bold text-lg text-primary">
                      ${typeof item.discountedPrice === 'number' ? item.discountedPrice.toFixed(2) : '0.00'}
                    </span>
                    <span className="text-sm text-muted-foreground line-through">
                      ${typeof item.price === 'number' ? item.price.toFixed(2) : '0.00'}
                    </span>
                  </>
                ) : (
                  <span className="font-bold text-lg">
                    ${typeof item.price === 'number' ? item.price.toFixed(2) : '0.00'}
                  </span>
                )}
              </div>
            </Link>
            <Button
              className="w-full"
              onClick={() => handleAddToCart(item)}
              disabled={item.stock === 0}
            >
              {item.stock === 0 ? 'Out of Stock' : 'Add to Cart & Remove'}
            </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
