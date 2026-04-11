// src/app/(store)/checkout/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormField, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Skeleton } from '@/components/shared/skeleton'
import { useCartStore } from '@/store/cartStore'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import Image from 'next/image'
import {
  MapPin,
  Plus,
  Check,
  Truck,
  Clock,
  CreditCard,
  X,
} from 'lucide-react'
import { axiosInstance } from '@/lib/axios'
import AddressForm from '@/components/checkout/AddressForm'

const checkoutSchema = z.object({
  addressId: z.string().min(1, 'Please select a delivery address'),
  deliveryMethod: z.enum(['standard', 'express']),
  paymentMethod: z.enum(['razorpay', 'cod']),
  notes: z.string().max(500).optional(),
})

type CheckoutForm = z.infer<typeof checkoutSchema>

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const {
    items,
    getSubtotal,
    clearCart,
    couponCode,
    couponDiscount,
    removeCoupon,
  } = useCartStore()

  const [addresses, setAddresses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<any>(null)

  const subtotal = getSubtotal()
  const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'express'>('standard')
  const freeDeliveryThreshold = 499
  let deliveryCharge = subtotal >= freeDeliveryThreshold ? 0 : 49
  if (deliveryMethod === 'express') {
    deliveryCharge = 99
  }

  const tax = subtotal * 0.18
  const total = subtotal - (couponDiscount || 0) + deliveryCharge + tax

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      addressId: '',
      deliveryMethod: 'standard',
      paymentMethod: 'razorpay',
      notes: '',
    },
  })

  // Sync form delivery method changes to local state
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'deliveryMethod') {
        setDeliveryMethod(value.deliveryMethod || 'standard')
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in?callbackUrl=/checkout')
    }
  }, [status, router])

   
  useEffect(() => {
    if (session?.user) {
      const fetchAddresses = async () => {
        try {
          const response = await axiosInstance.get('/api/user/addresses')
          if (response.data.success) {
            setAddresses(response.data.data)
            const defaultAddr = response.data.data.find((addr: any) => addr.isDefault)
            if (defaultAddr) {
              form.setValue('addressId', defaultAddr._id)
            }
          }
        } catch (error: any) {
          toast({
            title: 'Error',
            description: error.response?.data?.message || 'Failed to fetch addresses',
            variant: 'destructive',
          })
        } finally {
          setLoading(false)
        }
      }
      fetchAddresses()
    }
  }, [session, form])

  const handleAddressSubmit = (addressData: any) => {
    // Add or update the address in the list
    setAddresses((prev) => {
      const index = prev.findIndex((a) => a._id === addressData._id)
      if (index >= 0) {
        const newAddresses = [...prev]
        newAddresses[index] = addressData
        return newAddresses
      } else {
        return [...prev, addressData]
      }
    })
    // Auto-select the address
    form.setValue('addressId', addressData._id)
    setShowAddressForm(false)
    setEditingAddress(null)
    toast({
      title: addressData._id.startsWith('temp-') ? 'Address added' : 'Address saved',
      description: addressData._id.startsWith('temp-')
        ? 'Using address for this order only.'
        : 'Your new address has been saved to your profile.',
    })
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) {
      return
    }
    try {
      await axiosInstance.delete(`/api/user/addresses/${addressId}`)
      setAddresses((prev) => prev.filter((a) => a._id !== addressId))
      // If deleted address was selected, clear selection
      if (form.getValues('addressId') === addressId) {
        form.setValue('addressId', '')
      }
      toast({
        title: 'Address deleted',
        description: 'The address has been removed.',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete address',
        variant: 'destructive',
      })
    }
  }

  const onSubmit = async (data: CheckoutForm) => {
    setSubmitting(true)

    try {
      if (data.paymentMethod === 'razorpay') {
        // Razorpay flow using axios
        const response = await axiosInstance.post('/api/payment/create-order', {
          addressId: data.addressId,
          deliveryMethod: data.deliveryMethod,
          couponCode: couponCode || null,
          notes: data.notes,
        })

        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to process checkout')
        }

        const { orderId, razorpayOrderId, amount, currency, key, name, description, prefill } = response.data.data

        // Redirect to payment page with order details
        const params = new URLSearchParams({
          orderId,
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
      } else if (data.paymentMethod === 'cod') {
        // COD flow: create order directly via /api/payment/cod
        const response = await axiosInstance.post('/api/payment/cod', {
          addressId: data.addressId,
          deliveryMethod: data.deliveryMethod,
          couponCode: couponCode || null,
          notes: data.notes,
        })

        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to place order')
        }

        // Clear cart and redirect to success
        clearCart()
        toast({
          title: 'Order Placed!',
          description: 'Your order has been placed successfully. You will receive a confirmation email shortly.',
        })
        router.push(`/orders/${response.data.data._id}/success`)
      }
    } catch (error: any) {
      toast({
        title: 'Checkout Error',
        description: error.response?.data?.message || error.message,
        variant: 'destructive',
      })
      setSubmitting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-32" />
          </div>
          <div>
            <Skeleton className="h-80" />
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (items.length === 0) {
    router.push('/cart')
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Delivery Address */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <h2 className="text-xl font-semibold">Delivery Address</h2>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {showAddressForm ? (
                    <AddressForm
                      onSubmit={handleAddressSubmit}
                      onCancel={() => {
                        setShowAddressForm(false)
                        setEditingAddress(null)
                      }}
                      initialData={editingAddress}
                    />
                  ) : addresses.length === 0 ? (
                    <div className="text-center py-8 border rounded-lg">
                      <p className="text-muted-foreground mb-4">
                        No saved addresses. Add a new address to continue.
                      </p>
                      <Button onClick={() => setShowAddressForm(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Address
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {addresses.map((address) => (
                        <label
                          key={address._id}
                          className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                            form.watch('addressId') === address._id
                              ? 'border-primary bg-primary/5'
                              : 'hover:border-primary/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="addressId"
                            value={address._id}
                            checked={form.watch('addressId') === address._id}
                            onChange={() => form.setValue('addressId', address._id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{address.fullName}</span>
                              <span className="text-muted-foreground">{address.phone}</span>
                              {address.isDefault && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                  Default
                                </span>
                              )}
                              <span className="text-xs font-medium">{address.label}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {address.line1}, {address.line2 && `${address.line2}, `}
                              {address.city}, {address.state} {address.pincode}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingAddress(address)
                                  setShowAddressForm(true)
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteAddress(address._id)
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                          {form.watch('addressId') === address._id && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                        </label>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setEditingAddress(null)
                          setShowAddressForm(true)
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Address
                      </Button>
                    </div>
                  )}

                  <FormMessage>{form.formState.errors.addressId?.message}</FormMessage>
                </CardContent>
              </Card>

              {/* Delivery Method */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Truck className="h-5 w-5" />
                    <h2 className="text-xl font-semibold">Delivery Method</h2>
                  </div>

                  <div className="space-y-4">
                    <label
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                        deliveryMethod === 'standard'
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="deliveryMethod"
                          value="standard"
                          checked={deliveryMethod === 'standard'}
                          onChange={() => form.setValue('deliveryMethod', 'standard')}
                        />
                        <div>
                          <p className="font-medium">Standard Delivery</p>
                          <p className="text-sm text-muted-foreground">
                            5-7 business days
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">FREE</p>
                      </div>
                    </label>

                    <label
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                        deliveryMethod === 'express'
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="deliveryMethod"
                          value="express"
                          checked={deliveryMethod === 'express'}
                          onChange={() => form.setValue('deliveryMethod', 'express')}
                        />
                        <div>
                          <p className="font-medium">Express Delivery</p>
                          <p className="text-sm text-muted-foreground">
                            2-3 business days
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(99)}</p>
                      </div>
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-6">
                    <CreditCard className="h-5 w-5" />
                    <h2 className="text-xl font-semibold">Payment Method</h2>
                  </div>

                  <div className="space-y-4">
                    <label
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                        form.watch('paymentMethod') === 'razorpay'
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="razorpay"
                          checked={form.watch('paymentMethod') === 'razorpay'}
                          onChange={() => form.setValue('paymentMethod', 'razorpay')}
                          className="mt-1"
                        />
                        <div>
                          <p className="font-medium">Razorpay (Card/UPI/Net Banking)</p>
                          <p className="text-sm text-muted-foreground">
                            Instant payment confirmation
                          </p>
                        </div>
                      </div>
                      {form.watch('paymentMethod') === 'razorpay' && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </label>

                    <label
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                        form.watch('paymentMethod') === 'cod'
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      } ${total >= 5000 ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => {
                        if (total < 5000) {
                          form.setValue('paymentMethod', 'cod')
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cod"
                          checked={form.watch('paymentMethod') === 'cod'}
                          onChange={() => {}}
                          disabled={total >= 5000}
                          className="mt-1"
                        />
                        <div>
                          <p className="font-medium">Cash on Delivery (COD)</p>
                          <p className="text-sm text-muted-foreground">
                            Pay when you receive
                            {total >= 5000 && (
                              <span className="text-red-500"> (Not available for orders ≥ ₹5000)</span>
                            )}
                          </p>
                        </div>
                      </div>
                      {form.watch('paymentMethod') === 'cod' && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Order Notes */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-5 w-5" />
                    <h2 className="text-xl font-semibold">Order Notes (Optional)</h2>
                  </div>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormControl>
                        <textarea
                          className="w-full min-h-[100px] p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Add any special instructions for your order..."
                          {...field}
                        />
                      </FormControl>
                    )}
                  />
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-xl">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.product.toString()} className="flex gap-3">
                    <div className="relative h-16 w-16 shrink-0 rounded-md overflow-hidden bg-muted">
                      {item.image && item.image !== '/placeholder.jpg' ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          N/A
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      <p className="text-sm font-semibold">
                        {formatCurrency((item.discountedPrice || item.price) * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="mb-4" />

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                {/* Coupon Discount */}
                {couponDiscount > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="flex items-center gap-2">
                        Coupon: {couponCode}
                        <button
                          type="button"
                          onClick={removeCoupon}
                          className="hover:text-red-500 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                      <span>-{formatCurrency(couponDiscount)}</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between text-sm">
                  <span>GST (18%)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivery</span>
                  <span>
                    {deliveryCharge === 0 ? (
                      <span className="text-green-600 font-medium">FREE</span>
                    ) : (
                      formatCurrency(deliveryCharge)
                    )}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              <Button
                className="w-full mt-6"
                size="lg"
                onClick={form.handleSubmit(onSubmit)}
                disabled={submitting || !form.getValues('addressId')}
              >
                {submitting ? (
                  'Processing...'
                ) : form.watch('paymentMethod') === 'cod' ? (
                  `Place Order (${formatCurrency(total)})`
                ) : (
                  `Pay ${formatCurrency(total)}`
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-4">
                By placing your order, you agree to our Terms of Service and Privacy Policy
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
