// src/models/User.ts
import mongoose, { Schema, Document } from 'mongoose'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

export interface IUser {
  _id: string
  name: string
  email: string
  phone?: string
  password?: string
  avatar?: {
    url: string
    publicId: string
  }
  role: 'user' | 'admin'
  isEmailVerified: boolean
  isActive: boolean
  emailVerifyToken?: string
  emailVerifyExpiry?: Date
  resetPasswordToken?: string
  resetPasswordExpiry?: Date
  wishlist: Array<{
    product: mongoose.Types.ObjectId
    addedAt: Date
  }>
  addresses: mongoose.Types.ObjectId[]
  defaultAddress?: mongoose.Types.ObjectId
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
  comparePassword(candidatePassword: string): Promise<boolean>
}

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  password: {
    type: String,
    minlength: 6,
    select: false,
  },
  avatar: {
    url: String,
    publicId: String,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  emailVerifyToken: String,
  emailVerifyExpiry: Date,
  resetPasswordToken: String,
  resetPasswordExpiry: Date,
  wishlist: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    addedAt: { type: Date, default: Date.now }
  }],
  defaultAddress: {
    type: Schema.Types.ObjectId,
    ref: 'Address',
  },
  addresses: [{
    type: Schema.Types.ObjectId,
    ref: 'Address',
  }],
  lastLogin: Date,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next()

  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error as Error)
  }
})

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false
  return await bcrypt.compare(candidatePassword, this.password)
}

// Generate email verification token
UserSchema.methods.generateEmailVerifyToken = function (): string {
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

  this.emailVerifyToken = tokenHash
  this.emailVerifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  return rawToken
}

// Generate password reset token
UserSchema.methods.generatePasswordResetToken = function (): string {
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

  this.resetPasswordToken = tokenHash
  this.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  return rawToken
}

// Remove sensitive data from JSON
UserSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  delete obj.resetPasswordToken
  delete obj.resetPasswordExpiry
  delete obj.emailVerifyToken
  delete obj.emailVerifyExpiry
  return obj
}

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
