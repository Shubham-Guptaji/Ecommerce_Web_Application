'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw, Mail, Phone } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { axiosInstance } from '@/lib/axios'

export default function PaymentFailedPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    toast({
      title: 'Payment Failed',
      description: 'Your payment could not be processed. Please try again.',
      variant: 'destructive',
    })
  }, [])

  const handleRetry = async () => {
    try {
      setRetrying(true)
      const response = await axiosInstance.post(`/api/payment/retry/${orderId}`)
      const { orderId: retryOrderId, razorpayOrderId, amount, currency, key, name, description, prefill } = response.data.data

      const params = new URLSearchParams({
        orderId: retryOrderId,
        razorpayOrderId,
        amount: amount.toString(),
        currency,
        key,
        name,
        description,
        email: prefill?.email || '',
        phone: prefill?.phone || '',
      })

      router.push(`/payment?${params.toString()}`)
    } catch (error: any) {
      toast({
        title: 'Retry unavailable',
        description: error.response?.data?.message || 'Unable to restart payment for this order.',
        variant: 'destructive',
      })
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        {/* Error Animation */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-100 mb-4">
            <AlertCircle className="h-16 w-16 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-red-600">Payment Failed</h1>
          <p className="text-xl text-muted-foreground mb-2">
            We couldn&apos;t process your payment
          </p>
          <p className="text-muted-foreground">
            Don&apos;t worry, your order has not been cancelled. You can try again.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What Happened?</CardTitle>
            <CardDescription>
              Your payment could not be completed due to one of the following reasons:
            </CardDescription>
          </CardHeader>
          <CardContent className="text-left space-y-3">
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Insufficient funds in your account</li>
              <li>Network connectivity issues</li>
              <li>Card declined by the bank</li>
              <li>Payment gateway timeout</li>
            </ul>
            <p className="text-sm mt-4">
              <strong>Order ID:</strong> {orderId}
            </p>
            <p className="text-sm">
              <strong>Status:</strong>{' '}
              <span className="text-red-600 font-semibold">Payment Pending</span>
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button size="lg" onClick={handleRetry} className="gap-2" disabled={retrying}>
            <RefreshCw className="h-5 w-5" />
            {retrying ? 'Loading Payment...' : 'Try Payment Again'}
          </Button>
          <Button size="lg" variant="outline" asChild className="gap-2">
            <Link href="/orders">
              View My Orders
            </Link>
          </Button>
        </div>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="text-left space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Email Support</p>
                <p className="text-sm text-muted-foreground">
                  Send us your order details and we&apos;ll help you complete the payment.
                </p>
                <Button variant="link" className="px-0 h-auto" asChild>
                  <Link href="mailto:support@eshop.com">support@eshop.com</Link>
                </Button>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Call Us</p>
                <p className="text-sm text-muted-foreground">
                  Our support team is available 24/7
                </p>
                <p className="text-sm font-medium">+91 9876543210</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Common Issues</h3>
          <ul className="text-left text-sm text-muted-foreground space-y-2 max-w-md mx-auto">
            <li>• Ensure your card is enabled for online transactions</li>
            <li>• Check if you&apos;ve reached your daily transaction limit</li>
            <li>• Verify your card details (number, expiry, CVV) are correct</li>
            <li>• Try a different payment method or card</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
