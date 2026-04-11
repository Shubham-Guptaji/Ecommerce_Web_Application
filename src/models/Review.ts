import mongoose, { Schema, Document } from 'mongoose'
import Product from './Product'

export interface IReview {
  _id: string
  product: mongoose.Types.ObjectId
  user: mongoose.Types.ObjectId
  rating: number // 1-5
  title?: string
  body: string
  isVerifiedPurchase: boolean
  isApproved: boolean
  helpful: number
  createdAt: Date
  updatedAt: Date
}

const ReviewSchema = new Schema<IReview>({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  title: {
    type: String,
    trim: true,
    maxlength: 200,
  },
  body: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: false,
  },
  isApproved: {
    type: Boolean,
    default: true,
  },
  helpful: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})

// Compound index to ensure one review per user per product
ReviewSchema.index({ product: 1, user: 1 }, { unique: true })

// Post-save hook to update product ratings
ReviewSchema.post('save', async function (doc, next) {
  try {
    await Product.updateRatings(doc.product)
    next()
  } catch (error) {
    next(error as Error)
  }
})

export default mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema)
