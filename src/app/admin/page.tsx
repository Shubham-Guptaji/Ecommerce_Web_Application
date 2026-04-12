// src/app/admin/page.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/shared/skeleton'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
} from 'lucide-react'

// Dynamic imports for charts (no SSR)
const RevenueChart = dynamic(
  () => import('@/components/admin/charts/revenue-chart').then((mod) => mod.RevenueChart),
  { ssr: false }
)
const OrdersChart = dynamic(
  () => import('@/components/admin/charts/orders-chart').then((mod) => mod.OrdersChart),
  { ssr: false }
)
const TopProductsChart = dynamic(
  () => import('@/components/admin/charts/top-products-chart').then((mod) => mod.TopProductsChart),
  { ssr: false }
)
const CategoryChart = dynamic(
  () => import('@/components/admin/charts/category-chart').then((mod) => mod.CategoryChart),
  { ssr: false }
)

export default function AdminDashboard() {
  const { data: overviewData, isLoading: overviewLoading, error: overviewError } = useQuery({
    queryKey: ['admin', 'analytics', 'overview'],
    queryFn: async () => {
      const res = await fetch('/api/admin/analytics/overview')
      if (!res.ok) throw new Error('Failed to fetch overview')
      return res.json()
    },
  })

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'revenue'],
    queryFn: async () => {
      const res = await fetch('/api/admin/analytics/revenue')
      if (!res.ok) throw new Error('Failed to fetch revenue')
      return res.json()
    },
  })

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['admin', 'analytics', 'products'],
    queryFn: async () => {
      const res = await fetch('/api/admin/analytics/products')
      if (!res.ok) throw new Error('Failed to fetch products analytics')
      return res.json()
    },
  })

  const { data: recentOrdersData, isLoading: recentOrdersLoading } = useQuery({
    queryKey: ['admin', 'orders', 'recent'],
    queryFn: async () => {
      const res = await fetch('/api/admin/orders?limit=10&sort=date&sortOrder=desc')
      if (!res.ok) throw new Error('Failed to fetch recent orders')
      return res.json()
    },
  })

  const isLoading = overviewLoading || revenueLoading || productsLoading || recentOrdersLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  if (overviewError) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
      </div>
    )
  }

  // Transform data for stats cards
  const overview = overviewData?.data || {}
  const revenue = revenueData?.data || []
  const productsAnalytics = productsData?.data || {}

  const stats = {
    totalRevenue: {
      value: overview.totalRevenue || 0,
      change: overview.revenueChange || 0,
    },
    totalOrders: {
      value: overview.totalOrders || 0,
      change: 0, // Could calculate from ordersToday/ordersThisWeek if needed
    },
    newUsers: {
      value: overview.newUsers || 0,
      change: 0, // Could calculate if we had last month's new users
    },
    lowStockProducts: {
      value: overview.lowStockProductsCount || 0,
    },
    revenueChart: revenue.map((item: any) => ({
      date: new Date(item._id).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
      revenue: item.revenue,
    })),
    topProducts: (productsAnalytics.topProducts || []).map((item: any) => ({
      name: item.name,
      sold: item.quantitySold,
    })),
    revenueByCategory: (productsAnalytics.revenueByCategory || []).map((item: any) => ({
      name: item.categoryName || 'Uncategorized',
      value: item.revenue,
    })),
    ordersByStatus: (productsAnalytics.ordersByStatus || []).map((item: any) => ({
      status: item._id,
      count: item.count,
    })),
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 sm:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue.value)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {stats.totalRevenue.change > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span className={stats.totalRevenue.change > 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(stats.totalRevenue.change)}%
              </span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders.value}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {stats.totalOrders.change > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span className={stats.totalOrders.change > 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(stats.totalOrders.change)}%
              </span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">New Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newUsers.value}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {stats.newUsers.change > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span className={stats.newUsers.change > 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(stats.newUsers.change)}%
              </span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.lowStockProducts.value}</div>
            <p className="text-xs text-muted-foreground mt-1">Products with stock &lt; 10</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 sm:gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={stats.revenueChart} />
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <OrdersChart data={stats.ordersByStatus} />
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <TopProductsChart data={stats.topProducts} />
          </CardContent>
        </Card>

        {/* Revenue by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryChart data={stats.revenueByCategory} />
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Table */}
      {(overviewData?.data?.lowStockProductsCount || overviewData?.data?.lowStockProducts?.length || 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-4">
              Products with stock below 10 units need restocking.
            </div>
            {overviewData?.data?.lowStockProducts && overviewData.data.lowStockProducts.length > 0 ? (
              <div className="space-y-4">
                {overviewData.data.lowStockProducts.map((product: any) => (
                  <div
                    key={product._id}
                    className="flex flex-col gap-3 border-b pb-4 last:border-0 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <div className="h-12 w-12 rounded-md overflow-hidden bg-muted">
                      {product.images?.[0]?.url ? (
                        <Image
                          src={product.images[0].url}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.sku}</p>
                    </div>
                    <div className="sm:text-right">
                      <p className={`font-semibold ${product.stock < 5 ? 'text-red-600' : 'text-orange-600'}`}>
                        {product.stock} left
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => window.open(`/admin/products/${product._id}/edit`, '_blank')}
                    >
                      Edit Stock
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p>No low stock products</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrdersLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : recentOrdersData?.success && recentOrdersData.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium">Order #</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Customer</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Items</th>
                    <th className="text-right py-3 px-4 text-sm font-medium">Total</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrdersData.data.map((order: any) => (
                    <tr key={order._id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <Link href={`/admin/orders/${order._id}`} className="font-mono font-medium hover:underline">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{order.user?.name || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">{order.user?.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        {order.items?.length || 0} items
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {formatCurrency(order.pricing?.total || 0)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'cancelled' || order.status === 'refunded' ? 'bg-red-100 text-red-800' :
                          order.status === 'shipped' || order.status === 'out_for_delivery' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p>No orders yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
