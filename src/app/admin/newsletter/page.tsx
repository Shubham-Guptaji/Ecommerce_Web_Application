'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/shared/skeleton'
import { toast } from '@/hooks/use-toast'
import { formatDateTime, parseApiResponse } from '@/lib/utils'
import { NewsletterCampaignDetailDialog } from '@/components/admin/newsletter-campaign-detail-dialog'
import {
  NewsletterCampaignDialog,
  type NewsletterCampaignTarget,
} from '@/components/admin/newsletter-campaign-dialog'
import {
  Download,
  Eye,
  Mail,
  MoreVertical,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react'

type NewsletterSubscriber = {
  _id: string
  email: string
  subscribedAt: string
  unsubscribedAt?: string
  isActive: boolean
}

type NewsletterSummary = {
  totalSubscribers: number
  activeSubscribers: number
  inactiveSubscribers: number
  recentSubscribers: number
}

type NewsletterCampaign = {
  _id: string
  subject: string
  targetMode: 'single' | 'selected' | 'all'
  status: 'queued' | 'processing' | 'completed' | 'completed_with_errors' | 'failed'
  requestedCount: number
  activeRecipientCount: number
  sentCount: number
  failedCount: number
  skippedCount: number
  pendingCount: number
  processingCount: number
  createdByEmail?: string
  createdAt: string
  completedAt?: string
}

const statusColors: Record<'active' | 'inactive', string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
}

const campaignStatusColors: Record<NewsletterCampaign['status'], string> = {
  queued: 'bg-slate-100 text-slate-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  completed_with_errors: 'bg-amber-100 text-amber-800',
  failed: 'bg-red-100 text-red-800',
}

