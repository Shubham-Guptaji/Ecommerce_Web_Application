import mongoose, { Schema, Document } from 'mongoose'

export interface IEmailVerification {
  _id: string
  email: string
  token: string // Hashed token
  user: mongoose.Types.ObjectId
  expiresAt: Date
  createdAt: Date
}

const EmailVerificationSchema = new Schema<IEmailVerification>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  token: {
    type: String,
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})

// TTL index to auto-expire tokens
EmailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.models.EmailVerification ||
  mongoose.model<IEmailVerification>('EmailVerification', EmailVerificationSchema)
