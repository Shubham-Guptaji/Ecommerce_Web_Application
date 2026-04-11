import mongoose, { Schema, Document } from 'mongoose'

export interface INewsletterSubscriber {
  _id: string
  email: string
  subscribedAt: Date
  unsubscribeToken: string
  unsubscribedAt?: Date
  isActive: boolean
}

const NewsletterSubscriberSchema = new Schema<INewsletterSubscriber>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  unsubscribeToken: {
    type: String,
    required: true,
    unique: true,
  },
  subscribedAt: {
    type: Date,
    default: Date.now,
  },
  unsubscribedAt: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
})

// email already has unique: true index
NewsletterSubscriberSchema.index({ isActive: 1, subscribedAt: -1 })

export default mongoose.models.NewsletterSubscriber ||
  mongoose.model<INewsletterSubscriber>('NewsletterSubscriber', NewsletterSubscriberSchema)
