import mongoose, { Schema } from 'mongoose'

export type NewsletterCampaignDeliveryStatus =
  | 'pending'
  | 'processing'
  | 'sent'
  | 'failed'
  | 'skipped'

export interface INewsletterCampaignDelivery {
  _id: string
  campaign: mongoose.Types.ObjectId
  subscriber?: mongoose.Types.ObjectId
  email: string
  unsubscribeToken: string
  status: NewsletterCampaignDeliveryStatus
  attempts: number
  sentAt?: Date
  processingStartedAt?: Date
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
}

const NewsletterCampaignDeliverySchema = new Schema<INewsletterCampaignDelivery>({
  campaign: {
    type: Schema.Types.ObjectId,
    ref: 'NewsletterCampaign',
    required: true,
    index: true,
  },
  subscriber: {
    type: Schema.Types.ObjectId,
    ref: 'NewsletterSubscriber',
    index: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  unsubscribeToken: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'sent', 'failed', 'skipped'],
    default: 'pending',
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
    min: 0,
  },
  sentAt: Date,
  processingStartedAt: Date,
  errorMessage: String,
}, {
  timestamps: true,
})

NewsletterCampaignDeliverySchema.index({ campaign: 1, status: 1, createdAt: 1 })
NewsletterCampaignDeliverySchema.index({ campaign: 1, email: 1 }, { unique: true })

export default mongoose.models.NewsletterCampaignDelivery ||
  mongoose.model<INewsletterCampaignDelivery>('NewsletterCampaignDelivery', NewsletterCampaignDeliverySchema)
