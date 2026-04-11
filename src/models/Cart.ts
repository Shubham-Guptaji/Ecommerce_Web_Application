import mongoose, { Schema, Document } from 'mongoose'
import type { CartItem } from '@/types'

export interface ICart {
  _id: string
  user: mongoose.Types.ObjectId
  items: Array<{
    product: mongoose.Types.ObjectId
    name: string
    image?: string
    price: number
    discountedPrice?: number
    quantity: number
    addedAt: Date
  }>
  coupon?: {
    code: string
    discount: number
  }
  updatedAt: Date
  getSubtotal(): number
  getTotalItems(): number
}

const CartSchema = new Schema<ICart>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
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
      default: 1,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  coupon: {
    code: String,
    discount: Number,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})

// Calculate subtotal
CartSchema.methods.getSubtotal = function (): number {
  return this.items.reduce((total: number, item: CartItem) => {
    const price = item.discountedPrice || item.price
    return total + (price * item.quantity)
  }, 0)
}

// Get total items count
CartSchema.methods.getTotalItems = function (): number {
  return this.items.reduce((total: number, item: CartItem) => total + item.quantity, 0)
}

// Update item quantity
CartSchema.methods.updateQuantity = async function (
  productId: mongoose.Types.ObjectId,
  quantity: number
) {
  const item = this.items.find(
    (item: CartItem) => item.product.toString() === productId.toString()
  )

  if (item) {
    if (quantity <= 0) {
      this.items = this.items.filter(
        (item: CartItem) => item.product.toString() !== productId.toString()
      )
    } else {
      item.quantity = quantity
    }
    await this.save()
  }

  return this
}

export default mongoose.models.Cart || mongoose.model<ICart>('Cart', CartSchema)
