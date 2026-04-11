// src/hooks/useWishlist.ts
'use client'

import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { toggleWishlistItem, fetchWishlist, clearWishlist } from '@/store/slices/wishlistSlice'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import type { RootState } from '@/store'

export function useWishlist() {
  const dispatch = useAppDispatch()
  const { items, loading, error } = useAppSelector((state: RootState) => state.wishlist)

  const toggleWishlist = useCallback(
    async (productId: string) => {
      const result = await dispatch(toggleWishlistItem(productId))
      return result
    },
    [dispatch]
  )

  const loadWishlist = useCallback(async () => {
    const result = await dispatch(fetchWishlist())
    return result
  }, [dispatch])

  const removeItem = useCallback(
    async (productId: string) => {
      const result = await dispatch(toggleWishlistItem(productId))
      return result
    },
    [dispatch]
  )

  const clearWishlistLocal = useCallback(() => {
    dispatch(clearWishlist())
  }, [dispatch])

  const isInWishlist = (productId: string) => {
    return items.some((p) => p._id.toString() === productId)
  }

  return {
    items,
    loading,
    error,
    toggleWishlist,
    loadWishlist,
    isInWishlist,
    removeItem,
    clearWishlist: clearWishlistLocal,
  }
}
