// src/lib/razorpay.ts
import Razorpay from 'razorpay'
import crypto from 'crypto'
import { env } from './env'

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
})

export { razorpay }
// Razorpay class type is available via default import; no need to re-export

/**
 * Verify Razorpay payment signature
 * HMAC-SHA256 of (orderId + "|" + paymentId) using key_secret
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')

  // Use timingSafeEqual to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  )
}
