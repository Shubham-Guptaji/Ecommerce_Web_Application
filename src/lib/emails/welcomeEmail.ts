// File path: src/lib/emails/welcomeEmail.ts
import { getSiteUrl } from '@/lib/site-url'

export default function welcomeEmailTemplate(name: string): string {
  const loginUrl = `${getSiteUrl()}/sign-in`

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .container { background: #f9f9f9; padding: 30px; border-radius: 10px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; margin: -30px -30px 30px; }
    .footer { margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to E-Shop!</h1>
    </div>
    <p>Hello ${name},</p>
    <p>Your email has been successfully verified! You can now log in and start shopping.</p>
    <p><a href="${loginUrl}" class="button">Log In</a></p>
    <div class="footer">
      <p>© ${new Date().getFullYear()} E-Shop. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}
