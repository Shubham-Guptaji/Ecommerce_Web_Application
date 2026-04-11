// src/app/(auth)/reset-password/[token]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormField, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { toast } from '@/hooks/use-toast'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import axiosInstance from '@/lib/axios'

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const token = params.token

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const passwordValue = form.watch('password')

  const getPasswordStrength = (password: string): number => {
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  }

  const strength = getPasswordStrength(passwordValue)

  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500']
  const strengthLabel = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][strength]

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsTokenValid(false)
        setTokenError('No reset token provided')
        return
      }

      try {
        // We'll just try to submit - if token is invalid, server will reject
        setIsTokenValid(true)
      } catch (error) {
        setIsTokenValid(false)
        setTokenError('Invalid or expired reset token')
      }
    }

    validateToken()
  }, [token])

  const onSubmit = async (data: ResetPasswordForm) => {
    setIsLoading(true)

    try {
      await axiosInstance.post('/api/auth/reset-password', {
        token: token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      })

      toast({
        title: 'Success',
        description: 'Password has been reset successfully. You can now log in.',
      })
      form.reset()
      router.push('/sign-in')
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to reset password'
      if (message.includes('Invalid or expired')) {
        setIsTokenValid(false)
        setTokenError(message)
      } else {
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isTokenValid === null) {
    return (
      <div className="text-center">
        <div className="mb-4">
          <svg className="animate-spin mx-auto h-12 w-12 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Validating token...</h2>
      </div>
    )
  }

  if (!isTokenValid) {
    return (
      <div className="text-center">
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Invalid or Expired Token</h2>
        <p className="text-muted-foreground mb-6">
          {tokenError || 'This password reset link is invalid or has expired. Please request a new one.'}
        </p>
        <Button asChild className="w-full">
          <Link href="/forgot-password">Request new link</Link>
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold">Reset password</h2>
        <p className="mt-2 text-muted-foreground">
          Enter your new password below.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <div className="space-y-2">
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      {...field}
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </FormControl>
                {field.value && (
                  <>
                    <div className="flex gap-1 mt-2">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-2 flex-1 rounded-full transition-colors ${
                            i < strength ? strengthColors[strength - 1] : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Strength: {strengthLabel}
                    </p>
                  </>
                )}
                <FormMessage />
              </div>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <div className="space-y-2">
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      {...field}
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </div>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && (
              <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isLoading ? 'Resetting...' : 'Reset password'}
          </Button>
        </form>
      </Form>

      <p className="mt-4 text-center">
        <Link href="/sign-in" className="text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
