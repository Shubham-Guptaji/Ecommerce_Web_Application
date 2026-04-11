// File path: src/app/(store)/orders/[id]/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSelector } from 'react-redux'
import { useAppDispatch } from '@/hooks/useRedux'
import { RootState } from '@/store'
import { cancelOrder, fetchOrderById, clearOrder, returnOrder } from '@/store/slices/ordersSlice'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/shared/skeleton'
import { toast } from '@/hooks/use-toast'
import Image from 'next/image'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import InvoiceDownload from '@/components/shared/InvoiceDownload'
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  FileText,
  Download,
  X,
} from 'lucide-react'

const statusSteps = [
  { status: 'pending', label: 'Order Placed' },
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'processing', label: 'Processing' },
  { status: 'shipped', label: 'Shipped' },
  { status: 'out_for_delivery', label: 'Out for Delivery' },
  { status: 'delivered', label: 'Delivered' },
]

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const dispatch = useAppDispatch()

  const order = useSelector((state: RootState) => state.orders.order)
  const loading = useSelector((state: RootState) => state.orders.loading)
  const error = useSelector((state: RootState) => state.orders.error)

  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [refundReason, setRefundReason] = useState('')
  const [submittingRefund, setSubmittingRefund] = useState(false)

  useEffect(() => {
    if (orderId) {
      dispatch(fetchOrderById(orderId))
    }
    // Clear order on unmount
    return () => {
      dispatch(clearOrder())
    }
  }, [orderId, dispatch])

  const currentOrder = order

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return
    }

    try {
      const result = await dispatch(cancelOrder(orderId)).unwrap()
      toast({
        title: 'Order Cancelled',
        description: result.message || 'Your order has been cancelled successfully.',
      })
      // Refetch to get updated order status
      await dispatch(fetchOrderById(orderId))
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel order',
        variant: 'destructive',
      })
    }
  }

  const handleRefundRequest = async () => {
    if (!refundReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for the refund',
        variant: 'destructive',
      })
      return
    }

    setSubmittingRefund(true)
    try {
      const result = await dispatch(returnOrder({ id: orderId, reason: refundReason })).unwrap()
      toast({
        title: 'Refund Requested',
        description: result.message || 'Your refund request has been submitted successfully.',
      })
      setRefundDialogOpen(false)
      setRefundReason('')
      // Refetch order to show updated status
      await dispatch(fetchOrderById(orderId))
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setSubmittingRefund(false)
    }
  }

  const getStatusIndex = (currentStatus: string) => {
    return statusSteps.findIndex((step) => step.status === currentStatus)
  }

  if (loading && !currentOrder) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-96" />
          </div>
          <div>
            <Skeleton className="h-80" />
          </div>
        </div>
      </div>
    )
  }

  if (!currentOrder) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Order not found</h1>
        <p className="text-muted-foreground mb-6">
          The order you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
        </p>
        <Button asChild>
          <Link href="/orders">Back to Orders</Link>
        </Button>
      </div>
    )
  }

  const orderData = currentOrder
  const currentStatusIndex = getStatusIndex(orderData.status)
  const appliedCoupon = orderData.coupon as { code?: string } | null

  // Check if refund is allowed (within 7 days of delivery)
  const canRequestRefund = () => {
    if (orderData.status !== 'delivered') return false
    const deliveredDate = new Date(orderData.updatedAt)
    const now = new Date()
    const daysDiff = (now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24)
    return daysDiff <= 7
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Order {orderData.orderNumber}</h1>
          <p className="text-muted-foreground">
            Placed on {formatDateTime(orderData.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-lg px-3 py-1">
            {orderData.status.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      {/* Order Timeline */}
      {orderData.status !== 'cancelled' && !orderData.refundStatus && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {statusSteps.slice(0, currentStatusIndex + 1).map((step, index) => {
                const isCompleted = index <= currentStatusIndex
                const isCurrent = index === currentStatusIndex

                return (
                  <div key={step.status} className="relative flex items-start gap-4 pb-8 last:pb-0">
                    {/* Line */}
                    {index < statusSteps.length - 1 && (
                      <div
                        className={`absolute left-4 top-8 bottom-0 w-0.5 ${
                          isCompleted ? 'bg-primary' : 'bg-gray-200'
                        }`}
                        style={{ height: '100%' }}
                      />
                    )}

                    {/* Icon */}
                    <div
                      className={`relative z-10 h-8 w-8 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-gray-200 text-gray-500'
                      } ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Clock className="h-5 w-5" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-1">
                      <p className={`font-semibold ${isCurrent ? 'text-primary' : ''}`}>
                        {step.label}
                      </p>
                      {(() => {
                        const statusEntry = orderData.statusHistory.find(
                          (historyItem: any) => historyItem.status === step.status
                        )

                        if (!statusEntry) {
                          return null
                        }

                        return (
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(statusEntry.timestamp)}
                          </p>
                        )
                      })()}
                    </div>
                  </div>
                )
              })}
            </div>

            {orderData.refundStatus && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-1">Refund in Progress</h4>
                <p className="text-yellow-700 text-sm">
                  Status: {orderData.refundStatus}
                  {orderData.refundAmount && ` - ${formatCurrency(orderData.refundAmount)}`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>{orderData.items.length} items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderData.items.map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="relative h-20 w-20 rounded-md overflow-hidden bg-muted">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                          N/A
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
                      {item.discountedPrice && (
                        <p className="text-sm text-muted-foreground line-through">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{orderData.shippingAddress.fullName}</p>
                <p className="text-muted-foreground">{orderData.shippingAddress.phone}</p>
                <p className="text-muted-foreground">
                  {orderData.shippingAddress.line1}
                </p>
                {orderData.shippingAddress.line2 && (
                  <p className="text-muted-foreground">
                    {orderData.shippingAddress.line2}
                  </p>
                )}
                <p className="text-muted-foreground">
                  {orderData.shippingAddress.city}, {orderData.shippingAddress.state} {orderData.shippingAddress.pincode}
                </p>
                <p className="text-muted-foreground">{orderData.shippingAddress.country}</p>
              </div>

              {orderData.trackingNumber && (
                <div className="mt-4 pt-4 border-t">
                  <p className="font-medium">Tracking Number</p>
                  <p className="text-muted-foreground">{orderData.trackingNumber}</p>
                  {orderData.courierName && (
                    <p className="text-sm text-muted-foreground">
                      Courier: {orderData.courierName}
                    </p>
                  )}
                </div>
              )}

              {orderData.notes && (
                <div className="mt-4 pt-4 border-t">
                  <p className="font-medium">Order Notes</p>
                  <p className="text-muted-foreground">{orderData.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(orderData.pricing.subtotal)}</span>
              </div>

              {orderData.pricing.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(orderData.pricing.discount)}</span>
                </div>
              )}

              {appliedCoupon?.code && (
                <div className="flex justify-between text-green-600 text-sm">
                  <span>Coupon ({appliedCoupon.code})</span>
                  <span>-{formatCurrency(orderData.pricing.couponDiscount ?? 0)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Delivery</span>
                <span>{formatCurrency(orderData.pricing.deliveryCharge)}</span>
              </div>

              <div className="flex justify-between">
                <span>GST (18%)</span>
                <span>{formatCurrency(orderData.pricing.tax)}</span>
              </div>

              <Separator />

              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(orderData.pricing.total)}</span>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Payment Method</span>
                  <span className="capitalize">{orderData.paymentInfo.method}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Status</span>
                  <span
                    className={`capitalize ${
                      orderData.paymentInfo.status === 'paid' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {orderData.paymentInfo.status}
                  </span>
                </div>
                {orderData.paymentInfo.razorpayPaymentId && (
                  <p className="text-xs text-muted-foreground break-all">
                    Payment ID: {orderData.paymentInfo.razorpayPaymentId}
                  </p>
                )}
              </div>

              <div className="pt-4 space-y-2">
                {(orderData.status === 'pending' || orderData.status === 'confirmed') && (
                  <Button
                    variant="destructive"
                    className="w-full gap-2"
                    onClick={handleCancelOrder}
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel Order
                  </Button>
                )}

                <InvoiceDownload
                  order={orderData}
                  storeName="E-Shop"
                  storeEmail="contact@eshop.com"
                  storeAddress="123 Commerce Street, India"
                  storePhone="+91 9876543210"
                  currency="INR"
                  currencySymbol="₹"
                />

                {canRequestRefund() && (
                  <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        Request Return/Refund
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Request Refund</DialogTitle>
                        <DialogDescription>
                          Please provide a reason for your refund request. Our team will review it and get back to you.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Textarea
                          placeholder="Describe the reason for refund..."
                          value={refundReason}
                          onChange={(e) => setRefundReason(e.target.value)}
                          rows={4}
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setRefundDialogOpen(false)}
                          disabled={submittingRefund}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleRefundRequest} disabled={submittingRefund}>
                          {submittingRefund ? 'Submitting...' : 'Submit Request'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                {orderData.status === 'delivered' && !canRequestRefund() && (
                  <p className="text-xs text-center text-muted-foreground">
                    Refund request available only within 7 days of delivery
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
