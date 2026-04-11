'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Package, ArrowRight, ShoppingBag } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

// Compute once at module load (approx. delivery date = 5 days from now)
const EXPECTED_DELIVERY_DATE = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')

export default function OrderSuccessPage() {
  const params = useParams()
  const orderId = params.id as string

  // Optionally fetch order details to display order number, etc.
  // For now, we show a generic success message

  useEffect(() => {
    // You could fetch order details here if needed
    toast({
      title: 'Order Placed Successfully!',
      description: 'Thank you for your order. You will receive a confirmation email shortly.',
    })
  }, [])

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        {/* Success Animation */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Order Confirmed!</h1>
          <p className="text-xl text-muted-foreground mb-2">
            Thank you for shopping with us
          </p>
          <p className="text-muted-foreground">
            Your order has been placed successfully and is being processed.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Package className="h-5 w-5" />
              Order Details
            </CardTitle>
            <CardDescription>
              Order ID: {orderId}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Status</span>
              <span className="font-semibold text-green-600">Confirmed</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Expected Delivery</span>
              <span className="font-semibold">
                {EXPECTED_DELIVERY_DATE}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Confirmation Email</span>
              <span className="font-semibold">Sent</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild className="gap-2">
            <Link href="/orders">
              <Package className="h-5 w-5" />
              View Order Details
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="gap-2">
            <Link href="/products">
              <ShoppingBag className="h-5 w-5" />
              Continue Shopping
            </Link>
          </Button>
        </div>

        <div className="mt-12 p-6 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">What&apos;s Next?</h3>
          <ul className="text-left text-sm text-muted-foreground space-y-2 max-w-md mx-auto">
            <li>• You will receive an email confirmation with your order details</li>
            <li>• We&apos;ll notify you when your order ships</li>
            <li>• Track your order status in the &quot;My Orders&quot; section</li>
            <li>• Have questions? Contact our support team</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