export default function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
  const [summary, setSummary] = useState<NewsletterSummary>({
    totalSubscribers: 0,
    activeSubscribers: 0,
    inactiveSubscribers: 0,
    recentSubscribers: 0,
  })
  const [loading, setLoading] = useState(true)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('subscribedAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({})
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false)
  const [campaignTarget, setCampaignTarget] = useState<NewsletterCampaignTarget | null>(null)
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([])
  const [campaignsLoading, setCampaignsLoading] = useState(true)
  const [campaignDetailId, setCampaignDetailId] = useState<string | null>(null)
  const [campaignDetailOpen, setCampaignDetailOpen] = useState(false)

  const fetchSubscribers = useCallback(async () => {
    setLoading(true)

    try {
      const params = new URLSearchParams()
      params.set('page', String(pageIndex + 1))
      params.set('limit', String(pageSize))
      params.set('sortBy', sortBy)
      params.set('sortOrder', sortOrder)
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)

      const response = await fetch(`/api/admin/newsletter?${params.toString()}`)
      const result = await parseApiResponse<{
        success: boolean
        data: NewsletterSubscriber[]
        pagination: { total: number }
        summary: NewsletterSummary
        message?: string
      }>(response)

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to load newsletter subscribers')
      }

      setSubscribers(result.data)
      setTotal(result.pagination.total)
      setSummary(result.summary)
    } catch (error: any) {
      console.error('Failed to fetch newsletter subscribers:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to load newsletter subscribers',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [pageIndex, pageSize, search, statusFilter, sortBy, sortOrder, dateFrom, dateTo])

  useEffect(() => {
    fetchSubscribers()
  }, [fetchSubscribers])

  const fetchCampaigns = useCallback(async () => {
    setCampaignsLoading(true)

    try {
      const response = await fetch('/api/admin/newsletter/campaigns?limit=10')
      const result = await parseApiResponse<{
        success?: boolean
        message?: string
        data?: NewsletterCampaign[]
      }>(response)

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || 'Failed to load campaign history')
      }

      setCampaigns(result.data)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load campaign history',
        variant: 'destructive',
      })
    } finally {
      setCampaignsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  useEffect(() => {
    const hasRunningCampaign = campaigns.some(
      (campaign) => campaign.status === 'queued' || campaign.status === 'processing'
    )

    if (!hasRunningCampaign) return

    const timer = window.setInterval(() => {
      fetchCampaigns()
    }, 5000)

    return () => window.clearInterval(timer)
  }, [campaigns, fetchCampaigns])

  const currentPageSelected = useMemo(
    () => subscribers.length > 0 && subscribers.every((subscriber) => selectedIds[subscriber._id]),
    [selectedIds, subscribers]
  )

  const selectedCount = useMemo(
    () => Object.values(selectedIds).filter(Boolean).length,
    [selectedIds]
  )

  const hasActiveFilters =
    Boolean(search) ||
    statusFilter !== 'all' ||
    Boolean(dateFrom) ||
    Boolean(dateTo) ||
    sortBy !== 'subscribedAt' ||
    sortOrder !== 'desc'

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setSortBy('subscribedAt')
    setSortOrder('desc')
    setDateFrom('')
    setDateTo('')
    setPageIndex(0)
    setSelectedIds({})
  }

  const toggleSelectAllCurrentPage = () => {
    setSelectedIds((previous) => {
      const next = { ...previous }

      if (currentPageSelected) {
        subscribers.forEach((subscriber) => {
          delete next[subscriber._id]
        })
      } else {
        subscribers.forEach((subscriber) => {
          next[subscriber._id] = true
        })
      }

      return next
    })
  }

  const toggleSelected = (subscriberId: string) => {
    setSelectedIds((previous) => {
      const next = { ...previous }

      if (next[subscriberId]) {
        delete next[subscriberId]
      } else {
        next[subscriberId] = true
      }

      return next
    })
  }

  const handleSubscriberStatus = async (subscriberId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/newsletter/${subscriberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })

      const result = await parseApiResponse<{ success?: boolean; message?: string }>(response)

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update subscriber')
      }

      toast({
        title: 'Success',
        description: `Subscriber ${isActive ? 'activated' : 'deactivated'}`,
      })

      fetchSubscribers()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update subscriber',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteSubscriber = async (subscriberId: string) => {
    if (!confirm('Delete this subscriber permanently? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/newsletter/${subscriberId}`, {
        method: 'DELETE',
      })

      const result = await parseApiResponse<{ success?: boolean; message?: string }>(response)

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to delete subscriber')
      }

      setSelectedIds((previous) => {
        const next = { ...previous }
        delete next[subscriberId]
        return next
      })

      toast({
        title: 'Success',
        description: 'Subscriber deleted successfully',
      })

      fetchSubscribers()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete subscriber',
        variant: 'destructive',
      })
    }
  }

  const handleSendWelcomeEmail = async (subscriberId: string) => {
    try {
      const response = await fetch(`/api/admin/newsletter/${subscriberId}/welcome-email`, {
        method: 'POST',
      })

      const result = await parseApiResponse<{ success?: boolean; message?: string }>(response)

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to send welcome email')
      }

      toast({
        title: 'Success',
        description: result.message || 'Welcome email sent successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send welcome email',
        variant: 'destructive',
      })
    }
  }

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    const ids = Object.keys(selectedIds).filter((id) => selectedIds[id])

    if (ids.length === 0) {
      toast({
        title: 'No selection',
        description: 'Please select at least one subscriber',
        variant: 'destructive',
      })
      return
    }

    const actionLabel =
      action === 'activate' ? 'activate' : action === 'deactivate' ? 'deactivate' : 'delete'
    const confirmed = confirm(
      `Are you sure you want to ${actionLabel} ${ids.length} subscriber${ids.length === 1 ? '' : 's'}?`
    )

    if (!confirmed) return

    try {
      const response = await fetch('/api/admin/newsletter/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids }),
      })

      const result = await parseApiResponse<{ success?: boolean; message?: string }>(response)

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update selected subscribers')
      }

      setSelectedIds({})
      toast({
        title: 'Success',
        description: result.message || 'Bulk action completed',
      })

      fetchSubscribers()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update selected subscribers',
        variant: 'destructive',
      })
    }
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      params.set('sortBy', sortBy)
      params.set('sortOrder', sortOrder)
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)

      const response = await fetch(`/api/admin/newsletter/export?${params.toString()}`)

      if (!response.ok) {
        const result = await parseApiResponse<{ message?: string }>(response)
        throw new Error(result.message || 'Failed to export subscribers')
      }

      const csv = await response.text()
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: 'Success',
        description: 'Newsletter subscribers exported successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to export subscribers',
        variant: 'destructive',
      })
    }
  }

  const handleResumeCampaign = async (campaignId: string, retryFailed = false) => {
    try {
      const response = await fetch(`/api/admin/newsletter/campaigns/${campaignId}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retryFailed }),
      })

      const result = await parseApiResponse<{ success?: boolean; message?: string }>(response)

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to resume campaign processing')
      }

      toast({
        title: retryFailed ? 'Retry started' : 'Campaign resumed',
        description: result.message || 'Campaign processing resumed in the background.',
      })

      fetchCampaigns()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resume campaign processing',
        variant: 'destructive',
      })
    }
  }

  const openCampaignDialog = (target: NewsletterCampaignTarget) => {
    setCampaignTarget(target)
    setCampaignDialogOpen(true)
  }

  const openSendToWholeList = () => {
    openCampaignDialog({
      mode: 'all',
      ids: [],
      label: 'the whole active newsletter list',
      estimatedCount: summary.activeSubscribers,
    })
  }

  const openSendToSelected = () => {
    const ids = Object.keys(selectedIds).filter((id) => selectedIds[id])
    if (ids.length === 0) {
      toast({
        title: 'No selection',
        description: 'Please select at least one subscriber first.',
        variant: 'destructive',
      })
      return
    }

    openCampaignDialog({
      mode: 'selected',
      ids,
      label: `${ids.length} selected subscriber${ids.length === 1 ? '' : 's'}`,
      estimatedCount: ids.length,
    })
  }

  const openSendToSingle = (subscriber: NewsletterSubscriber) => {
    openCampaignDialog({
      mode: 'single',
      ids: [subscriber._id],
      label: subscriber.email,
      estimatedCount: 1,
    })
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Newsletter</h1>
          <p className="text-muted-foreground">
            Manage newsletter subscribers, exports, and welcome emails.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={openSendToWholeList}>
            <Mail className="mr-2 h-4 w-4" />
            Send to Whole List
          </Button>
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalSubscribers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.activeSubscribers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unsubscribed</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.inactiveSubscribers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last 30 Days</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.recentSubscribers}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by email..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPageIndex(0)
                }}
                className="pl-10"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value)
                setPageIndex(0)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Unsubscribed</SelectItem>
              </SelectContent>
            </Select>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Input
                type="date"
                value={dateFrom}
                onChange={(event) => {
                  setDateFrom(event.target.value)
                  setPageIndex(0)
                }}
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(event) => {
                  setDateTo(event.target.value)
                  setPageIndex(0)
                }}
              />
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value)
                  setPageIndex(0)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subscribedAt">Subscribed Date</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="unsubscribedAt">Unsubscribed Date</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={sortOrder}
                onValueChange={(value) => {
                  setSortOrder(value)
                  setPageIndex(0)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest</SelectItem>
                  <SelectItem value="asc">Oldest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={resetFilters}>
                Clear Filters
              </Button>
            </div>
          )}

          {selectedCount > 0 && (
            <div className="mt-4 flex flex-col gap-3 rounded-lg bg-muted p-3 sm:flex-row sm:flex-wrap sm:items-center">
              <span className="text-sm font-medium">
                {selectedCount} subscriber{selectedCount === 1 ? '' : 's'} selected
              </span>
              <Button size="sm" onClick={openSendToSelected} className="w-full sm:w-auto">
                <Mail className="mr-2 h-4 w-4" />
                Send to Selected
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="w-full sm:w-auto">Bulk Actions</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleBulkAction('activate')}>
                    Activate Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction('deactivate')}>
                    Deactivate Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleBulkAction('delete')}
                    className="text-red-600"
                  >
                    Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscribers ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-16" />
              ))}
            </div>
          ) : subscribers.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={currentPageSelected}
                          onChange={toggleSelectAllCurrentPage}
                          aria-label="Select all subscribers on this page"
                        />
                      </TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Subscribed</TableHead>
                      <TableHead>Unsubscribed</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscribers.map((subscriber) => (
                      <TableRow key={subscriber._id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={Boolean(selectedIds[subscriber._id])}
                            onChange={() => toggleSelected(subscriber._id)}
                            aria-label={`Select ${subscriber.email}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{subscriber.email}</p>
                            <p className="text-sm text-muted-foreground">
                              ID: {subscriber._id.slice(0, 8)}...
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              statusColors[subscriber.isActive ? 'active' : 'inactive']
                            }
                          >
                            {subscriber.isActive ? 'Active' : 'Unsubscribed'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDateTime(subscriber.subscribedAt)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {subscriber.unsubscribedAt
                            ? formatDateTime(subscriber.unsubscribedAt)
                            : 'Still subscribed'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  handleSubscriberStatus(subscriber._id, !subscriber.isActive)
                                }
                              >
                                {subscriber.isActive ? (
                                  <>
                                    <UserX className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleSendWelcomeEmail(subscriber._id)}
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                Send Welcome Email
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openSendToSingle(subscriber)}
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                Send Campaign
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteSubscriber(subscriber._id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Subscriber
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {pageIndex + 1} of {totalPages}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageIndex(0)}
                    disabled={pageIndex === 0}
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageIndex((previous) => Math.max(0, previous - 1))}
                    disabled={pageIndex === 0}
                  >
                    Previous
                  </Button>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) => {
                      setPageSize(Number(value))
                      setPageIndex(0)
                    }}
                  >
                    <SelectTrigger className="w-full min-w-[110px] sm:w-[110px]">
                      <SelectValue placeholder="Rows" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 rows</SelectItem>
                      <SelectItem value="20">20 rows</SelectItem>
                      <SelectItem value="50">50 rows</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPageIndex((previous) => Math.min(totalPages - 1, previous + 1))
                    }
                    disabled={pageIndex >= totalPages - 1}
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageIndex(totalPages - 1)}
                    disabled={pageIndex >= totalPages - 1}
                  >
                    Last
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center">
              <Mail className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No subscribers found</h3>
              <p className="text-muted-foreground">
                {hasActiveFilters
                  ? 'Try adjusting your filters to see more results.'
                  : 'Newsletter signups will appear here once customers subscribe.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Campaign History</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchCampaigns}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {campaignsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-16" />
              ))}
            </div>
          ) : campaigns.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{campaign.subject}</p>
                          <p className="text-sm text-muted-foreground">
                            {campaign.createdByEmail || 'Admin'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={campaignStatusColors[campaign.status]}>
                          {campaign.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{campaign.targetMode}</div>
                        <div className="text-muted-foreground">
                          Requested {campaign.requestedCount}, active {campaign.activeRecipientCount}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>Sent {campaign.sentCount}</div>
                        <div className="text-muted-foreground">
                          Failed {campaign.failedCount}, skipped {campaign.skippedCount}
                        </div>
                        {(campaign.pendingCount > 0 || campaign.processingCount > 0) && (
                          <div className="text-muted-foreground">
                            Pending {campaign.pendingCount}, processing {campaign.processingCount}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{formatDateTime(campaign.createdAt)}</div>
                        <div className="text-muted-foreground">
                          {campaign.completedAt
                            ? `Finished ${formatDateTime(campaign.completedAt)}`
                            : 'In progress'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setCampaignDetailId(campaign._id)
                                setCampaignDetailOpen(true)
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {(campaign.status === 'queued' || campaign.status === 'processing') && (
                              <DropdownMenuItem onClick={() => handleResumeCampaign(campaign._id)}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Resume Processing
                              </DropdownMenuItem>
                            )}
                            {campaign.failedCount > 0 && (
                              <DropdownMenuItem onClick={() => handleResumeCampaign(campaign._id, true)}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Retry Failed Deliveries
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              No campaigns yet. Sent campaigns will appear here with live progress and delivery status.
            </div>
          )}
        </CardContent>
      </Card>

      <NewsletterCampaignDialog
        open={campaignDialogOpen}
        onOpenChange={setCampaignDialogOpen}
        target={campaignTarget}
        onSent={() => {
          fetchSubscribers()
          fetchCampaigns()
        }}
      />
      <NewsletterCampaignDetailDialog
        open={campaignDetailOpen}
        onOpenChange={setCampaignDetailOpen}
        campaignId={campaignDetailId}
      />
    </div>
  )
}
