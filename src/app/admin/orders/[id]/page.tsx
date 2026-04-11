'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/shared/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { formatCurrency, formatDate, parseApiResponse } from '@/lib/utils'
import {
  ArrowLeft,
  Package,
  Truck,
  CreditCard,
  MapPin,
  User,
  FileText,
  Download,
  Send,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  History
} from 'lucide-react'
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: 'Helvetica',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottom: '2 solid #2563eb',
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 5,
    color: '#2563eb',
  },
  companyInfo: {
    textAlign: 'right',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  col: {
    flex: 1,
  },
  table: {
    width: '100%',
    marginTop: 10,
    marginBottom: 20,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #e5e7eb',
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold',
  },
  tableCell: {
    padding: 8,
    flex: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 10,
    borderTop: '2 solid #333',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 20,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    width: 100,
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1 solid #e5e7eb',
    paddingTop: 10,
    textAlign: 'center',
    fontSize: 10,
    color: '#6b7280',
  },
})

interface InvoicePDFProps {
  order: any
  companyName?: string
  companyAddress?: string
  companyEmail?: string
}

function InvoicePDF({ order, companyName = 'E-Shop', companyAddress = '123 Commerce St, India', companyEmail = 'support@eshop.com' }: InvoicePDFProps) {
  const subtotal = order.pricing?.subtotal || 0
  const discount = order.pricing?.discount || 0
  const couponDiscount = order.pricing?.couponDiscount || 0
  const deliveryCharge = order.pricing?.deliveryCharge || 0
  const tax = order.pricing?.tax || 0
  const total = order.pricing?.total || 0

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{companyName}</Text>
            <Text>{companyAddress}</Text>
            <Text>{companyEmail}</Text>
          </View>
          <View style={styles.companyInfo}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>INVOICE</Text>
            <Text>Order #{order.orderNumber}</Text>
            <Text>Date: {formatDate(order.createdAt)}</Text>
            <Text>Status: {order.status.replace('_', ' ')}</Text>
          </View>
        </View>

        {/* Billing & Shipping Info */}
        <View style={[styles.row, { marginBottom: 20 }]}>
          <View style={[styles.col, { marginRight: 20 }]}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text>{order.user?.name || 'N/A'}</Text>
            <Text>{order.user?.email || 'N/A'}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Ship To</Text>
            {order.shippingAddress ? (
              <>
                <Text>{order.shippingAddress.fullName}</Text>
                <Text>{order.shippingAddress.line1}</Text>
                {order.shippingAddress.line2 && <Text>{order.shippingAddress.line2}</Text>}
                <Text>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</Text>
                <Text>{order.shippingAddress.country}</Text>
                <Text>Phone: {order.shippingAddress.phone}</Text>
              </>
            ) : (
              <Text>N/A</Text>
            )}
          </View>
        </View>

        {/* Items Table */}
        <Text style={styles.sectionTitle}>Order Items</Text>
        <View style={styles.table}>
          {/* Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={[styles.tableCell, { width: '50%' }]}>
              <Text>Item</Text>
            </View>
            <View style={[styles.tableCell, { width: '15%' }]}>
              <Text>Price</Text>
            </View>
            <View style={[styles.tableCell, { width: '10%' }]}>
              <Text>Qty</Text>
            </View>
            <View style={[styles.tableCell, { width: '25%' }]}>
              <Text>Total</Text>
            </View>
          </View>

          {/* Rows */}
          {order.items?.map((item: any, idx: number) => (
            <View key={idx} style={styles.tableRow}>
              <View style={[styles.tableCell, { width: '50%' }]}>
                <Text>{item.name}</Text>
              </View>
              <View style={[styles.tableCell, { width: '15%' }]}>
                <Text>{formatCurrency(item.price)}</Text>
              </View>
              <View style={[styles.tableCell, { width: '10%' }]}>
                <Text>{item.quantity}</Text>
              </View>
              <View style={[styles.tableCell, { width: '25%' }]}>
                <Text>{formatCurrency(item.subtotal)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={[styles.totalRow, { marginTop: 20 }]}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
        </View>
        {discount > 0 && (
          <View style={styles.row}>
            <Text style={{ flex: 1, textAlign: 'right' }}>Discount</Text>
            <Text style={{ width: 100, textAlign: 'right' }}>-{formatCurrency(discount)}</Text>
          </View>
        )}
        {couponDiscount > 0 && (
          <View style={styles.row}>
            <Text style={{ flex: 1, textAlign: 'right' }}>Coupon Discount</Text>
            <Text style={{ width: 100, textAlign: 'right' }}>-{formatCurrency(couponDiscount)}</Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={{ flex: 1, textAlign: 'right' }}>Delivery</Text>
          <Text style={{ width: 100, textAlign: 'right' }}>{formatCurrency(deliveryCharge)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={{ flex: 1, textAlign: 'right' }}>Tax (GST)</Text>
          <Text style={{ width: 100, textAlign: 'right' }}>{formatCurrency(tax)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
        </View>

        {/* Payment & Delivery */}
        <View style={[styles.section, { marginTop: 30 }]}>
          <View style={styles.row}>
            <View style={[styles.col, { marginRight: 20 }]}>
              <Text style={styles.sectionTitle}>Payment Method</Text>
              <Text>{order.paymentInfo?.method?.toUpperCase() || 'N/A'}</Text>
              <Text>Status: {order.paymentInfo?.status || 'N/A'}</Text>
              {order.paymentInfo?.razorpayPaymentId && (
                <Text>Payment ID: {order.paymentInfo.razorpayPaymentId}</Text>
              )}
            </View>
            <View style={styles.col}>
              <Text style={styles.sectionTitle}>Delivery</Text>
              <Text>Expected: {formatDate(order.expectedDelivery)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Thank you for your business! For any queries, contact support.
        </Text>
      </Page>
    </Document>
  )
}

const getItemCount = (items: Array<{ quantity?: number }> = []) =>
  items.reduce((total, item) => total + (item.quantity || 0), 0)

export default function AdminOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [courierName, setCourierName] = useState('')
  const [note, setNote] = useState('')
  const [updating, setUpdating] = useState(false)
  const [refunding, setRefunding] = useState(false)

   
  const fetchOrder = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`)
      const result = await response.json()

      if (result.success) {
        const data = result.data
        setOrder(data)
        setStatus(data.status)
        setTrackingNumber(data.trackingNumber || '')
        setCourierName(data.courierName || '')
        setNote(data.adminNote || '')
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to fetch order',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch order',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId, fetchOrder])

  const handleUpdateStatus = async () => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          trackingNumber: trackingNumber || undefined,
          courierName: courierName || undefined,
        }),
      })

      const result = await parseApiResponse(response)

      if (response.ok && result.success) {
        toast({
          title: 'Success',
          description: 'Order status updated',
        })
        fetchOrder()
      } else {
        throw new Error(result.message || 'Failed to update')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleSaveNote = async () => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNote: note }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Note saved',
        })
        fetchOrder() // to maybe show updated note? adminNote not displayed but ok
      } else {
        throw new Error(result.message || 'Failed to save note')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleRefund = async () => {
    if (!confirm('Are you sure you want to initiate a refund? This cannot be undone.')) {
      return
    }

    setRefunding(true)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: 'POST',
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Refund initiated successfully',
        })
        fetchOrder()
      } else {
        throw new Error(result.message || 'Failed to process refund')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setRefunding(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-32" />
          </div>
          <div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
        <p className="text-muted-foreground mb-4">The order you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.push('/admin/orders')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
      </div>
    )
  }

  const subtotal = order.pricing?.subtotal || 0
  const discount = order.pricing?.discount || 0
  const couponDiscount = order.pricing?.couponDiscount || 0
  const deliveryCharge = order.pricing?.deliveryCharge || 0
  const tax = order.pricing?.tax || 0
  const total = order.pricing?.total || 0
  const canRefund = order.paymentInfo?.status === 'paid' && ['delivered', 'out_for_delivery'].includes(order.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/admin/orders')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Order {order.orderNumber}</h1>
            <p className="text-muted-foreground">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <PDFDownloadLink
              document={<InvoicePDF order={order} />}
              fileName={`invoice-${order.orderNumber}.pdf`}
            >
              {({ loading }) => (
                <Button disabled={loading}>
                  <Download className="mr-2 h-4 w-4" />
                  {loading ? 'Generating...' : 'Download Invoice'}
                </Button>
              )}
            </PDFDownloadLink>
          </Button>
          {canRefund && (
            <Button variant="destructive" onClick={handleRefund} disabled={refunding}>
              <XCircle className="mr-2 h-4 w-4" />
              {refunding ? 'Processing...' : 'Refund Order'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Order Items ({getItemCount(order.items)})</h2>
              </div>
              <div className="space-y-4">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4 border-b pb-4 last:border-0">
                    {item.image && (
                      <div className="h-20 w-20 shrink-0 rounded-md overflow-hidden bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.price)} × {item.quantity}
                      </p>
                      <p className="font-semibold mt-1">{formatCurrency(item.subtotal)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <History className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Status Timeline</h2>
              </div>
              <div className="space-y-4">
                {order.statusHistory?.map((history: any, idx: number) => (
                  <div key={idx} className="flex gap-4">
                    <div className="mt-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="capitalize">
                          {history.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(history.timestamp)}
                        </span>
                      </div>
                      {history.note && (
                        <p className="text-sm text-muted-foreground mt-1">{history.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Add Note */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Add Internal Note</h2>
              </div>
              <Textarea
                placeholder="Add a note about this order (internal use only)..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
              <Button onClick={handleSaveNote} disabled={updating} className="mt-4">
                <Send className="mr-2 h-4 w-4" />
                Save Note
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Update Status */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Update Status</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Current Status</label>
                  <Badge className="capitalize">{status.replace('_', ' ')}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Change Status</label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Tracking Number (optional)</label>
                  <Input
                    placeholder="e.g., 1234567890"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Courier Name (optional)</label>
                  <Input
                    placeholder="e.g., FedEx, Delhivery"
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                  />
                </div>
                <Button onClick={handleUpdateStatus} disabled={updating} className="w-full">
                  {updating ? 'Updating...' : 'Update Status'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Customer & Shipping */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer
              </h2>
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {order.user?.name || 'N/A'}</p>
                <p><strong>Email:</strong> {order.user?.email || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </h2>
              {order.shippingAddress ? (
                <div className="text-sm space-y-1">
                  <p className="font-medium">{order.shippingAddress.fullName}</p>
                  <p>{order.shippingAddress.line1}</p>
                  {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
                  <p>{order.shippingAddress.country}</p>
                  <p>Phone: {order.shippingAddress.phone}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">No address provided</p>
              )}
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Method</span>
                  <span className="font-medium uppercase">{order.paymentInfo?.method || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <Badge variant={
                    order.paymentInfo?.status === 'paid' ? 'default' :
                    order.paymentInfo?.status === 'failed' ? 'destructive' : 'secondary'
                  }>
                    {order.paymentInfo?.status || 'N/A'}
                  </Badge>
                </div>
                {order.paymentInfo?.razorpayPaymentId && (
                  <p className="text-xs text-muted-foreground break-all">
                    ID: {order.paymentInfo.razorpayPaymentId}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Discount</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Coupon</span>
                    <span>-{formatCurrency(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span>{formatCurrency(deliveryCharge)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (GST)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
