// File path: src/lib/emails/orderStatusEmail.ts
import type { IOrder } from '@/types'

type OrderStatusEmailOrder = Pick<IOrder, 'orderNumber' | 'status' | 'trackingNumber' | 'courierName'>

export default function orderStatusEmailTemplate(order: OrderStatusEmailOrder, user: { name: string; email: string }): string {
  const trackingInfo = order.trackingNumber && order.courierName ? `
    <h3>Tracking Information</h3>
    <p><strong>Courier:</strong> ${order.courierName}</p>
    <p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
  ` : ''

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .container { background: #f9f9f9; padding: 30px; border-radius: 10px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; margin: -30px -30px 30px; }
    .status-box { background: #dcfce7; border: 2px solid #16a34a; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; }
    .status-text { font-size: 24px; font-weight: bold; color: #16a34a; }
    .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Update</h1>
    </div>
    <p>Hello ${user.name},</p>
    <p>Your order <strong>#${order.orderNumber}</strong> status has been updated:</p>

    <div class="status-box">
      <div class="status-text">${order.status.toUpperCase().replace('_', ' ')}</div>
    </div>

    ${trackingInfo}

    <p>You can track your order in your account dashboard.</p>

    <div class="footer">
      <p>© ${new Date().getFullYear()} E-Shop. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}
