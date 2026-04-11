// src/app/(auth)/forgot-password/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormField, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { toast } from '@/hooks/use-toast'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import axiosInstance from '@/lib/axios'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [rateLimitExpiry, setRateLimitExpiry] = useState<Date | null>(null)

  useEffect(() => {
    // Check rate limit on mount
    const attempts = JSON.parse(localStorage.getItem('forgotPasswordAttempts') || '[]')
    const now = new Date()
    const recentAttempts = attempts.filter((time: string) => new Date(time) > new Date(now.getTime() - 60 * 60 * 1000))

    if (recentAttempts.length >= 3) {
      const oldestAttempt = new Date(Math.min(...recentAttempts.map((t: string) => new Date(t).getTime())))
      const expiry = new Date(oldestAttempt.getTime() + 60 * 60 * 1000)
      setRateLimitExpiry(expiry)
    }
  }, [])

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ForgotPasswordForm) => {
    if (rateLimitExpiry && new Date() < rateLimitExpiry) {
      toast({
        title: 'Rate limited',
        description: `Too many attempts. Please try again in ${Math.ceil((rateLimitExpiry.getTime() - new Date().getTime()) / 60000)} minutes.`,
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      await axiosInstance.post('/api/auth/forgot-password', {
        email: data.email,
      })

      // Record attempt
      const attempts = JSON.parse(localStorage.getItem('forgotPasswordAttempts') || '[]')
      attempts.push(new Date().toISOString())
      localStorage.setItem('forgotPasswordAttempts', JSON.stringify(attempts))

      toast({
        title: 'Success',
        description: 'If that email exists, we have sent a reset link.',
      })
      setSubmitted(true)
      form.reset()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to process request',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getRemainingTime = () => {
    if (!rateLimitExpiry) return 0
    const now = new Date()
    if (now >= rateLimitExpiry) return 0
    return Math.ceil((rateLimitExpiry.getTime() - now.getTime()) / 60000)
  }

  const [remainingTime, setRemainingTime] = useState(getRemainingTime())

  useEffect(() => {
    if (remainingTime <= 0) return
    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          setRateLimitExpiry(null)
          return 0
        }
        return prev - 1
      })
    }, 60000)
    return () => clearInterval(timer)
  }, [remainingTime])

  if (submitted) {
    return (
      <div className="text-center">
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Check your email</h2>
        <p className="text-muted-foreground mb-6">
          We&apos;ve sent a password reset link to your email address.
        </p>
        <Button
          onClick={() => setSubmitted(false)}
          variant="outline"
          className="w-full"
          disabled={remainingTime > 0}
        >
          {remainingTime > 0 ? `Try again in ${remainingTime}m` : 'Try another email'}
        </Button>
        <p className="mt-4">
          <Link href="/sign-in" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold">Forgot password?</h2>
        <p className="mt-2 text-muted-foreground">
          Enter your email address and we&apos;ll send you a reset link.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <div className="space-y-2">
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </div>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading || remainingTime > 0}>
            {isLoading && (
              <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isLoading ? 'Sending...' : 'Send reset link'}
          </Button>
        </form>
      </Form>

      {remainingTime > 0 && (
        <p className="text-sm text-center text-muted-foreground mt-2">
          Please wait {remainingTime} minutes before trying again.
        </p>
      )}

      <p className="mt-4 text-center">
        <Link href="/sign-in" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
