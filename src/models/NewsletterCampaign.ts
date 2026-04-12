import mongoose, { Schema } from 'mongoose'

export type NewsletterCampaignStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'completed_with_errors'
  | 'failed'

export interface INewsletterCampaign {
  _id: string
  subject: string
  bodyHtml: string
  bodyText: string
  targetMode: 'single' | 'selected' | 'all'
  requestedCount: number
  activeRecipientCount: number
  sentCount: number
  failedCount: number
  skippedCount: number
  pendingCount: number
  processingCount: number
  status: NewsletterCampaignStatus
  createdByName?: string
  createdByEmail?: string
  startedAt?: Date
  completedAt?: Date
  lastProcessedAt?: Date
  lastError?: string
  createdAt: Date
  updatedAt: Date
}

const NewsletterCampaignSchema = new Schema<INewsletterCampaign>({
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 160,
  },
  bodyHtml: {
    type: String,
    required: true,
  },
  bodyText: {
    type: String,
    required: true,
  },
  targetMode: {
    type: String,
    enum: ['single', 'selected', 'all'],
    required: true,
  },
  requestedCount: {
    type: Number,
    required: true,
    min: 0,
  },
  activeRecipientCount: {
    type: Number,
    required: true,
    min: 0,
  },
  sentCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  failedCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  skippedCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  pendingCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  processingCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  status: {
    type: String,
    enum: ['queued', 'processing', 'completed', 'completed_with_errors', 'failed'],
    default: 'queued',
    required: true,
  },
  createdByName: {
    type: String,
    trim: true,
  },
  createdByEmail: {
    type: String,
    trim: true,
  },
  startedAt: Date,
  completedAt: Date,
  lastProcessedAt: Date,
  lastError: String,
}, {
  timestamps: true,
})

NewsletterCampaignSchema.index({ createdAt: -1 })
NewsletterCampaignSchema.index({ status: 1, createdAt: -1 })

export default mongoose.models.NewsletterCampaign ||
  mongoose.model<INewsletterCampaign>('NewsletterCampaign', NewsletterCampaignSchema)
