// src/app/(store)/payment/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { Loader2, CreditCard, Lock, ShieldCheck } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { axiosInstance } from '@/lib/axios'

export default function PaymentPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()

  const [orderId, setOrderId] = useState<string>('')
  const [razorpayOrderId, setRazorpayOrderId] = useState<string>('')
  const [amount, setAmount] = useState<number>(0)
  const [currency, setCurrency] = useState<string>('INR')
  const [keyId, setKeyId] = useState<string>('')
  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [prefill, setPrefill] = useState<{ name?: string; email?: string; phone?: string }>({})
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    // Get parameters from URL
    const oId = searchParams.get('orderId')
    const rOrderId = searchParams.get('razorpayOrderId')
    const amt = searchParams.get('amount')
    const cur = searchParams.get('currency') || 'INR'
    const k = searchParams.get('key')
    const n = searchParams.get('name') || 'E-Shop'
    const desc = searchParams.get('description') || ''
    const email = searchParams.get('email') || ''
    const phone = searchParams.get('phone') || ''

    if (!oId || !rOrderId || !amt || !k) {
      toast({
        title: 'Invalid Payment Request',
        description: 'Missing required payment parameters.',
        variant: 'destructive',
      })
      router.push('/cart')
      return
    }

    setOrderId(oId)
    setRazorpayOrderId(rOrderId)
    setAmount(parseFloat(amt))
    setCurrency(cur)
    setKeyId(k)
    setName(n)
    setDescription(desc)
    setPrefill({
      name: session?.user?.name || '',
      email: session?.user?.email || email,
      ...(phone && { phone }), // Only include phone if it's not empty
    })

    // Verify session matches order (optional)
    setLoading(false)
  }, [searchParams, router, session])

  const handleRazorpayPayment = useCallback(() => {
    if (!window) return

    setProcessing(true)

    // Load Razorpay script if not already loaded
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => {
      const options = {
        key: keyId,
        amount: amount * 100, // in paise
        currency: currency,
        name: name,
        description: description,
        order_id: razorpayOrderId,
        prefill: prefill,
        theme: {
          color: '#2563eb',
        },
        handler: async (response: any) => {
          try {
            const verifyResponse = await axiosInstance.post('/api/payment/verify', {
              orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })

            if (verifyResponse.data.success) {
              toast({
                title: 'Payment Successful',
                description: 'Your order has been confirmed.',
              })
              router.push(verifyResponse.data.data.redirectUrl)
            } else {
              toast({
                title: 'Payment Failed',
                description: verifyResponse.data.message || 'Payment verification failed.',
                variant: 'destructive',
              })
              router.push(`/orders/${orderId}/payment-failed`)
            }
          } catch (error: any) {
            toast({
              title: 'Error',
              description: error.response?.data?.message || 'Payment verification encountered an error.',
              variant: 'destructive',
            })
            router.push(`/orders/${orderId}/payment-failed`)
          } finally {
            setProcessing(false)
          }
        },
        modal: {
          ondismiss: () => {
            setProcessing(false)
            toast({
              title: 'Payment Cancelled',
              description: 'You cancelled the payment.',
              variant: 'destructive',
            })
          },
        },
      }

      const razorpay = new (window as any).Razorpay(options)
      razorpay.open()
    }

    script.onerror = () => {
      setProcessing(false)
      toast({
        title: 'Error',
        description: 'Failed to load payment gateway.',
        variant: 'destructive',
      })
    }

    document.body.appendChild(script)
  }, [keyId, amount, currency, name, description, razorpayOrderId, prefill, orderId, router])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Complete Your Payment</h1>
        <p className="text-muted-foreground">
          You are just one step away from completing your order
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Order Summary */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Order #{orderId.slice(-6).toUpperCase()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* We would fetch order details here to show items */}
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Secure Payment</p>
                    <p className="text-sm text-muted-foreground">
                      Your payment information is encrypted and secure
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount</span>
                  <span>{formatCurrency(amount)}</span>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  Amount includes taxes and delivery charges
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Method */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-4 border rounded-lg bg-primary/5">
                <CreditCard className="h-5 w-5 mt-1" />
                <div>
                  <p className="font-medium">Pay with Razorpay</p>
                  <p className="text-sm text-muted-foreground">
                    Debit/Credit Card, UPI, Net Banking, Wallets
                  </p>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleRazorpayPayment}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Pay {formatCurrency(amount)}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                <Lock className="h-3 w-3" />
                Powered by Razorpay. 256-bit SSL encryption
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
