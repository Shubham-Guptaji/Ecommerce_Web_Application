import mongoose, { Schema } from 'mongoose'
import Review from './Review'

export interface IProduct {
  _id: string
  name: string
  slug: string
  description: string
  shortDescription: string
  price: number
  discountedPrice?: number
  discountPercent: number
  images: Array<{
    url: string
    publicId: string
  }>
  image?: string // Virtual property for backward compatibility
  category: mongoose.Types.ObjectId
  tags: string[]
  stock: number
  sku: string
  ratings: {
    average: number
    count: number
  }
  isFeatured: boolean
  isActive: boolean
  specifications: Array<{
    key: string
    value: string
  }>
  reviewCount: number
  soldCount: number
  createdAt: Date
  updatedAt: Date
}

export interface ProductModel extends mongoose.Model<IProduct> {
  updateRatings(productId: string | mongoose.Types.ObjectId): Promise<void>
}

const ProductSchema = new Schema<IProduct, ProductModel>({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: 200,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  shortDescription: {
    type: String,
    required: true,
    maxlength: 300,
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0,
  },
  discountedPrice: {
    type: Number,
    min: 0,
  },
  discountPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  images: [{
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
  }],
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  stock: {
    type: Number,
    required: [true, 'Stock is required'],
    min: 0,
    default: 0,
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    count: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  specifications: [{
    key: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
    },
  }],
  reviewCount: {
    type: Number,
    default: 0,
  },
  soldCount: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})

// Virtual for backward compatibility: get first image as 'image'
ProductSchema.virtual('image').get(function(this: IProduct) {
  return this.images && this.images.length > 0 ? this.images[0].url : undefined
})

// Generate slug from name
ProductSchema.pre('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  // Calculate discount percent
  if (this.discountedPrice && this.discountedPrice < this.price) {
    this.discountPercent = Math.round(
      ((this.price - this.discountedPrice) / this.price) * 100
    )
  } else {
    this.discountPercent = 0
  }

  next()
})

// Index for better query performance
ProductSchema.index({ name: 'text', shortDescription: 'text', tags: 'text' })
ProductSchema.index({ category: 1, isActive: 1 })
ProductSchema.index({ price: 1 })
ProductSchema.index({ 'ratings.average': -1 })
ProductSchema.index({ soldCount: -1 })
ProductSchema.index({ isFeatured: 1, isActive: 1 })

// Static method to update ratings
ProductSchema.statics.updateRatings = async function (productId: string | mongoose.Types.ObjectId) {
  const result = await Review.aggregate([
    { $match: { product: productId, isApproved: true } },
    {
      $group: {
        _id: null,
        average: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ])

  const update: any = {}
  if (result.length > 0) {
    update.ratings = {
      average: Math.round(result[0].average * 10) / 10, // Round to 1 decimal
      count: result[0].count,
    }
    update.reviewCount = result[0].count
  } else {
    update.ratings = { average: 0, count: 0 }
    update.reviewCount = 0
  }

  await this.findByIdAndUpdate(productId, update)
}

const Product =
  (mongoose.models.Product as unknown as ProductModel) ||
  mongoose.model<IProduct, ProductModel>('Product', ProductSchema)

export default Product
