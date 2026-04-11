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

  // Check if product is in wishlist
  useEffect(() => {
    const inWishlist = wishlistItems.some(
      (item) => item._id.toString() === product._id.toString()
    )
    setIsInWishlist(inWishlist)
  }, [wishlistItems, product._id])

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add items to cart',
        variant: 'destructive',
      })
      return
    }

    if (product.stock < quantity) {
      toast({
        title: 'Error',
        description: `Only ${product.stock} items available in stock`,
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

    if (product.stock < quantity) {
      toast({
        title: 'Error',
        description: `Only ${product.stock} items available in stock`,
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
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="number"
              min="1"
              max={product.stock}
              value={quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1
                setQuantity(Math.min(product.stock, Math.max(1, val)))
              }}
              className="w-16 text-center border-x py-2 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
              className="px-3 py-2 hover:bg-muted transition-colors"
              disabled={quantity >= product.stock}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <span className="text-sm text-muted-foreground">
            Max {product.stock} per order
          </span>
        </div>
      </div>

      <div className="flex gap-4">
        <Button size="lg" className="flex-1 gap-2" onClick={handleAddToCart}>
          <ShoppingCart className="h-5 w-5" />
          Add to Cart
        </Button>
        <Button size="lg" variant="outline" onClick={handleBuyNow}>
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
