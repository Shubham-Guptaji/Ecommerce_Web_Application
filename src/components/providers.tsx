// src/components/providers.tsx
'use client'

import { useMemo } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { Provider } from 'react-redux'
import { store } from '@/store'
import { Toaster } from '@/components/ui/toaster'
import { SessionUserSync } from '@/components/session-user-sync'
import { SessionSync } from '@/components/providers/SessionSync'
import { CartPersistence } from '@/components/cart-persistence'

// Optimize session fetching to reduce API calls
const SESSION_OPTIONS = {
  refetchInterval: 0, // Disable automatic polling
  refetchOnWindowFocus: false, // Don't refetch when window regains focus
  refetchOnReconnect: false, // Don't refetch on network reconnect
}

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: false,
          },
        },
      }),
    []
  )

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <SessionProvider session={undefined} {...SESSION_OPTIONS}>
          <SessionUserSync />
          <SessionSync />
          <CartPersistence />
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </Provider>
    </QueryClientProvider>
  )
}
