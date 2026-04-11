// File path: src/app/(store)/orders/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useSelector } from 'react-redux'
import { useAppDispatch } from '@/hooks/useRedux'
import { RootState } from '@/store'
import { fetchOrders, cancelOrder } from '@/store/slices/ordersSlice'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/shared/skeleton'
import { Separator } from '@/components/ui/separator'
import Image from 'next/image'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { Package, ChevronRight, Clock, CheckCircle, XCircle, Truck, Trash2 } from 'lucide-react'
import { axiosInstance } from '@/lib/axios'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  out_for_delivery: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
}

const statusIcons: Record<string, any> = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: Package,
  shipped: Package,
  out_for_delivery: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
  refunded: XCircle,
}

function OrderCard({ order, onCancel }: { order: any; onCancel: (id: string) => void }) {
  const StatusIcon = statusIcons[order.status] || Package
  const canCancel = order.status === 'pending' || order.status === 'confirmed'

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg mb-1">{order.orderNumber}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {formatDate(order.createdAt)}
            </p>
          </div>
          <Badge className={`${statusColors[order.status] || ''} capitalize`}>
            {order.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex items-center gap-4">
          {order.items.length > 0 && (
            <div className="flex -space-x-2">
              {order.items.slice(0, 3).map((item: any, index: number) => (
                <div
                  key={index}
                  className="relative h-12 w-12 rounded-md border-2 border-background bg-muted overflow-hidden"
                >
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                      N/A
                    </div>
                  )}
                </div>
              ))}
              {order.items.length > 3 && (
                <div className="relative h-12 w-12 rounded-md border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                  +{order.items.length - 3}
                </div>
              )}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {order.items.length === 0
                ? 'No items'
                : order.items.map((item: any) => item.name).join(', ')}
            </p>
            <p className="text-sm text-muted-foreground">
              {order.items.reduce((total: number, item: any) => total + item.quantity, 0)} items
            </p>
          </div>

          <div className="text-right">
            <p className="font-bold text-lg">
              {formatCurrency(order.pricing.total)}
            </p>
            <div className="flex items-center justify-end gap-1 text-sm">
              <StatusIcon className="h-4 w-4" />
              <span className="capitalize">{order.status.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 flex justify-between items-center">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/orders/${order._id}`}>
            View Details <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
        {canCancel && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onCancel(order._id)}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Cancel
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export default function OrdersPage() {
  const { data: session } = useSession()
  const dispatch = useAppDispatch()
  const [activeTab, setActiveTab] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  // Redux state
  const orders = useSelector((state: RootState) => state.orders.orders)
  const loading = useSelector((state: RootState) => state.orders.loading)
  const error = useSelector((state: RootState) => state.orders.error)
  const pagination = useSelector((state: RootState) => state.orders.pagination)

  // Fetch orders when session changes or pagination/tab changes
  useEffect(() => {
    if (session?.user) {
      const status = activeTab === 'all' ? undefined : activeTab
      dispatch(fetchOrders({ page: currentPage, limit: 10, status }))
    }
  }, [session, currentPage, activeTab, dispatch])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    setCurrentPage(1)
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return
    }

    try {
      await dispatch(cancelOrder(orderId)).unwrap()
      toast({
        title: 'Order Cancelled',
        description: 'Your order has been cancelled successfully.',
      })
      // No need to refetch; optimistic removal already removed it
    } catch (error: any) {
      // Refetch to restore order if cancellation failed
      const status = activeTab === 'all' ? undefined : activeTab
      dispatch(fetchOrders({ page: currentPage, limit: 10, status }))
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel order',
        variant: 'destructive',
      })
    }
  }

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Active' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
  ]

  if (loading && orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Error loading orders</h1>
        <p className="text-muted-foreground mb-6">
          {error || 'Something went wrong'}
        </p>
        <Button onClick={() => {
          const status = activeTab === 'all' ? undefined : activeTab
          dispatch(fetchOrders({ page: currentPage, limit: 10, status }))
        }}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`pb-3 px-1 border-b-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {orders.length > 0 ? (
        <>
          <div className="space-y-4">
            {orders.map((order: any) => (
              <OrderCard key={order._id} order={order} onCancel={handleCancelOrder} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
          <p className="text-muted-foreground mb-6">
            When you place orders, they will appear here.
          </p>
          <Button asChild>
            <Link href="/products">Start Shopping</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
