import mongoose, { Schema } from 'mongoose'

export interface IContactMessage {
  _id: string
  firstName: string
  lastName: string
  email: string
  subject: string
  message: string
  fullName: string
  emailSent: boolean
  ipAddress?: string
  userAgent?: string
  createdAt: Date
  updatedAt: Date
}

const ContactMessageSchema = new Schema<IContactMessage>({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  emailSent: {
    type: Boolean,
    default: false,
    index: true,
  },
  ipAddress: {
    type: String,
    trim: true,
  },
  userAgent: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})

ContactMessageSchema.index({ createdAt: -1 })
ContactMessageSchema.index({ email: 1, createdAt: -1 })

export default mongoose.models.ContactMessage ||
  mongoose.model<IContactMessage>('ContactMessage', ContactMessageSchema)
