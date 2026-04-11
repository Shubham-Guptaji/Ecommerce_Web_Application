import mongoose, { Schema, Document } from 'mongoose'

export interface IAddress {
  _id: string
  user: mongoose.Types.ObjectId
  label: 'Home' | 'Work' | 'Other'
  fullName: string
  phone: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  country: string
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

const AddressSchema = new Schema<IAddress>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  label: {
    type: String,
    enum: ['Home', 'Work', 'Other'],
    required: true,
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  line1: {
    type: String,
    required: [true, 'Address line 1 is required'],
    trim: true,
  },
  line2: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
  },
  pincode: {
    type: String,
    required: [true, 'Pincode is required'],
    trim: true,
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    default: 'India',
    trim: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})

// Ensure only one default address per user
AddressSchema.pre('save', async function (next) {
  if (this.isDefault) {
    await this.model().updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    )
  }
  next()
})

export default mongoose.models.Address || mongoose.model<IAddress>('Address', AddressSchema)
