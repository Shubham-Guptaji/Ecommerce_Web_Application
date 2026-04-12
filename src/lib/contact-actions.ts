'use server'

import { headers } from 'next/headers'
import ContactMessage from '@/models/ContactMessage'
import { contactSchema } from '@/schemas'
import { dbConnect } from '@/lib/db'
import { env } from '@/lib/env'
import { sendEmail } from '@/lib/nodemailer'
import { checkRateLimit, contactRateLimiter, getClientIp } from '@/lib/ratelimit'
import { getStoreSettings } from '@/lib/settings'
import type { ContactFormState } from '@/lib/contact-form-state'

const formatResetTime = (resetTime: number) => {
  if (!resetTime) return 'Please try again later.'

  const minutes = Math.max(1, Math.ceil((resetTime - Date.now()) / 60000))
  return `Please wait about ${minutes} minute${minutes === 1 ? '' : 's'} before trying again.`
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export async function submitContactForm(
  _previousState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const parsed = contactSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    subject: formData.get('subject'),
    message: formData.get('message'),
  })

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Please fix the highlighted fields and try again.',
      fieldErrors: parsed.error.flatten().fieldErrors,
      submittedAt: Date.now(),
    }
  }

  const headerStore = await headers()
  const clientIp = getClientIp(headerStore)
  const { limited, resetTime } = await checkRateLimit(
    contactRateLimiter,
    `${clientIp}:${parsed.data.email.toLowerCase()}`
  )

  if (limited) {
    return {
      status: 'error',
      message: `Too many messages sent from this address. ${formatResetTime(resetTime)}`,
      submittedAt: Date.now(),
    }
  }

  const settings = await getStoreSettings()
  const storeName = settings?.storeName || 'E-Shop'
  const recipientEmail = settings?.storeEmail || env.SMTP_FROM
  const fullName = `${parsed.data.firstName} ${parsed.data.lastName}`.trim()
  const userAgent = headerStore.get('user-agent') || undefined

  await dbConnect()

  const savedMessage = await ContactMessage.create({
    ...parsed.data,
    email: parsed.data.email.toLowerCase(),
    fullName,
    ipAddress: clientIp,
    userAgent,
  })

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:640px;margin:0 auto;padding:24px">
      <h1 style="font-size:24px;margin:0 0 16px">New contact form message</h1>
      <p style="margin:0 0 24px">A visitor sent a message from the ${escapeHtml(storeName)} contact page.</p>
      <div style="border:1px solid #e5e7eb;border-radius:12px;padding:20px;background:#f9fafb">
        <p style="margin:0 0 8px"><strong>Name:</strong> ${escapeHtml(fullName)}</p>
        <p style="margin:0 0 8px"><strong>Email:</strong> ${escapeHtml(parsed.data.email)}</p>
        <p style="margin:0 0 8px"><strong>Subject:</strong> ${escapeHtml(parsed.data.subject)}</p>
        <p style="margin:16px 0 8px"><strong>Message:</strong></p>
        <p style="margin:0;white-space:pre-wrap">${escapeHtml(parsed.data.message)}</p>
      </div>
    </div>
  `

  try {
    await sendEmail(
      recipientEmail,
      `[Contact] ${parsed.data.subject}`,
      html,
      { replyTo: parsed.data.email }
    )

    savedMessage.emailSent = true
    await savedMessage.save()

    return {
      status: 'success',
      message: 'Message sent successfully. We will get back to you soon.',
      submittedAt: Date.now(),
    }
  } catch (error) {
    console.error('Contact form submission failed:', error)

    return {
      status: 'error',
      message: 'We could not send your message right now. Please try again shortly.',
      submittedAt: Date.now(),
    }
  }
}
