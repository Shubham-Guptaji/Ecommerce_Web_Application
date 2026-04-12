// File path: src/lib/nodemailer.ts
import nodemailer from 'nodemailer'
import { env } from './env'

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  requireTLS: true,
})

// Verify connection in development
if (env.NODE_ENV !== 'production') {
  transporter.verify().then(() => {
    console.log('✅ Email service connected successfully')
  }).catch((error) => {
    console.error('❌ Email service connection failed:', error)
  })
}

/**
 * Send an email via the configured SMTP transporter
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  options?: {
    replyTo?: string
  }
): Promise<void> {
  await transporter.sendMail({
    from: {
      name: 'E-Shop',
      address: env.SMTP_FROM,
    },
    to,
    replyTo: options?.replyTo,
    subject,
    html,
  })
}
