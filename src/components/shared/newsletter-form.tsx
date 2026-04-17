// src/components/shared/newsletter-form.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { axiosInstance } from '@/lib/axios'

export function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your email address',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)

    try {
      const response = await axiosInstance.post('/api/newsletter/subscribe', {
        email: email.trim(),
      })

      if (response.data.success) {
        const emailStatus = response.data.emailSent
          ? 'Check your inbox (and spam folder) for confirmation!'
          : 'Subscription successful!'
        const successMsg = response.data.message || 'Successfully subscribed to newsletter!'
        toast({
          title: 'Subscribed!',
          description: `${successMsg} ${emailStatus}`,
        })
        setMessage({ type: 'success', text: `${successMsg} ${emailStatus}` })
        setEmail('')
        // Clear inline message after 7 seconds
        setTimeout(() => setMessage(null), 7000)
      } else {
        const errorMsg = response.data.message || 'Failed to subscribe'
        toast({
          title: 'Error',
          description: errorMsg,
          variant: 'destructive',
        })
        setMessage({ type: 'error', text: errorMsg })
        // Clear inline error after 5 seconds
        setTimeout(() => setMessage(null), 5000)
      }
    } catch (error: any) {
      let errorMessage = 'Failed to subscribe. Please try again.'
      if (error.response) {
        // Handle specific status codes
        if (error.response.status === 409) {
          errorMessage = 'This email is already subscribed to our newsletter.'
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message
        }
      } else if (error.request) {
        // No response received
        errorMessage = 'Cannot connect to server. Please check your internet connection.'
      }
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
      setMessage({ type: 'error', text: errorMessage })
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          required
          className="flex-1"
        />
        <Button variant="secondary" size="lg" type="submit" disabled={submitting}>
          {submitting ? 'Subscribing...' : 'Subscribe'}
        </Button>
      </form>
      {message && (
        <div
          className={`mt-3 p-3 rounded-md text-center text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  )
}
