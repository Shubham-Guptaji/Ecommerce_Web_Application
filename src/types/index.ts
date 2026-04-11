// src/types/index.ts
import type { IUser } from '@/models/User'
import type { IProduct } from '@/models/Product'
import type { ICategory } from '@/models/Category'
import type { IOrder } from '@/models/Order'
import type { ICart } from '@/models/Cart'
import type { IAddress } from '@/models/Address'
import type { ICoupon } from '@/models/Coupon'
import type { IReview } from '@/models/Review'

import mongoose from 'mongoose'

export type { IUser, IProduct, ICategory, IOrder, ICart, IAddress, ICoupon, IReview }

export interface CartItem {
  product: string | mongoose.Types.ObjectId
  name: string
  image?: string
  price: number
  discountedPrice?: number
  quantity: number
  addedAt?: Date
}

export interface OrderItem {
  product: mongoose.Types.ObjectId
  name: string
  image?: string
  price: number
  discountedPrice?: number
  quantity: number
  subtotal: number
}

export interface ShippingAddress {
  fullName: string
  phone: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  country: string
}

export interface PaymentInfo {
  razorpayOrderId?: string
  razorpayPaymentId?: string
  razorpaySignature?: string
  method: 'razorpay' | 'cod'
  status: 'pending' | 'paid' | 'failed' | 'refunded'
}

export interface Pricing {
  subtotal: number
  discount: number
  couponDiscount?: number
  deliveryCharge: number
  tax: number
  total: number
}

export interface CouponDiscount {
  code: string
  type: 'flat' | 'percentage'
  value: number
  discountAmount: number
}

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
