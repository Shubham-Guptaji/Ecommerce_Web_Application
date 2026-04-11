// src/app/(auth)/verify-email/[token]/page.tsx
'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormField, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { toast } from '@/hooks/use-toast'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import axiosInstance from '@/lib/axios'
import { Mail, RefreshCw } from 'lucide-react'

const resendSchema = z.object({
  email: z.string().email('Invalid email address'),
})

type ResendForm = z.infer<typeof resendSchema>

export default function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'resend'>('verifying')
  const [message, setMessage] = useState('')
  const [showResend, setShowResend] = useState(false)
  const [isResending, setIsResending] = useState(false)

  const { token } = use(params)

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axiosInstance.get('/api/auth/verify-email', {
          params: { token },
        })

        if (response.data.success) {
          setStatus('success')
          setMessage(response.data.message || 'Your email has been verified successfully!')
        } else {
          setStatus('error')
          setMessage(response.data.message || 'Invalid or expired verification link.')
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'An error occurred during verification.'
        setStatus('error')
        setMessage(errorMessage)
      }
    }

    if (token) {
      verifyEmail()
    }
  }, [token])

  const resendForm = useForm<ResendForm>({
    resolver: zodResolver(resendSchema),
    defaultValues: {
      email: '',
    },
  })

  const onResend = async (data: ResendForm) => {
    setIsResending(true)
    try {
      const response = await axiosInstance.post('/api/auth/resend-verification', {
        email: data.email,
      })

      if (response.data.success) {
        toast({
          title: 'Success',
          description: response.data.message,
        })
        setShowResend(false)
      } else {
        toast({
          title: 'Error',
          description: response.data.message,
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to resend verification',
        variant: 'destructive',
      })
    } finally {
      setIsResending(false)
    }
  }

  if (status === 'verifying') {
    return (
      <div className="text-center">
        <div className="mb-4">
          <svg className="animate-spin mx-auto h-12 w-12 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Verifying your email...</h2>
        <p className="text-muted-foreground">Please wait while we confirm your email address.</p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="text-center">
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Email Verified!</h2>
        <p className="text-muted-foreground mb-6">{message}</p>
        <div className="space-y-3">
          <Button onClick={() => router.push('/sign-in')} className="w-full">
            Continue to Sign In
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="text-center">
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Verification Failed</h2>
        <p className="text-muted-foreground mb-6">{message}</p>

        <div className="space-y-3">
          <Button onClick={() => setShowResend(true)} variant="outline" className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Resend Verification Email
          </Button>
          <Button asChild className="w-full">
            <Link href="/sign-in">Back to Sign In</Link>
          </Button>
        </div>

        {showResend && (
          <div className="mt-6 text-left border-t pt-4">
            <h3 className="font-semibold mb-3">Enter your email to resend verification</h3>
            <Form {...resendForm}>
              <form onSubmit={resendForm.handleSubmit(onResend)} className="space-y-4">
                <FormField
                  control={resendForm.control}
                  name="email"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </div>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isResending}>
                  {isResending && (
                    <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <Mail className="mr-2 h-4 w-4" />
                  Send Verification Email
                </Button>
              </form>
            </Form>
          </div>
        )}
      </div>
    )
  }

  return null
}
