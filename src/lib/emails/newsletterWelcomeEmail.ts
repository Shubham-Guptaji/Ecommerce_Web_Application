// File path: src/lib/emails/newsletterWelcomeEmail.ts
import { getSiteUrl } from '@/lib/site-url'

export default function newsletterWelcomeEmailTemplate(email: string, unsubscribeLink: string): string {
  const siteUrl = getSiteUrl()

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .container { background: #f9f9f9; padding: 30px; border-radius: 10px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; margin: -30px -30px 30px; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Our Newsletter!</h1>
    </div>
    <p>Hello,</p>
    <p>Thank you for subscribing to our newsletter with email: <strong>${email}</strong>.</p>
    <p>You'll be the first to know about:</p>
    <ul>
      <li>New product arrivals</li>
      <li>Exclusive deals and discounts</li>
      <li>Seasonal promotions</li>
      <li>Latest trends and updates</li>
    </ul>
    <p>Stay tuned for amazing updates coming your way!</p>
    <a href="${siteUrl}" class="button">Visit Store</a>
    <div class="footer">
      <p>© ${new Date().getFullYear()} E-Shop. All rights reserved.</p>
      <p><a href="${unsubscribeLink}">Unsubscribe</a> from our newsletter anytime.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}
