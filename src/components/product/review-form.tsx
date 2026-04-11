'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Star, MessageSquare } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { axiosInstance } from '@/lib/axios'

const reviewFormSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().max(200).optional(),
  body: z.string().min(1, 'Review is required').max(1000),
})

type ReviewFormData = z.infer<typeof reviewFormSchema>

interface ReviewFormProps {
  productId: string
  onReviewSubmitted: () => void
  hasPurchased?: boolean
}

export function ReviewForm({ productId, onReviewSubmitted, hasPurchased = false }: ReviewFormProps) {
  const { data: session, status } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedRating, setSelectedRating] = useState(0)

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: 0,
      title: '',
      body: '',
    },
  })

  const onSubmit = async (data: ReviewFormData) => {
    setIsSubmitting(true)
    try {
      const response = await axiosInstance.post(`/api/products/${productId}/reviews`, data)

      toast({
        title: 'Success',
        description: 'Your review has been submitted and is now visible.',
      })
      form.reset()
      setSelectedRating(0)
      onReviewSubmitted()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to submit review',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading') {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-24 bg-muted rounded" />
            <div className="h-10 bg-muted rounded w-1/3" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!session) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Write a Review</h3>
          <p className="text-muted-foreground mb-4">
            Please sign in to share your experience with this product.
          </p>
          <a href="/sign-in" className="text-primary hover:underline">
            Sign in to review
          </a>
        </CardContent>
      </Card>
    )
  }

  if (!hasPurchased) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Write a Review</h3>
          <p className="text-muted-foreground mb-4">
            Only customers who have purchased this product can leave a review.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Star Rating */}
          <div>
            <Label>Rating *</Label>
            <div className="flex gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => {
                    setSelectedRating(star)
                    form.setValue('rating', star)
                  }}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= selectedRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {form.formState.errors.rating && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.rating.message}</p>
            )}
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Review Title (Optional)</Label>
            <Input
              id="title"
              placeholder="Summarize your experience"
              {...form.register('title')}
              className="mt-1"
            />
          </div>

          {/* Body */}
          <div>
            <Label htmlFor="body">Review *</Label>
            <Textarea
              id="body"
              placeholder="Share your thoughts about this product..."
              rows={4}
              {...form.register('body')}
              className="mt-1"
            />
            {form.formState.errors.body && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.body.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {form.getValues('body')?.length || 0}/1000 characters
            </p>
          </div>

          <Button type="submit" disabled={isSubmitting || selectedRating === 0}>
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>

          <p className="text-xs text-muted-foreground">
            Only customers who have purchased this product can leave a review.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
