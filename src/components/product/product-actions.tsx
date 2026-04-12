'use client'

import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { Minus, Plus, ShoppingCart, Heart, Share2, Loader2, MessageCircle } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { RootState } from '@/store'
import { toggleWishlistItem, selectWishlistItems, selectWishlistLoading } from '@/store/slices/wishlistSlice'
import { formatCurrency } from '@/lib/utils'
import { useAppDispatch } from '@/hooks/useRedux'

interface ProductActionsProps {
  product: {
    _id: string
    slug: string
    name: string
    price: number
    discountedPrice?: number
    stock: number
    images?: Array<{ url: string }>
  }
}

export function ProductActions({ product }: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1)
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  const dispatch = useAppDispatch()
  const wishlistItems = useSelector(selectWishlistItems)
  const wishlistLoading = useSelector(selectWishlistLoading)
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated)

  const { addItem, openCart } = useCartStore()
  const maxOrderQuantity = Math.min(10, Math.max(product.stock, 0))
  const isOutOfStock = product.stock <= 0

  // Check if product is in wishlist
  useEffect(() => {
    const inWishlist = wishlistItems.some(
      (item) => item._id.toString() === product._id.toString()
    )
    setIsInWishlist(inWishlist)
  }, [wishlistItems, product._id])

  useEffect(() => {
    if (maxOrderQuantity <= 0) {
      setQuantity(1)
      return
    }

    setQuantity((current) => Math.min(Math.max(1, current), maxOrderQuantity))
  }, [maxOrderQuantity])

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add items to cart',
        variant: 'destructive',
      })
      return
    }

    if (isOutOfStock) {
      toast({
        title: 'Out of stock',
        description: 'This product is currently unavailable.',
        variant: 'destructive',
      })
      return
    }

    if (quantity > maxOrderQuantity) {
      toast({
        title: 'Error',
        description: `You can add up to ${maxOrderQuantity} item${maxOrderQuantity === 1 ? '' : 's'} for this product.`,
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
      quantity,
    })

    toast({
      title: 'Added to Cart',
      description: `${product.name} added to your cart`,
    })

    openCart()
    setQuantity(1)
  }

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to proceed with purchase',
        variant: 'destructive',
      })
      return
    }

    if (isOutOfStock) {
      toast({
        title: 'Out of stock',
        description: 'This product is currently unavailable.',
        variant: 'destructive',
      })
      return
    }

    if (quantity > maxOrderQuantity) {
      toast({
        title: 'Error',
        description: `You can purchase up to ${maxOrderQuantity} item${maxOrderQuantity === 1 ? '' : 's'} for this product.`,
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
      quantity,
    })

    // Redirect to checkout
    window.location.href = '/checkout'
  }

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add items to your wishlist',
        variant: 'destructive',
      })
      // Could redirect to sign in
      return
    }

    setIsToggling(true)
    try {
      const result = await dispatch(toggleWishlistItem(product._id.toString())).unwrap()
      setIsInWishlist(result.isInWishlist)
      toast({
        title: result.isInWishlist ? 'Added to Wishlist' : 'Removed from Wishlist',
        description: result.message,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update wishlist',
        variant: 'destructive',
      })
    } finally {
      setIsToggling(false)
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/products/${product.slug}`
    try {
      await navigator.clipboard.writeText(url)
      toast({
        title: 'Link Copied',
        description: 'Product link copied to clipboard',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      })
    }
  }

  const handleWhatsAppShare = () => {
    const url = `${window.location.origin}/products/${product.slug}`
    const text = `Check out ${product.name} at E-Shop!${product.discountedPrice ? ` Now at ${formatCurrency(product.discountedPrice)}` : ''}`
    const encodedText = encodeURIComponent(text)
    const encodedUrl = encodeURIComponent(url)
    const whatsappUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  // Get auth status from Redux
  // isAuthenticated is already defined above (line 32 in original)
  // Removed duplicate declaration on line 162

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="font-medium">Quantity</label>
        <div className="flex items-center gap-4">
          <div className="flex items-center border rounded-md">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3 py-2 hover:bg-muted transition-colors"
              disabled={quantity <= 1 || isOutOfStock}
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="number"
              min="1"
              max={Math.max(1, maxOrderQuantity)}
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1
                setQuantity(Math.min(Math.max(1, val), Math.max(1, maxOrderQuantity)))
              }}
              disabled={isOutOfStock}
              className="w-16 text-center border-x py-2 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(maxOrderQuantity, q + 1))}
              className="px-3 py-2 hover:bg-muted transition-colors"
              disabled={isOutOfStock || quantity >= maxOrderQuantity}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <span className="text-sm text-muted-foreground">
            {isOutOfStock
              ? 'Currently out of stock'
              : `Max ${maxOrderQuantity} per order`}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          size="lg"
          className="min-w-0 flex-1 gap-2 sm:min-w-[180px]"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
        >
          <ShoppingCart className="h-5 w-5" />
          Add to Cart
        </Button>
        <Button size="lg" variant="outline" onClick={handleBuyNow} disabled={isOutOfStock}>
          Buy Now
        </Button>
        <Button
          size="icon"
          variant={isInWishlist ? "default" : "outline"}
          onClick={handleToggleWishlist}
          disabled={isToggling || wishlistLoading}
          title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          {isToggling ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-current' : ''}`} />
          )}
        </Button>
        <Button size="icon" variant="outline" onClick={handleShare} title="Copy Link">
          <Share2 className="h-5 w-5" />
        </Button>
        <Button size="icon" variant="outline" onClick={handleWhatsAppShare} title="Share on WhatsApp">
          <MessageCircle className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
