// src/hooks/useCart.ts
'use client'

import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import {
  addItem as addItemAction,
  removeItem as removeItemAction,
  updateQuantity as updateQuantityAction,
  clearCart as clearCartAction,
  openCart as openCartAction,
  closeCart as closeCartAction,
  toggleCart as toggleCartAction,
  hydrateCart as hydrateCartAction,
  syncCart as syncCartAction,
  applyCoupon as applyCouponAction,
  removeCoupon as removeCouponAction,
} from '@/store/slices/cartSlice'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import type { RootState } from '@/store'
import type { CartItem } from '@/types'

export function useCart() {
  const dispatch = useAppDispatch()
  const { items, isOpen, userId, coupon } = useAppSelector((state: RootState) => state.cart)

  const addItem = useCallback(
    (item: CartItem) => {
      dispatch(addItemAction(item))
    },
    [dispatch]
  )

  const removeItem = useCallback(
    (productId: string) => {
      dispatch(removeItemAction(productId))
    },
    [dispatch]
  )

  const updateQty = useCallback(
    (productId: string, quantity: number) => {
      dispatch(updateQuantityAction({ productId, quantity }))
    },
    [dispatch]
  )

  const clearCart = useCallback(() => {
    dispatch(clearCartAction())
  }, [dispatch])

  const applyCoupon = useCallback(
    (code: string, discount: number) => {
      dispatch(applyCouponAction({ code, discount }))
    },
    [dispatch]
  )

  const removeCoupon = useCallback(() => {
    dispatch(removeCouponAction())
  }, [dispatch])

  const open = useCallback(() => {
    dispatch(openCartAction())
  }, [dispatch])

  const close = useCallback(() => {
    dispatch(closeCartAction())
  }, [dispatch])

  const toggle = useCallback(() => {
    dispatch(toggleCartAction())
  }, [dispatch])

  const sync = useCallback(async () => {
    const result = await dispatch(syncCartAction())
    return result
  }, [dispatch])

  const hydrate = useCallback(
    (cartItems: CartItem[]) => {
      dispatch(hydrateCartAction(cartItems))
    },
    [dispatch]
  )

  const subtotal = items.reduce((total, item) => {
    const price = item.discountedPrice || item.price
    return total + price * item.quantity
  }, 0)

  const count = items.reduce((count, item) => count + item.quantity, 0)

  const total = coupon ? subtotal - coupon.discount : subtotal

  return {
    items,
    isOpen,
    userId,
    subtotal,
    count,
    total,
    coupon,
    addItem,
    removeItem,
    updateQty,
    clearCart,
    applyCoupon,
    removeCoupon,
    open,
    close,
    toggle,
    openCart: open,
    closeCart: close,
    toggleCart: toggle,
    sync,
    hydrate,
  }
}
