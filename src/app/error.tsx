'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-md mx-auto">
        <h1 className="text-6xl font-bold mb-4">Oops!</h1>
        <h2 className="text-2xl font-semibold mb-4 text-red-600">
          Something went wrong
        </h2>
        <p className="text-muted-foreground mb-8">
          We apologize for the inconvenience. An unexpected error occurred while processing your request.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={reset} variant="default">
            Try Again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-muted rounded-lg text-left">
            <p className="font-mono text-sm text-red-600">
              {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
