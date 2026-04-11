import mongoose, { Schema, Document } from 'mongoose'

export interface ICoupon {
  _id: string
  code: string
  type: 'flat' | 'percentage'
  value: number
  minOrderValue: number
  maxDiscount?: number
  usageLimit: number
  usedCount: number
  usedBy: mongoose.Types.ObjectId[]
  expiresAt: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  isValid(): Promise<boolean>
}

const CouponSchema = new Schema<ICoupon>({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['flat', 'percentage'],
    required: true,
  },
  value: {
    type: Number,
    required: true,
    min: 0,
  },
  minOrderValue: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  maxDiscount: {
    type: Number,
    min: 0,
  },
  usageLimit: {
    type: Number,
    required: true,
    min: 1,
  },
  usedCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  usedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  expiresAt: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})

// Convert code to uppercase
CouponSchema.pre('save', function (next) {
  if (this.code) {
    this.code = this.code.toUpperCase().trim()
  }
  next()
})

// Check if coupon is valid
CouponSchema.methods.isValid = async function (userId?: mongoose.Types.ObjectId): Promise<boolean> {
  const now = new Date()

  // Check if active
  if (!this.isActive) return false

  // Check expiry
  if (this.expiresAt < now) return false

  // Check usage limit
  if (this.usedCount >= this.usageLimit) return false

  // Check if user already used (if userId provided)
  if (userId && this.usedBy.some((id: mongoose.Types.ObjectId) => id.toString() === userId.toString())) {
    return false
  }

  return true
}

// Calculate discount amount
CouponSchema.methods.calculateDiscount = function (subtotal: number): number {
  if (subtotal < this.minOrderValue) {
    return 0
  }

  let discount = 0

  if (this.type === 'flat') {
    discount = this.value
  } else if (this.type === 'percentage') {
    discount = (subtotal * this.value) / 100
  }

  // Apply max discount limit if set
  if (this.maxDiscount && discount > this.maxDiscount) {
    discount = this.maxDiscount
  }

  return Math.round(discount)
}

export default mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema)
