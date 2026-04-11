// File path: src/lib/emails/orderConfirmationEmail.ts
import type { IOrder } from '@/types'

export default function orderConfirmationEmailTemplate(order: IOrder, user: { name: string; email: string }): string {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">$${item.price.toFixed(2)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `
    )
    .join('')

  const deliveryDate = new Date(order.expectedDelivery).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  const subtotal = order.pricing.subtotal
  const discount = order.pricing.discount + (order.pricing.couponDiscount || 0)
  const deliveryCharge = order.pricing.deliveryCharge
  const tax = order.pricing.tax
  const total = order.pricing.total

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .container { background: #f9f9f9; padding: 30px; border-radius: 10px; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; margin: -30px -30px 30px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f1f5f9; padding: 12px; text-align: left; }
    td { padding: 12px; border-bottom: 1px solid #eee; }
    .total-row { font-weight: bold; background: #f1f5f9; }
    .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Confirmed!</h1>
      <p>Order #${order.orderNumber}</p>
    </div>
    <p>Hello ${user.name},</p>
    <p>Thank you for your order! Here are the details:</p>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Price</th>
          <th>Qty</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot>
        <tr class="total-row">
          <td colspan="3">Subtotal</td>
          <td>$${subtotal.toFixed(2)}</td>
        </tr>
        ${discount > 0 ? `
          <tr class="total-row">
            <td colspan="3">Discount</td>
            <td>-$${discount.toFixed(2)}</td>
          </tr>
        ` : ''}
        <tr class="total-row">
          <td colspan="3">Delivery</td>
          <td>$${deliveryCharge.toFixed(2)}</td>
        </tr>
        <tr class="total-row">
          <td colspan="3">Tax (GST)</td>
          <td>$${tax.toFixed(2)}</td>
        </tr>
        <tr class="total-row">
          <td colspan="3"><strong>Total</strong></td>
          <td><strong>$${total.toFixed(2)}</strong></td>
        </tr>
      </tfoot>
    </table>

    <h3>Shipping Address</h3>
    <p>
      ${order.shippingAddress.fullName}<br>
      ${order.shippingAddress.line1}<br>
      ${order.shippingAddress.line2 || ''}<br>
      ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.pincode}<br>
      ${order.shippingAddress.country}<br>
      Phone: ${order.shippingAddress.phone}
    </p>

    <p><strong>Expected Delivery:</strong> ${deliveryDate}</p>

    <p>You will receive updates about your order status via email.</p>

    <div class="footer">
      <p>© ${new Date().getFullYear()} E-Shop. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim()
}
