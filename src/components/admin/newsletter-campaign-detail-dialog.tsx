'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/shared/skeleton'
import { parseApiResponse, formatDateTime } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

type CampaignDetail = {
  _id: string
  subject: string
  status: string
  targetMode: string
  requestedCount: number
  activeRecipientCount: number
  sentCount: number
  failedCount: number
  skippedCount: number
  pendingCount: number
  processingCount: number
  createdByName?: string
  createdByEmail?: string
  createdAt: string
  startedAt?: string
  completedAt?: string
  lastProcessedAt?: string
  lastError?: string
}

type CampaignDelivery = {
  _id: string
  email: string
  status: string
  attempts: number
  sentAt?: string
  errorMessage?: string
  updatedAt: string
}

type CampaignDetailDialogProps = {
  campaignId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const statusClasses: Record<string, string> = {
  queued: 'bg-slate-100 text-slate-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  completed_with_errors: 'bg-amber-100 text-amber-800',
  failed: 'bg-red-100 text-red-800',
  pending: 'bg-slate-100 text-slate-800',
  sent: 'bg-green-100 text-green-800',
  skipped: 'bg-gray-100 text-gray-800',
  failed_delivery: 'bg-red-100 text-red-800',
}

export function NewsletterCampaignDetailDialog({
  campaignId,
  open,
  onOpenChange,
}: CampaignDetailDialogProps) {
  const [loading, setLoading] = useState(false)
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null)
  const [deliveries, setDeliveries] = useState<CampaignDelivery[]>([])

  useEffect(() => {
    if (!open || !campaignId) return

    const fetchCampaign = async () => {
      setLoading(true)

      try {
        const response = await fetch(`/api/admin/newsletter/campaigns/${campaignId}`)
        const result = await parseApiResponse<{
          success?: boolean
          message?: string
          data?: {
            campaign: CampaignDetail
            deliveries: CampaignDelivery[]
          }
        }>(response)

        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.message || 'Failed to fetch campaign details')
        }

        setCampaign(result.data.campaign)
        setDeliveries(result.data.deliveries)
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to fetch campaign details',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCampaign()
  }, [campaignId, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Campaign Details</DialogTitle>
          <DialogDescription>
            Review campaign progress and the latest delivery attempts.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-64" />
          </div>
        ) : campaign ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Status</div>
                <div className="mt-2">
                  <Badge className={statusClasses[campaign.status] || 'bg-slate-100 text-slate-800'}>
                    {campaign.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Subject</div>
                <div className="mt-2 font-medium">{campaign.subject}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Audience</div>
                <div className="mt-2 font-medium">{campaign.targetMode}</div>
                <div className="text-sm text-muted-foreground">
                  Requested {campaign.requestedCount}, active {campaign.activeRecipientCount}
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Created</div>
                <div className="mt-2 font-medium">{formatDateTime(campaign.createdAt)}</div>
                <div className="text-sm text-muted-foreground">
                  {campaign.createdByEmail || campaign.createdByName || 'Admin'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              <div className="rounded-lg border bg-green-50 p-4 text-sm">
                <div className="text-muted-foreground">Sent</div>
                <div className="mt-1 text-2xl font-semibold">{campaign.sentCount}</div>
              </div>
              <div className="rounded-lg border bg-red-50 p-4 text-sm">
                <div className="text-muted-foreground">Failed</div>
                <div className="mt-1 text-2xl font-semibold">{campaign.failedCount}</div>
              </div>
              <div className="rounded-lg border bg-gray-50 p-4 text-sm">
                <div className="text-muted-foreground">Skipped</div>
                <div className="mt-1 text-2xl font-semibold">{campaign.skippedCount}</div>
              </div>
              <div className="rounded-lg border bg-slate-50 p-4 text-sm">
                <div className="text-muted-foreground">Pending</div>
                <div className="mt-1 text-2xl font-semibold">{campaign.pendingCount}</div>
              </div>
              <div className="rounded-lg border bg-blue-50 p-4 text-sm">
                <div className="text-muted-foreground">Processing</div>
                <div className="mt-1 text-2xl font-semibold">{campaign.processingCount}</div>
              </div>
            </div>

            {campaign.lastError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {campaign.lastError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <h3 className="font-medium">Latest deliveries</h3>
                <p className="text-sm text-muted-foreground">
                  Showing the 50 most recently updated recipient deliveries.
                </p>
              </div>
              <div className="max-h-[360px] overflow-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-medium">Email</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Attempts</th>
                      <th className="px-4 py-3 text-left font-medium">Updated</th>
                      <th className="px-4 py-3 text-left font-medium">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map((delivery) => (
                      <tr key={delivery._id} className="border-b last:border-0">
                        <td className="px-4 py-3">{delivery.email}</td>
                        <td className="px-4 py-3">
                          <Badge
                            className={
                              statusClasses[
                                delivery.status === 'failed' ? 'failed_delivery' : delivery.status
                              ] || 'bg-slate-100 text-slate-800'
                            }
                          >
                            {delivery.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">{delivery.attempts}</td>
                        <td className="px-4 py-3">{formatDateTime(delivery.updatedAt)}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {delivery.errorMessage || 'None'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            Campaign details are unavailable.
          </div>
        )}

        <DialogFooter showCloseButton>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
