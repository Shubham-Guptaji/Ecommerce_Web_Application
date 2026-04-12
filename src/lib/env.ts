// src/lib/env.ts
import { z } from 'zod'

const optionalString = z.string().trim().min(1).optional()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  MONGODB_URI: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default(''),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.string().min(1).transform(Number),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  SMTP_FROM: z.string().email(),
  REDIS_URL: optionalString,
  REDIS_HOST: optionalString,
  REDIS_PORT: z.coerce.number().int().positive().optional(),
  REDIS_USERNAME: optionalString,
  REDIS_PASSWORD: optionalString,
  REDIS_DB: z.coerce.number().int().min(0).optional(),
  REDIS_TLS: z
    .enum(['true', 'false', '1', '0'])
    .optional()
    .transform((value) => value === 'true' || value === '1'),
  REDIS_KEY_PREFIX: optionalString,
})

export const env = envSchema.parse(process.env)

// Optional Cloudinary upload preset for projects that want preset-based rules.
export const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET?.trim() || undefined
export const CLOUDINARY_UPLOAD_FOLDER = process.env.CLOUDINARY_UPLOAD_FOLDER?.trim() || 'ecommerce'
