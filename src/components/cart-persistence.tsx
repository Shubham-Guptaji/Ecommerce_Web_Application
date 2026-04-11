'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { hydrateCart, selectCartItems, selectCartUserId } from '@/store/slices/cartSlice'
import { syncCart } from '@/store/slices/cartSlice'
import { useDebounce } from '@/hooks/useDebounce'
import { useAppDispatch } from '@/hooks/useRedux'

const CART_STORAGE_KEY = 'cart-storage'

export function CartPersistence() {
  const dispatch = useAppDispatch()
  const items = useSelector(selectCartItems)
  const userId = useSelector(selectCartUserId)
  const initialized = useRef(false)

  // Debounced items for syncing
  const debouncedItems = useDebounce(items, 1000) // 1 second debounce

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
          if (savedItems && Array.isArray(savedItems)) {
            dispatch(hydrateCart(savedItems))
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
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items }))
    }
  }, [items])

  // Sync to server when user is authenticated and debounced items change
  useEffect(() => {
    if (initialized.current && userId && debouncedItems.length > 0) {
      dispatch(syncCart())
    }
  }, [userId, debouncedItems, dispatch])

  return null
}
