// File path: src/lib/emails/index.ts
import { sendEmail } from '@/lib/nodemailer'
import verificationEmailTemplate from './verificationEmail'
import welcomeEmailTemplate from './welcomeEmail'
import passwordResetEmailTemplate from './passwordResetEmail'
import passwordChangedEmailTemplate from './passwordChangedEmail'
import orderConfirmationEmailTemplate from './orderConfirmationEmail'
import orderStatusEmailTemplate from './orderStatusEmail'
import newsletterWelcomeEmailTemplate from './newsletterWelcomeEmail'
import type { IOrder } from '@/models/Order'
import { getSiteUrl } from '@/lib/site-url'

type OrderStatusEmailOrder = Pick<IOrder, 'orderNumber' | 'status' | 'trackingNumber' | 'courierName'>

/**
 * Send email verification to a user
 */
export function sendVerificationEmail(user: { name: string; email: string }, rawToken: string): void {
  const verifyUrl = `${getSiteUrl()}/verify-email/${rawToken}`
  const html = verificationEmailTemplate(user.name, verifyUrl)

  sendEmail(user.email, 'Verify your email address', html).catch((err) =>
    console.error('Failed to send verification email:', err)
  )
}

/**
 * Send welcome email after email verification
 */
export function sendWelcomeEmail(user: { name: string; email: string }): void {
  const html = welcomeEmailTemplate(user.name)

  sendEmail(user.email, 'Welcome to E-Shop!', html).catch((err) =>
    console.error('Failed to send welcome email:', err)
  )
}

/**
 * Send password reset email
 */
export function sendPasswordResetEmail(user: { name: string; email: string }, rawToken: string): void {
  const resetUrl = `${getSiteUrl()}/reset-password/${rawToken}`
  const html = passwordResetEmailTemplate(user.name, resetUrl)

  sendEmail(user.email, 'Reset your password', html).catch((err) =>
    console.error('Failed to send password reset email:', err)
  )
}

/**
 * Send password changed confirmation email
 */
export function sendPasswordChangedEmail(user: { name: string; email: string }): void {
  const html = passwordChangedEmailTemplate(user.name)

  sendEmail(user.email, 'Password Changed Successfully', html).catch((err) =>
    console.error('Failed to send password changed email:', err)
  )
}

/**
 * Send order confirmation email
 */
export function sendOrderConfirmationEmail(order: IOrder, user: { name: string; email: string }): void {
  const html = orderConfirmationEmailTemplate(order, user)

  sendEmail(user.email, `Order Confirmation - #${order.orderNumber}`, html).catch((err) =>
    console.error('Failed to send order confirmation email:', err)
  )
}

/**
 * Send order status update email
 */
export function sendOrderStatusEmail(order: OrderStatusEmailOrder, user: { name: string; email: string }): void {
  const html = orderStatusEmailTemplate(order, user)

  sendEmail(
    user.email,
    `Order #${order.orderNumber} - Status Update: ${order.status}`,
    html
  ).catch((err) => console.error('Failed to send order status email:', err))
}

/**
 * Send newsletter welcome email
 */
export async function sendNewsletterWelcomeEmail(email: string, unsubscribeLink: string): Promise<void> {
  const html = newsletterWelcomeEmailTemplate(email, unsubscribeLink)
  await sendEmail(email, 'Welcome to Our Newsletter!', html)
}
