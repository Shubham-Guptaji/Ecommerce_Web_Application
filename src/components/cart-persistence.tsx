'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'
import {
  hydrateCart,
  selectCartItems,
  selectCartUserId,
  selectCartCoupon,
  setCoupon,
  clearCoupon,
} from '@/store/slices/cartSlice'
import { syncCart } from '@/store/slices/cartSlice'
import { useDebounce } from '@/hooks/useDebounce'
import { useAppDispatch } from '@/hooks/useRedux'

const CART_STORAGE_KEY = 'cart-storage'

export function CartPersistence() {
  const dispatch = useAppDispatch()
  const items = useSelector(selectCartItems)
  const userId = useSelector(selectCartUserId)
  const coupon = useSelector(selectCartCoupon)
  const initialized = useRef(false)

  // Debounce a stable serialized key, not a fresh object literal.
  const cartSyncKey = useMemo(() => JSON.stringify({ items, coupon }), [items, coupon])
  const debouncedCartSyncKey = useDebounce(cartSyncKey, 1000)

  // On mount, hydrate from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined' && !initialized.current) {
      const saved = localStorage.getItem(CART_STORAGE_KEY)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          // The Zustand persist stored as { state: { cart: { items: [...] } } }
          // Adjust based on actual format if needed
          const savedItems = parsed?.state?.cart?.items || parsed?.items
          const savedCoupon = parsed?.state?.cart?.coupon || parsed?.coupon
          if (savedItems && Array.isArray(savedItems)) {
            dispatch(hydrateCart(savedItems))
          }
          if (savedCoupon?.code && savedCoupon?.discount !== undefined) {
            dispatch(setCoupon(savedCoupon))
          } else {
            dispatch(clearCoupon())
          }
        } catch (error) {
          console.error('Failed to parse saved cart:', error)
        }
      }
      initialized.current = true
    }
  }, [dispatch])

  // Save to localStorage whenever items change
  useEffect(() => {
    if (initialized.current && typeof window !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items, coupon }))
    }
  }, [items, coupon])

  // Sync to server when user is authenticated and debounced cart state changes
  useEffect(() => {
    if (initialized.current && userId) {
      dispatch(syncCart())
    }
  }, [userId, debouncedCartSyncKey, dispatch])

  return null
}
