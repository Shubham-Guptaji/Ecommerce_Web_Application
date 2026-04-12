'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { parseApiResponse } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

export type NewsletterCampaignTarget = {
  mode: 'single' | 'selected' | 'all'
  ids: string[]
  label: string
  estimatedCount: number
}

type NewsletterCampaignDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: NewsletterCampaignTarget | null
  onSent?: () => void
}

const initialForm = {
  subject: '',
  body: '',
}

export function NewsletterCampaignDialog({
  open,
  onOpenChange,
  target,
  onSent,
}: NewsletterCampaignDialogProps) {
  const [subject, setSubject] = useState(initialForm.subject)
  const [body, setBody] = useState(initialForm.body)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!open) {
      setSubject(initialForm.subject)
      setBody(initialForm.body)
    }
  }, [open])

  const handleSend = async () => {
    if (!target) return

    if (!subject.trim()) {
      toast({
        title: 'Missing subject',
        description: 'Please enter a subject line before sending.',
        variant: 'destructive',
      })
      return
    }

    if (!body.trim()) {
      toast({
        title: 'Missing content',
        description: 'Please enter campaign content before sending.',
        variant: 'destructive',
      })
      return
    }

    setSending(true)

    try {
      const response = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: target.mode,
          ids: target.ids,
          subject,
          body,
        }),
      })

      const result = await parseApiResponse<{
        success?: boolean
        message?: string
        sentCount?: number
        skippedCount?: number
        failedCount?: number
      }>(response)

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to send campaign')
      }

      toast({
        title: 'Campaign sent',
        description:
          result.message ||
          `Campaign processed. Sent ${result.sentCount || 0}, skipped ${result.skippedCount || 0}, failed ${result.failedCount || 0}.`,
      })

      onOpenChange(false)
      onSent?.()
    } catch (error: any) {
      toast({
        title: 'Send failed',
        description: error.message || 'Failed to send campaign',
        variant: 'destructive',
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Newsletter Campaign</DialogTitle>
          <DialogDescription>
            Sending to {target?.label || 'newsletter recipients'}. Only active subscribers will receive this campaign.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
            Estimated recipients: <span className="font-medium text-foreground">{target?.estimatedCount || 0}</span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Subject</label>
            <Input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Spring launch, weekend offers, product update..."
              disabled={sending}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={`Write your newsletter here.\n\nPlain text works, and basic HTML like <p>, <strong>, <ul>, and <a> is supported.`}
              className="min-h-[220px]"
              disabled={sending}
            />
            <p className="text-xs text-muted-foreground">
              An unsubscribe link is added automatically to every email.
            </p>
          </div>
        </div>

        <DialogFooter showCloseButton>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? 'Sending...' : 'Send Campaign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
