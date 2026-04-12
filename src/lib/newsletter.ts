import type { FilterQuery } from 'mongoose'
import NewsletterSubscriber, { type INewsletterSubscriber } from '@/models/NewsletterSubscriber'
import { getSiteUrl } from '@/lib/site-url'
import { sanitizeBasicHtml, stripHtml } from '@/lib/sanitize'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100
const RECENT_WINDOW_DAYS = 30

export type NewsletterStatusFilter = 'all' | 'active' | 'inactive'
export type NewsletterSortBy = 'subscribedAt' | 'email' | 'unsubscribedAt'
export type NewsletterSortOrder = 'asc' | 'desc'

export type NewsletterAdminFilters = {
  page: number
  limit: number
  search: string
  status: NewsletterStatusFilter
  sortBy: NewsletterSortBy
  sortOrder: NewsletterSortOrder
  dateFrom?: string
  dateTo?: string
}

const parsePositiveInt = (value: string | null, fallback: number) => {
  const parsed = Number.parseInt(value || '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function parseNewsletterAdminFilters(searchParams: URLSearchParams): NewsletterAdminFilters {
  const rawStatus = searchParams.get('status')
  const rawSortBy = searchParams.get('sortBy')
  const rawSortOrder = searchParams.get('sortOrder')

  const status: NewsletterStatusFilter =
    rawStatus === 'active' || rawStatus === 'inactive' ? rawStatus : 'all'

  const sortBy: NewsletterSortBy =
    rawSortBy === 'email' || rawSortBy === 'unsubscribedAt' ? rawSortBy : 'subscribedAt'

  const sortOrder: NewsletterSortOrder = rawSortOrder === 'asc' ? 'asc' : 'desc'

  return {
    page: parsePositiveInt(searchParams.get('page'), DEFAULT_PAGE),
    limit: Math.min(parsePositiveInt(searchParams.get('limit'), DEFAULT_LIMIT), MAX_LIMIT),
    search: (searchParams.get('search') || '').trim(),
    status,
    sortBy,
    sortOrder,
    dateFrom: searchParams.get('dateFrom') || undefined,
    dateTo: searchParams.get('dateTo') || undefined,
  }
}

export function buildNewsletterAdminQuery(
  filters: Pick<NewsletterAdminFilters, 'search' | 'status' | 'dateFrom' | 'dateTo'>
): FilterQuery<INewsletterSubscriber> {
  const query: FilterQuery<INewsletterSubscriber> = {}

  if (filters.search) {
    query.email = { $regex: escapeRegex(filters.search), $options: 'i' }
  }

  if (filters.status === 'active') {
    query.isActive = true
  } else if (filters.status === 'inactive') {
    query.isActive = false
  }

  if (filters.dateFrom || filters.dateTo) {
    query.subscribedAt = {}

    if (filters.dateFrom) {
      query.subscribedAt.$gte = new Date(filters.dateFrom)
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999)
      query.subscribedAt.$lte = toDate
    }
  }

  return query
}

export function buildNewsletterAdminSort(
  filters: Pick<NewsletterAdminFilters, 'sortBy' | 'sortOrder'>
): Record<string, 1 | -1> {
  const direction: 1 | -1 = filters.sortOrder === 'asc' ? 1 : -1

  if (filters.sortBy === 'email') {
    return { email: direction }
  }

  if (filters.sortBy === 'unsubscribedAt') {
    return { unsubscribedAt: direction, subscribedAt: -1 }
  }

  return { subscribedAt: direction }
}

export async function getNewsletterAdminSummary() {
  const since = new Date()
  since.setDate(since.getDate() - RECENT_WINDOW_DAYS)

  const [totalSubscribers, activeSubscribers, inactiveSubscribers, recentSubscribers] =
    await Promise.all([
      NewsletterSubscriber.countDocuments({}),
      NewsletterSubscriber.countDocuments({ isActive: true }),
      NewsletterSubscriber.countDocuments({ isActive: false }),
      NewsletterSubscriber.countDocuments({ subscribedAt: { $gte: since } }),
    ])

  return {
    totalSubscribers,
    activeSubscribers,
    inactiveSubscribers,
    recentSubscribers,
  }
}

export function buildNewsletterUnsubscribeLink(email: string, unsubscribeToken: string) {
  return `${getSiteUrl()}/api/newsletter/unsubscribe?token=${unsubscribeToken}&email=${encodeURIComponent(email)}`
}

export function csvEscape(value: unknown) {
  const normalized = value == null ? '' : String(value)
  return `"${normalized.replace(/"/g, '""')}"`
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function normalizeNewsletterCampaignBody(body: string) {
  const trimmed = body.trim()
  if (!trimmed) return ''

  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(trimmed)

  if (looksLikeHtml) {
    return sanitizeBasicHtml(trimmed)
  }

  const html = trimmed
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('')

  return sanitizeBasicHtml(html)
}

export function buildNewsletterCampaignEmail({
  subject,
  body,
  unsubscribeLink,
  storeName,
}: {
  subject: string
  body: string
  unsubscribeLink: string
  storeName: string
}) {
  const siteUrl = getSiteUrl()
  const sanitizedBody = normalizeNewsletterCampaignBody(body)
  const previewText = stripHtml(sanitizedBody).slice(0, 160)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${escapeHtml(previewText)}
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;background:#f3f4f6;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;">
          <tr>
            <td style="padding:24px 28px;background:#111827;color:#ffffff;">
              <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.8;">${escapeHtml(storeName)}</div>
              <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;">${escapeHtml(subject)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <div style="font-size:15px;line-height:1.7;color:#1f2937;">
                ${sanitizedBody}
              </div>
              <div style="margin-top:28px;">
                <a href="${siteUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:600;">
                  Visit ${escapeHtml(storeName)}
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;line-height:1.6;color:#6b7280;">
              <p style="margin:0 0 8px;">You are receiving this email because you subscribed to updates from ${escapeHtml(storeName)}.</p>
              <p style="margin:0;">
                <a href="${unsubscribeLink}" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>
                if you no longer want these emails.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
