// src/components/layout/footer.tsx
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useState } from 'react'
import axiosInstance from '@/lib/axios'

export function Footer() {
  const [email, setEmail] = useState('')
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter your email address' })
      return
    }

    console.log('Footer newsletter: Submitting', email.trim())
    setIsSubscribing(true)
    setMessage(null)
    try {
      const response = await axiosInstance.post('/api/newsletter/subscribe', { email: email.trim() })
      const emailStatus = response.data.emailSent
        ? 'Check your inbox (and spam folder) for confirmation!'
        : ''
      const successMsg = response.data.message || 'You have been successfully subscribed to our newsletter.'
      toast({
        title: 'Subscribed!',
        description: `${successMsg} ${emailStatus}`,
      })
      setMessage({ type: 'success', text: `${successMsg} ${emailStatus}` })
      setEmail('')
      setTimeout(() => setMessage(null), 7000)
    } catch (error: any) {
      console.error('Footer newsletter error:', error)
      let errorMsg = 'Failed to subscribe. Please try again.'
      if (error.response?.status === 409) {
        errorMsg = 'This email is already subscribed to our newsletter.'
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message
      }
      toast({
        title: error.response?.status === 409 ? 'Already subscribed' : 'Error',
        description: errorMsg,
        variant: 'destructive',
      })
      setMessage({ type: 'error', text: errorMsg })
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setIsSubscribing(false)
    }
  }

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">E-Shop</h3>
            <p className="text-muted-foreground mb-4">
              Your one-stop destination for quality products at the best prices. Shop with confidence.
            </p>
            <div className="flex gap-4">
              <Button variant="ghost" size="icon" asChild>
                <a href="#" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                  <Facebook className="h-5 w-5" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a href="#" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                  <Instagram className="h-5 w-5" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a href="#" aria-label="Twitter" target="_blank" rel="noopener noreferrer">
                  <Twitter className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-base font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-muted-foreground hover:text-foreground transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-muted-foreground hover:text-foreground transition-colors">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-base font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/orders" className="text-muted-foreground hover:text-foreground transition-colors">
                  My Orders
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-muted-foreground hover:text-foreground transition-colors">
                  Returns
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/track-order" className="text-muted-foreground hover:text-foreground transition-colors">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-base font-semibold mb-4">Newsletter</h4>
            <p className="text-muted-foreground mb-4">
              Subscribe to get updates on new arrivals and special offers.
            </p>
            <div>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <Input
                  placeholder="Enter your email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubscribing}
                />
                <Button type="submit" disabled={isSubscribing}>
                  {isSubscribing && (
                    <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  Subscribe
                </Button>
              </form>
              {message && (
                <div
                  className={`mt-3 p-3 rounded-md text-sm ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  }`}
                >
                  {message.text}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} E-Shop. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
