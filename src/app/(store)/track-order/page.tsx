// src/app/(store)/track-order/page.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Truck, CheckCircle, Clock, MapPin } from 'lucide-react'
import Link from 'next/link'
import type { OrderStatus } from '@/types'

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface TrackingStep {
  status: OrderStatus
  label: string
  description: string
  icon: React.ReactNode
}

const trackingSteps: TrackingStep[] = [
  {
    status: 'processing',
    label: 'Order Processing',
    description: 'Your order has been received and is being processed.',
    icon: <Package className="h-5 w-5" />
  },
  {
    status: 'shipped',
    label: 'Shipped',
    description: 'Your order has been shipped from our warehouse.',
    icon: <Truck className="h-5 w-5" />
  },
  {
    status: 'out_for_delivery',
    label: 'Out for Delivery',
    description: 'Your package is out for delivery today.',
    icon: <MapPin className="h-5 w-5" />
  },
  {
    status: 'delivered',
    label: 'Delivered',
    description: 'Your package has been delivered.',
    icon: <CheckCircle className="h-5 w-5" />
  },
]

interface TrackingData {
  orderNumber: string
  status: OrderStatus
  expectedDelivery: string
  courierName: string
  trackingNumber: string
  statusHistory: Array<{
    status: string
    timestamp: string
    note?: string
  }>
  user: { name: string; email: string }
  items: Array<{
    name: string
    image?: string
    price: number
    discountedPrice?: number
    quantity: number
    subtotal: number
  }>
  shippingAddress: {
    fullName: string
    phone: string
    line1: string
    line2?: string
    city: string
    state: string
    pincode: string
    country: string
  }
  pricing: {
    subtotal: number
    discount: number
    couponDiscount?: number
    deliveryCharge: number
    tax: number
    total: number
  }
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [isTracking, setIsTracking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setTrackingData(null)

    if (!orderNumber || !email) {
      setError('Please enter both order number and email')
      return
    }

    setIsTracking(true)

    try {
      const response = await fetch('/api/track-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          email: email.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to track order')
      }

      setTrackingData(data.data)
    } catch (err: any) {
      setError(err.message || 'An error occurred while tracking your order')
    } finally {
      setIsTracking(false)
    }
  }

  const getCurrentStepIndex = (status: OrderStatus) => {
    return trackingSteps.findIndex(step => step.status === status)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Track Your Order</h1>
          <p className="text-muted-foreground">
            Enter your order number and email to track your shipment.
          </p>
        </div>

        {/* Track Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Find Your Order</CardTitle>
            <CardDescription>
              We&apos;ll send you tracking updates via email.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleTrack}>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                  {error}
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="orderNumber" className="block text-sm font-medium mb-2">
                    Order Number
                  </label>
                  <Input
                    id="orderNumber"
                    placeholder="e.g., ORD-2024-12345"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    required
                    disabled={isTracking}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Found in your order confirmation email
                  </p>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isTracking}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full md:w-auto" disabled={isTracking}>
                {isTracking ? 'Tracking...' : 'Track Order'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Tracking Results */}
        {!isTracking && trackingData && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order {trackingData.orderNumber}</CardTitle>
                <CardDescription>
                  Carrier: {trackingData.courierName || 'Not assigned'} | Tracking: {trackingData.trackingNumber || 'Not available'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-semibold capitalize">{trackingData.status.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expected Delivery</p>
                    <p className="font-semibold">{formatDate(trackingData.expectedDelivery)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Shipping to</p>
                    <p className="font-semibold">
                      {trackingData.shippingAddress.city}, {trackingData.shippingAddress.state}
                    </p>
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                  <div className="relative">
                    {trackingSteps.map((step, index) => {
                      const currentIndex = getCurrentStepIndex(trackingData.status)
                      const isCompleted = index <= currentIndex
                      const isCurrent = index === currentIndex

                      return (
                        <div key={step.status} className="flex items-start mb-6 last:mb-0">
                          <div className="flex flex-col items-center mr-4">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                isCompleted
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {isCompleted ? <CheckCircle className="h-5 w-5" /> : step.icon}
                            </div>
                            {index < trackingSteps.length - 1 && (
                              <div
                                className={`w-0.5 h-16 mt-2 ${
                                  isCompleted ? 'bg-primary' : 'bg-muted'
                                }`}
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={`font-semibold ${isCurrent ? 'text-primary' : ''}`}>
                              {step.label}
                            </p>
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                            {isCurrent && (
                              <span className="inline-block mt-1 text-xs font-medium text-primary">
                                Current status
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h3 className="font-semibold mb-4">Order History</h3>
                  <div className="space-y-4">
                    {trackingData.statusHistory.slice().reverse().map((history, index) => {
                      const statusLabel = history.status.replace('_', ' ')
                      const message = history.note || `Status updated to ${statusLabel}`
                      return (
                        <div key={index} className="flex gap-4 border-l-2 border-primary pl-4">
                          <div className="flex-shrink-0">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{message}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{formatDate(history.timestamp)}</span>
                              <span>&bull;</span>
                              <span className="capitalize">{statusLabel}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <Button variant="outline" asChild>
                <Link href="/orders">View All Orders</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Help text */}
        {!isTracking && !trackingData && !error && (
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center">
                Enter your order number and the email address used for the purchase. You will receive an email with tracking details.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
