// src/app/admin/orders/page.tsx
'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/shared/skeleton'
import { formatCurrency, formatDate, parseApiResponse } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'
import {
  Search,
  MoreVertical,
  Eye,
  Package,
  Download,
} from 'lucide-react'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
  RowSelectionState,
} from '@tanstack/react-table'

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

const paymentStatusColors: Record<string, string> = {
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
}

const statusTabs = [
  { value: '', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
]

const getItemCount = (items: Array<{ quantity?: number }> = []) =>
  items.reduce((total, item) => total + (item.quantity || 0), 0)

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const fetchOrders = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', (pageIndex + 1).toString())
    params.set('limit', pageSize.toString())
    if (statusFilter) params.set('status', statusFilter)
    if (search) params.set('search', search)
    if (paymentMethodFilter && paymentMethodFilter !== 'all') params.set('method', paymentMethodFilter)
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)

    if (sorting.length > 0) {
      const { id, desc } = sorting[0]
      params.set('sort', id === 'date' ? 'date' : 'total')
      params.set('sortOrder', desc ? 'desc' : 'asc')
    }

    fetch(`/api/admin/orders?${params.toString()}`)
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setOrders(result.data)
          setTotal(result.pagination.total)
        }
      })
      .catch(error => {
        console.error('Failed to fetch orders:', error)
        toast({
          title: 'Error',
          description: 'Failed to load orders',
          variant: 'destructive',
        })
      })
      .finally(() => {
        setLoading(false)
      })
  }, [pageIndex, pageSize, statusFilter, search, paymentMethodFilter, dateFrom, dateTo, sorting])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const result = await parseApiResponse(response)

      if (response.ok && result.success) {
        toast({
          title: 'Success',
          description: `Order status updated to ${newStatus}`,
        })
        fetchOrders()
      } else {
        throw new Error(result.message || 'Failed to update')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update order status',
        variant: 'destructive',
      })
    }
  }

  const handleBulkStatusUpdate = (newStatus: string) => {
    const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id])
    if (selectedIds.length === 0) {
      toast({
        title: 'No selection',
        description: 'Please select at least one order',
        variant: 'destructive',
      })
      return
    }

    const confirmed = confirm(`Update ${selectedIds.length} orders to "${newStatus.replace('_', ' ')}"?`)
    if (!confirmed) return

    Promise.all(
      selectedIds.map(async (id) => {
        const response = await fetch(`/api/admin/orders/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        })

        const result = await parseApiResponse(response)

        if (!response.ok || !result.success) {
          throw new Error(result.message || `Failed to update order ${id}`)
        }
      })
    )
      .then(() => {
        toast({
          title: 'Success',
          description: `Updated ${selectedIds.length} orders`,
        })
        setRowSelection({})
        fetchOrders()
      })
      .catch((error: any) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update selected orders',
          variant: 'destructive',
        })
      })
  }

  const handleExportCSV = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (search) params.set('search', search)
      if (paymentMethodFilter) params.set('method', paymentMethodFilter)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      params.set('limit', '1000')

      const response = await fetch(`/api/admin/orders?${params.toString()}`)
      const result = await response.json()

      if (!result.success || !result.data.length) {
        toast({
          title: 'Info',
          description: 'No data to export',
        })
        return
      }

      const orders = result.data
      const headers = [
        'Order Number',
        'Customer Name',
        'Customer Email',
        'Items Count',
        'Total',
        'Payment Method',
        'Payment Status',
        'Order Status',
        'Created At',
      ]

      const rows = orders.map((order: any) => [
        order.orderNumber,
        order.user?.name || '',
        order.user?.email || '',
        getItemCount(order.items),
        order.pricing.total,
        order.paymentInfo.method,
        order.paymentInfo.status,
        order.status,
        new Date(order.createdAt).toISOString().split('T')[0],
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `orders-export-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: 'Success',
        description: `Exported ${orders.length} orders`,
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: 'Error',
        description: 'Failed to export orders',
        variant: 'destructive',
      })
    }
  }, [statusFilter, search, paymentMethodFilter, dateFrom, dateTo])

  const clearFilters = () => {
    setStatusFilter('')
    setSearch('')
    setPaymentMethodFilter('all')
    setDateFrom('')
    setDateTo('')
    setPageIndex(0)
    setRowSelection({})
  }

  const hasActiveFilters = statusFilter || search || paymentMethodFilter || dateFrom || dateTo

  /* eslint-disable react-hooks/exhaustive-deps */
  const columns = useMemo(() => [
    {
      id: 'select',
      header: ({ table }: any) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }: any) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
      enableSorting: false,
      enableColumnFilters: false,
    },
    {
      accessorKey: 'orderNumber',
      header: 'Order #',
      cell: ({ row, cell }: any) => (
        <Link href={`/admin/orders/${row.original._id}`} className="font-mono font-medium hover:underline">
          {cell.getValue() as string}
        </Link>
      ),
    },
    {
      accessorKey: 'user',
      header: 'Customer',
      cell: ({ row }: any) => (
        <div>
          <p className="font-medium">{row.original.user?.name || 'N/A'}</p>
          <p className="text-sm text-muted-foreground">{row.original.user?.email}</p>
        </div>
      ),
    },
    {
      accessorKey: 'items',
      header: 'Items',
      cell: ({ row }: any) => `${getItemCount(row.original.items)} item(s)`,
    },
    {
      accessorKey: 'pricing.total',
      header: 'Total',
      cell: ({ row }: any) => (
        <span className="font-semibold">{formatCurrency(row.original.pricing?.total || 0)}</span>
      ),
    },
    {
      accessorKey: 'paymentInfo.method',
      header: 'Payment Method',
      cell: ({ row }: any) => (
        <span className="capitalize">{row.original.paymentInfo?.method || 'N/A'}</span>
      ),
    },
    {
      accessorKey: 'paymentInfo.status',
      header: 'Payment Status',
      cell: ({ row }: any) => {
        const status = row.original.paymentInfo?.status
        return (
          <Badge className={paymentStatusColors[status] || 'bg-gray-100'}>
            {status || 'N/A'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Order Status',
      cell: ({ row, cell }: any) => {
        const status = cell.getValue() as string | undefined
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Badge className={`${statusColors[status || ''] || ''} capitalize`}>
                  {status?.replace('_', ' ') || 'Unknown'}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'].map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => handleStatusUpdate(row.original._id, s)}
                  disabled={status === s}
                >
                  {s.replace('_', ' ')}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      enableSorting: true,
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }: any) => formatDate(row.original.createdAt),
      enableSorting: true,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/orders/${row.original._id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ], [])
/* eslint-enable react-hooks/exhaustive-deps */

  const table = useReactTable({
    data: orders,
    columns,
    state: {
      sorting,
      rowSelection,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newPagination = updater({ pageIndex, pageSize })
        setPageIndex(newPagination.pageIndex)
        setPageSize(newPagination.pageSize)
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
  })

  const selectedCount = Object.keys(rowSelection).filter(id => rowSelection[id]).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">
            Manage customer orders
          </p>
        </div>
        <Button onClick={handleExportCSV} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {statusTabs.map((tab) => (
          <Button
            key={tab.value}
            variant={statusFilter === tab.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setStatusFilter(tab.value)
              setPageIndex(0)
              setRowSelection({})
            }}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search order # or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPageIndex(0)
                }}
                className="pl-10"
              />
            </div>

            <Select value={paymentMethodFilter} onValueChange={(value) => { setPaymentMethodFilter(value); setPageIndex(0); }}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="razorpay">Razorpay</SelectItem>
                <SelectItem value="cod">Cash on Delivery</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input
                type="date"
                placeholder="From"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPageIndex(0); }}
              />
              <Input
                type="date"
                placeholder="To"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPageIndex(0); }}
              />
            </div>

            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedCount > 0 && (
            <div className="mt-4 p-3 bg-muted rounded-lg flex items-center gap-4">
              <span className="text-sm font-medium">{selectedCount} order(s) selected</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm">
                    Update Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'].map((status) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => handleBulkStatusUpdate(status)}
                    >
                      {status.replace('_', ' ')}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Orders ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : orders.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Page {pageIndex + 1} of {table.getPageCount()}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                  >
                    Last
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No orders found</h3>
              <p className="text-muted-foreground">
                {hasActiveFilters ? 'Try adjusting your filters' : 'No orders yet'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
