// src/store/cartStore.ts
'use client'

import { useSelector } from 'react-redux'
import { useCallback } from 'react'
import type { CartItem } from '@/types'
import { useAppDispatch } from '@/hooks/useRedux'
import {
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
  setUserId,
  toggleCart,
  openCart,
  closeCart,
  setCartOpen,
  hydrateCart,
  syncCart,
  setCoupon,
  clearCoupon,
  selectCartItems,
  selectCartIsOpen,
  selectCartUserId,
  selectCartCouponCode,
  selectCartCouponDiscount,
} from './slices/cartSlice'

// This hook provides a Zustand-like interface but uses Redux internally
// This maintains compatibility with existing components while using Redux Toolkit
export function useCartStore() {
  const dispatch = useAppDispatch()
  const items = useSelector(selectCartItems)
  const isOpen = useSelector(selectCartIsOpen)
  const userId = useSelector(selectCartUserId)
  const couponCode = useSelector(selectCartCouponCode)
  const couponDiscount = useSelector(selectCartCouponDiscount)

  const getSubtotal = useCallback(() => {
    return items.reduce((total, item) => {
      const price = item.discountedPrice || item.price
      return total + price * item.quantity
    }, 0)
  }, [items])

  const getItemCount = useCallback(() => {
    return items.reduce((count, item) => count + item.quantity, 0)
  }, [items])

  return {
    items,
    isOpen,
    userId,
    couponCode,
    couponDiscount,
    addItem: (item: CartItem) => dispatch(addItem(item)),
    removeItem: (productId: string) => dispatch(removeItem(productId)),
    updateQuantity: (productId: string, quantity: number) =>
      dispatch(updateQuantity({ productId, quantity })),
    clearCart: () => dispatch(clearCart()),
    setUserId: (userId?: string) => dispatch(setUserId(userId)),
    syncCart: () => dispatch(syncCart()),
    toggleCart: () => dispatch(toggleCart()),
    openCart: () => dispatch(openCart()),
    closeCart: () => dispatch(closeCart()),
    setCartOpen: (isOpen: boolean) => dispatch(setCartOpen(isOpen)),
    hydrateCart: (cartItems: CartItem[]) => dispatch(hydrateCart(cartItems)),
    setCoupon: (code?: string, discount?: number) =>
      dispatch(setCoupon({ code, discount })),
    removeCoupon: () => dispatch(clearCoupon()),
    // Keep clearCoupon for backward compatibility
    clearCoupon: () => dispatch(clearCoupon()),
    getSubtotal,
    getItemCount,
  }
}
