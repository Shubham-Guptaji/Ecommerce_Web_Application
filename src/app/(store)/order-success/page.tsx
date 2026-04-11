// File path: src/app/(store)/order-success/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Package } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function OrderSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId')
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

   
  useEffect(() => {
    if (!orderId) {
      router.push('/')
      return
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`)
        if (!res.ok) throw new Error('Failed to fetch order')
        const result = await res.json()
        setOrder(result.data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, router])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Package className="h-16 w-16 mx-auto animate-pulse text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Loading order details...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Order not found</h1>
        <Button asChild>
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <CheckCircle2 className="h-20 w-20 mx-auto text-green-500" />
          <h1 className="text-3xl font-bold">Order Confirmed!</h1>
          <p className="text-muted-foreground">
            Thank you for your purchase. Your order #{order.orderNumber} has been placed successfully.
          </p>
        </div>

        <div className="bg-muted rounded-lg p-6 space-y-4 text-left">
          <div className="flex justify-between">
            <span className="font-medium">Order Number</span>
            <span>{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Order Date</span>
            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Total Amount</span>
            <span className="font-bold">{formatCurrency(order.pricing.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Estimated Delivery</span>
            <span>
              {order.expectedDelivery
                ? new Date(order.expectedDelivery).toLocaleDateString()
                : '5-7 business days'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Payment Status</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              order.paymentInfo?.status === 'paid'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {order.paymentInfo?.status || 'pending'}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => router.push(`/orders/${order._id}`)}>
            View Order Details
          </Button>
          <Button variant="outline" onClick={() => router.push('/products')}>
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  )
}
