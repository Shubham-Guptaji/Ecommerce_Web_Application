'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useCartStore } from '@/store/cartStore'
import { fetchCart } from '@/store/slices/cartSlice'
import { useAppDispatch } from '@/hooks/useRedux'

export function SessionUserSync() {
  const { data: session, status } = useSession()
  const dispatch = useAppDispatch()
  const { setUserId, items } = useCartStore()
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      const currentUserId = session.user.id
      setUserId(currentUserId)

      // Only fetch cart if we haven't already and cart is empty
      // This prevents multiple fetches on component remounts
      if (!hasFetchedRef.current && items.length === 0) {
        hasFetchedRef.current = true
        dispatch(fetchCart())
      }
    } else if (status === 'unauthenticated') {
      setUserId(undefined)
      hasFetchedRef.current = false
    }
  }, [status, session, dispatch, setUserId, items.length])

  return null
}
