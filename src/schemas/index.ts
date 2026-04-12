import { z } from 'zod'

// Auth schemas
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const contactSchema = z.object({
  firstName: z.string().trim().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().trim().min(2, 'Last name must be at least 2 characters'),
  email: z.string().trim().email('Invalid email address'),
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters').max(120, 'Subject is too long'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(2000, 'Message is too long'),
})

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string(),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const updateProfileSchema = z.object({
  name: z.string().optional(),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits').optional(),
})

// Product schemas
export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().min(1, 'Description is required'),
  shortDescription: z.string().min(1, 'Short description is required'),
  price: z.number().positive('Price must be positive'),
  discountedPrice: z.number().positive().optional().nullable(),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).optional().default([]),
  stock: z.number().int().min(0, 'Stock must be non-negative'),
  sku: z.string().min(1, 'SKU is required'),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  specifications: z.array(
    z.object({
      key: z.string().min(1),
      value: z.string().min(1),
    })
  ).optional().default([]),
})

// Address schemas
export const addressSchema = z.object({
  label: z.enum(['Home', 'Work', 'Other']),
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().min(10, 'Phone number is required'),
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  country: z.string().min(1, 'Country is required').default('India'),
  isDefault: z.boolean().default(false),
})

// Checkout schema
export const checkoutSchema = z.object({
    addressId: z.string().min(1, 'Please select a delivery address'),
  deliveryMethod: z.enum(['standard', 'express']),
  notes: z.string().optional(),
  couponCode: z.string().optional().nullable(),
})

// Coupon schema
export const couponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
})

// Coupon validation schema (for applying coupons)
export const couponValidateSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
  orderTotal: z.number().positive('Order total must be positive'),
})

// Review schema
export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().max(200).optional(),
  body: z.string().min(1, 'Review text is required').max(1000),
})

// Admin schemas
export const createCouponSchema = z.object({
  code: z.string().min(1),
  type: z.enum(['flat', 'percentage']),
  value: z.number().positive(),
  minOrderValue: z.number().min(0).default(0),
  maxDiscount: z.number().positive().optional().nullable(),
  usageLimit: z.number().int().positive(),
  expiresAt: z.string().datetime(),
  isActive: z.boolean().default(true),
})

export const updateUserSchema = z.object({
  role: z.enum(['user', 'admin']).optional(),
  isActive: z.boolean().optional(),
})

// Category schema
export const categorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  parent: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
})

// Payment verification schema
export const paymentVerifySchema = z.object({
  orderId: z.string().optional(),
  razorpayOrderId: z.string().min(1, 'Razorpay order ID is required'),
  razorpayPaymentId: z.string().min(1, 'Razorpay payment ID is required'),
  razorpaySignature: z.string().min(1, 'Razorpay signature is required'),
})

// Cart schema
export const cartSchema = z.object({
  items: z.array(
    z.object({
      product: z.string().min(1, 'Product ID is required'),
      name: z.string().min(1, 'Product name is required'),
      image: z.string().optional().nullable(),
      price: z.number(),
      discountedPrice: z.number().optional().nullable(),
      quantity: z.number().int().positive('Quantity must be positive'),
    })
  ).min(1, 'At least one item is required'),
  coupon: z.string().optional().nullable(),
})
