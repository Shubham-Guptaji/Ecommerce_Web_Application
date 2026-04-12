'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/shared/skeleton'
import { Separator } from '@/components/ui/separator'
import { useCartStore } from '@/store/cartStore'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, X } from 'lucide-react'
import { CartDrawer } from '@/components/cart/cart-drawer'

export default function CartPage() {
  const {
    items,
    updateQuantity,
    removeItem,
    getSubtotal,
    clearCart,
    couponCode,
    couponDiscount,
    setCoupon,
    removeCoupon,
  } = useCartStore()
  const [couponInput, setCouponInput] = useState('')
  const [applyingCoupon, setApplyingCoupon] = useState(false)

  const subtotal = getSubtotal()
  const deliveryCharge = subtotal >= 499 ? 0 : 49
  const taxableSubtotal = Math.max(0, subtotal - (couponDiscount || 0))
  const tax = taxableSubtotal * 0.18
  const total = taxableSubtotal + deliveryCharge + tax

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(productId)
    } else {
      updateQuantity(productId, newQuantity)
    }
  }

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return

    setApplyingCoupon(true)

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponInput,
          orderTotal: subtotal,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          title: 'Invalid Coupon',
          description: result.message,
          variant: 'destructive',
        })
      } else {
        setCoupon(couponInput, result.data.discountAmount)
        toast({
          title: 'Coupon Applied!',
          description: `You saved ₹${result.data.discountAmount}`,
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to validate coupon',
        variant: 'destructive',
      })
    } finally {
      setApplyingCoupon(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
          <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">
            Looks like you haven&apos;t added anything to your cart yet.
          </p>
          <Button asChild size="lg">
            <Link href="/products">
              Continue Shopping <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.product.toString()}
              className="flex items-center gap-4 p-4 border rounded-lg"
            >
              <Link href={`/products/${item.product}`} className="shrink-0">
                <div className="relative h-24 w-24 bg-muted rounded-md overflow-hidden">
                  {item.image && item.image !== '/placeholder.jpg' ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </Link>

              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.product}`}>
                  <h3 className="font-semibold text-lg mb-1 hover:text-primary transition-colors">
                    {item.name}
                  </h3>
                </Link>

                <div className="flex items-center gap-2 mb-2">
                  {item.discountedPrice ? (
                    <>
                      <span className="font-bold text-red-600">
                        {formatCurrency(item.discountedPrice)}
                      </span>
                      <span className="text-sm text-muted-foreground line-through">
                        {formatCurrency(item.price)}
                      </span>
                    </>
                  ) : (
                    <span className="font-bold">{formatCurrency(item.price)}</span>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center border rounded-md">
                    <button
                      onClick={() => handleQuantityChange(item.product.toString(), item.quantity - 1)}
                      className="px-3 py-1 hover:bg-muted transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-4 py-1 text-center min-w-[3rem]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item.product.toString(), item.quantity + 1)}
                      className="px-3 py-1 hover:bg-muted transition-colors"
                      disabled={item.quantity >= 99}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.product.toString())}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold text-lg">
                  {formatCurrency((item.discountedPrice || item.price) * item.quantity)}
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-between">
            <Button variant="outline" onClick={clearCart}>
              Clear Cart
            </Button>
            <Button variant="link" asChild>
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="border rounded-lg p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              {couponCode && couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>
                    Discount ({couponCode})
                    <Button variant="ghost" size="icon" onClick={removeCoupon} className="h-4 w-4 ml-1 p-0">
                      <X className="h-3 w-3" />
                    </Button>
                  </span>
                  <span>-{formatCurrency(couponDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Delivery</span>
                <span>
                  {deliveryCharge === 0 ? (
                    <span className="text-green-600">FREE</span>
                  ) : (
                    formatCurrency(deliveryCharge)
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span>GST (18%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Coupon Code */}
            <div className="mt-6 space-y-3">
              <label className="font-medium">Have a coupon?</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                />
                <Button
                  variant="outline"
                  onClick={handleApplyCoupon}
                  disabled={applyingCoupon || !couponInput}
                >
                  {applyingCoupon ? 'Applying...' : 'Apply'}
                </Button>
              </div>
              {couponCode && (
                <p className="text-sm text-green-600">
                  Coupon applied: {couponCode}
                </p>
              )}
            </div>

            <Button size="lg" className="w-full mt-6" asChild>
              <Link href="/checkout">
                Proceed to Checkout <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-4">
              Free shipping on orders above ₹499
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
