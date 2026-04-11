import mongoose, { Schema, Document } from 'mongoose'

export interface ISetting {
  _id: string
  storeName: string
  storeEmail: string
  storeLogo?: {
    url: string
    publicId: string
  }
  storePhone?: string
  storeAddress?: string
  gstNumber?: string
  freeDeliveryThreshold: number
  deliveryCharge: number
  expressDeliveryCharge: number
  taxRate: number
  maintenanceMode: boolean
  emailTemplates?: {
    orderConfirmation?: string
    orderStatusUpdate?: string
    welcome?: string
    passwordReset?: string
  }
  createdAt: Date
  updatedAt: Date
}

const SettingSchema = new Schema<ISetting>({
  storeName: {
    type: String,
    required: true,
    default: 'E-Shop',
  },
  storeEmail: {
    type: String,
    required: true,
    default: 'contact@eshop.com',
  },
  storeLogo: {
    url: String,
    publicId: String,
  },
  storePhone: {
    type: String,
  },
  storeAddress: {
    type: String,
  },
  gstNumber: {
    type: String,
  },
  freeDeliveryThreshold: {
    type: Number,
    default: 499,
    min: 0,
  },
  deliveryCharge: {
    type: Number,
    default: 49,
    min: 0,
  },
  expressDeliveryCharge: {
    type: Number,
    default: 99,
    min: 0,
  },
  taxRate: {
    type: Number,
    default: 18,
    min: 0,
    max: 100,
  },
  maintenanceMode: {
    type: Boolean,
    default: false,
  },
  emailTemplates: {
    type: Schema.Types.Mixed,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})

// Ensure only one settings document exists
SettingSchema.pre('save', async function (next) {
  if (!this._id) {
    const count = await this.model().countDocuments()
    if (count > 0) {
      throw new Error('Only one settings document is allowed')
    }
  }
  next()
})

export default mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema)
