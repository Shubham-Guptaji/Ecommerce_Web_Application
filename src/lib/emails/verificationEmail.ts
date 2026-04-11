// File path: src/lib/emails/verificationEmail.ts
export default function verificationEmailTemplate(name: string, verifyUrl: string): string {
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
      <h1>Welcome to E-Shop!</h1>
    </div>
    <p>Hello ${name},</p>
    <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
    <a href="${verifyUrl}" class="button">Verify Email Address</a>
    <p>Or copy and paste this link in your browser:</p>
    <p>${verifyUrl}</p>
    <p><strong>This link will expire in 24 hours.</strong></p>
    <p>If you didn't create an account, you can safely ignore this email.</p>
    <div class="footer">
      <p>© ${new Date().getFullYear()} E-Shop. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}
