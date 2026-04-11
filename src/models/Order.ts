import mongoose, { Schema, Document } from 'mongoose'
import Counter from './Counter'

export interface IOrder {
  _id: string
  orderNumber: string
  user: mongoose.Types.ObjectId
  items: Array<{
    product: mongoose.Types.ObjectId
    name: string
    image?: string
    price: number
    discountedPrice?: number
    quantity: number
    subtotal: number
  }>
  shippingAddress: {
    fullName: string
    phone: string
    line1: string
    line2?: string
    city: string
    state: string
    pincode: string
    country: string
  }
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' |
         'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded'
  statusHistory: Array<{
    status: string
    timestamp: Date
    note?: string
  }>
  paymentInfo: {
    razorpayOrderId?: string
    razorpayPaymentId?: string
    razorpaySignature?: string
    method: 'razorpay' | 'cod'
    status: 'pending' | 'paid' | 'failed' | 'refunded'
  }
  pricing: {
    subtotal: number
    discount: number
    couponDiscount?: number
    deliveryCharge: number
    tax: number
    total: number
  }
  coupon?: mongoose.Types.ObjectId
  adminNote?: string
  notes?: string
  expectedDelivery: Date
  trackingNumber?: string
  courierName?: string
  refundReason?: string
  refundAmount?: number
  refundStatus?: 'pending' | 'processed' | 'failed'
  createdAt: Date
  updatedAt: Date
}

const OrderSchema = new Schema<IOrder>({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  items: [{
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: String,
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discountedPrice: Number,
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  }],
  shippingAddress: {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    line1: {
      type: String,
      required: true,
      trim: true,
    },
    line2: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
      default: 'India',
    },
  },
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'refunded',
    ],
    default: 'pending',
    required: true,
  },
  statusHistory: [{
    status: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
    note: String,
  }],
  paymentInfo: {
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    method: {
      type: String,
      enum: ['razorpay', 'cod'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      required: true,
    },
  },
  pricing: {
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    couponDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliveryCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  coupon: {
    type: Schema.Types.ObjectId,
    ref: 'Coupon',
  },
  adminNote: String,
  notes: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
  expectedDelivery: {
    type: Date,
    required: true,
  },
  trackingNumber: String,
  courierName: String,
  refundReason: String,
  refundAmount: Number,
  refundStatus: {
    type: String,
    enum: ['pending', 'processed', 'failed'],
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})

// Generate sequential order number using Counter
OrderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { _id: 'order' },
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
      )
      this.orderNumber = `ORD-${String(counter.seq).padStart(6, '0')}`
    } catch (error) {
      // Fallback to timestamp-based if counter fails
      const timestamp = Date.now().toString(36).toUpperCase()
      const random = Math.random().toString(36).substring(2, 6).toUpperCase()
      this.orderNumber = `ORD-${timestamp}-${random}`
    }
  }

  // Initialize status history if empty
  if (!this.statusHistory || this.statusHistory.length === 0) {
    this.statusHistory = [{
      status: this.status,
      timestamp: new Date(),
      note: 'Order created',
    }]
  }

  // If status changed, add to history
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      note: this.adminNote || `${this.status} status updated`,
    })
  }

  next()
})

// Update status with history
OrderSchema.methods.updateStatus = function (
  status: IOrder['status'],
  note?: string
) {
  this.status = status
  this.statusHistory.push({
    status,
    timestamp: new Date(),
    note,
  })
  return this.save()
}

// Indexes
OrderSchema.index({ user: 1, createdAt: -1 })
OrderSchema.index({ status: 1, createdAt: -1 })
// orderNumber already has unique: true index
OrderSchema.index({ createdAt: -1 })

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema)
