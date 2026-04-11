// src/components/providers/SessionSync.tsx
'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useDispatch } from 'react-redux'
import { setUser, clearAuth } from '@/store/slices/authSlice'
import { useAppDispatch } from '@/hooks/useRedux'

export function SessionSync() {
  const { data: session, status } = useSession()
  const dispatch = useAppDispatch()
  const lastSessionId = useRef<string | null>(null)

  useEffect(() => {
    // Only dispatch if session user actually changed
    const sessionUserId = session?.user?.id
    if (status === 'authenticated' && sessionUserId && sessionUserId !== lastSessionId.current) {
      lastSessionId.current = sessionUserId
      const user = {
        id: sessionUserId,
        name: session.user.name ?? undefined,
        email: session.user.email ?? undefined,
        role: session.user.role,
        isEmailVerified: session.user.isEmailVerified ?? false,
        avatar: session.user.image ?? undefined,
      }
      dispatch(setUser(user))
    } else if (status === 'unauthenticated' && lastSessionId.current !== null) {
      lastSessionId.current = null
      dispatch(clearAuth())
    }
  }, [status, session, dispatch])

  return null
}
