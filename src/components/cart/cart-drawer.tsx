'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/hooks/useCart'
import {
  CartDrawer as CartDrawerRoot,
  CartDrawerContent,
  CartDrawerHeader,
  CartDrawerFooter,
  CartDrawerTitle,
  CartDrawerClose,
} from '@/components/ui/cart-drawer-primitive'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils'
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    updateQty,
    removeItem,
    subtotal,
    count,
  } = useCart()

  return (
    <CartDrawerRoot open={isOpen} onOpenChange={closeCart}>
      <CartDrawerContent className="bg-background">
        <CartDrawerHeader>
          <CartDrawerTitle>
            Shopping Cart ({items.length})
          </CartDrawerTitle>
          <CartDrawerClose />
        </CartDrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Your cart is empty</p>
              <Button asChild onClick={closeCart}>
                <Link href="/products">Start Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.product.toString()}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  <div className="relative h-16 w-16 shrink-0 rounded-md overflow-hidden bg-muted">
                    {item.image && item.image !== '/placeholder.jpg' ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.product}`}
                      onClick={closeCart}
                      className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors"
                    >
                      {item.name}
                    </Link>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-semibold text-sm">
                        {formatCurrency(item.discountedPrice || item.price)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            updateQty(item.product.toString(), item.quantity - 1)
                          }
                          className="h-6 w-6 flex items-center justify-center border rounded hover:bg-muted"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQty(item.product.toString(), item.quantity + 1)
                          }
                          className="h-6 w-6 flex items-center justify-center border rounded hover:bg-muted"
                          disabled={item.quantity >= 99}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.product.toString())}
                    className="h-8 w-8 text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <CartDrawerFooter className="border-t pt-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
            </div>

            <div className="grid gap-2">
              <Button asChild className="w-full" onClick={closeCart}>
                <Link href="/cart">View Cart</Link>
              </Button>
              <Button asChild variant="secondary" className="w-full" onClick={closeCart}>
                <Link href="/checkout">Checkout</Link>
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Taxes and shipping calculated at checkout
            </p>
          </CartDrawerFooter>
        )}
      </CartDrawerContent>
    </CartDrawerRoot>
  )
}
