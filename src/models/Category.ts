import mongoose, { Schema, Document } from 'mongoose'

export interface ICategory {
  _id: string
  name: string
  slug: string
  description?: string
  image?: {
    url: string
    publicId: string
  }
  parent?: mongoose.Types.ObjectId | null
  children?: mongoose.Types.ObjectId[]
  isActive: boolean
  sortOrder?: number
  createdAt: Date
  updatedAt: Date
}

const CategorySchema = new Schema<ICategory>({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: 100,
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
    trim: true,
    maxlength: 500,
  },
  image: {
    url: String,
    publicId: String,
  },
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
  children: [{
    type: Schema.Types.ObjectId,
    ref: 'Category',
  }],
  sortOrder: {
    type: Number,
    default: 0,
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

// Generate slug before saving
CategorySchema.pre('save', function (next) {
  const doc = this as any
  if (doc.isModified('name') || !doc.slug) {
    doc.slug = doc.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }
  next()
})

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema)
