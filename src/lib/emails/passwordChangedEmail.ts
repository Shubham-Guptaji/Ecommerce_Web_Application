// File path: src/lib/emails/passwordChangedEmail.ts
export default function passwordChangedEmailTemplate(name: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .container { background: #f9f9f9; padding: 30px; border-radius: 10px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; margin: -30px -30px 30px; }
    .warning { background: #fef3c7; padding: 15px; border-radius: 5px; border-left: 4px solid #f59e0b; margin: 20px 0; }
    .footer { margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Changed</h1>
    </div>
    <p>Hello ${name},</p>
    <p>Your password was successfully changed.</p>
    <div class="warning">
      <p><strong>⚠️ Security Alert:</strong></p>
      <p>If you did not change your password, please contact support immediately or reset your password again.</p>
    </div>
    <p>You can <a href="${process.env.NEXTAUTH_URL}/sign-in">log in here</a> with your new password.</p>
    <div class="footer">
      <p>© ${new Date().getFullYear()} E-Shop. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}
