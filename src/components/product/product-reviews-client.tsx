'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/shared/skeleton'
import { ReviewForm } from '@/components/product/review-form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Star,
} from 'lucide-react'
import { sanitizeHtml } from '@/lib/sanitize'

interface ProductReviewsClientProps {
  product: any
  reviews: any
  hasPurchased?: boolean
}

export function ProductReviewsClient({ product, reviews: initialReviews, hasPurchased = false }: ProductReviewsClientProps) {
  const router = useRouter()
  const [reviews, setReviews] = useState(initialReviews)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleReviewSubmitted = () => {
    // Refresh server data
    router.refresh()
    // Also update local state optimistically? Could refetch reviews client-side, but simpler to just refresh
  }

  const currentPrice = product.discountedPrice || product.price
  const hasDiscount = product.discountPercent > 0

  return (
    <div className="mb-16">
      <Tabs defaultValue="description" className="w-full flex-col">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="specifications">
            Specifications ({product.specifications?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="reviews">
            Reviews ({reviews.total || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="mt-0">
          <div className="prose dark:prose-invert max-w-none">
            <div
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(product.description || ''),
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="specifications" className="mt-0">
          {product.specifications && product.specifications.length > 0 ? (
            <div className="mt-4">
              <h3 className="text-xl font-semibold mb-4">Product Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.specifications.map((spec: any, index: number) => (
                  <div key={index} className="flex justify-between py-2 border-b">
                    <span className="font-medium">{spec.key}</span>
                    <span className="text-muted-foreground">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No specifications available for this product.
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="mt-0">
          <div key={refreshKey}>
            {hasPurchased && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">Customer Reviews</h3>
                  <Button variant="outline" onClick={() => document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth' })}>
                    Write a Review
                  </Button>
                </div>

                {/* Review Form */}
                <div id="review-form" className="mb-12">
                  <ReviewForm productId={product._id} onReviewSubmitted={handleReviewSubmitted} hasPurchased={hasPurchased} />
                </div>
              </>
            )}

            {reviews.total > 0 ? (
              <div className="space-y-6">
                {/* Rating Distribution */}
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-1">
                      {(reviews.average || 0).toFixed(1)}
                    </div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(reviews.average || 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Based on {reviews.total} reviews
                    </p>
                  </div>

                  {/* Rating bars */}
                  <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = reviews.distribution[rating] || 0
                      const percentage = (count / reviews.total) * 100 || 0
                      return (
                        <div key={rating} className="flex items-center gap-2">
                          <span className="text-sm w-12">{rating} star</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-400"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm w-8 text-right">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <Separator />

                {/* Review List */}
                <div className="space-y-6">
                  {reviews.list.map((review: any) => (
                    <div key={review._id} className="border-b pb-6">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {(review.user?.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{review.user?.name || 'Anonymous'}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                            {review.isVerifiedPurchase && (
                              <Badge variant="secondary" className="text-xs">
                                Verified Purchase
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <h4 className="font-medium mb-2">{review.title || 'Review'}</h4>
                      <p className="text-muted-foreground">{review.body}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <Button variant="ghost" size="sm" className="text-xs">
                          Helpful ({review.helpful})
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination if needed */}
                {reviews.pagination && reviews.pagination.pages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    {Array.from({ length: reviews.pagination.pages }).map((_, i) => (
                      <button
                        key={i}
                        className={`px-3 py-2 rounded-md ${
                          reviews.pagination.page === i + 1
                            ? 'bg-primary text-primary-foreground'
                            : 'border hover:bg-muted'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No reviews yet.</p>
                <p className="text-sm text-muted-foreground">
                  Be the first to share your thoughts!
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
