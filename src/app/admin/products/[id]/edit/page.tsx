// src/app/admin/products/[id]/edit/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { axiosInstance } from '@/lib/axios'
import ProductForm from '@/components/admin/ProductForm'

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [initialData, setInitialData] = useState<any>(null)

   
  useEffect(() => {
    if (productId) {
      const fetchProduct = async () => {
        try {
          const response = await axiosInstance.get(`/api/admin/products/${productId}`)
          const result = response.data

          if (!result.success) {
            throw new Error(result.message || 'Failed to fetch product')
          }

          setInitialData(result.data)
        } catch (error: any) {
          toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
          })
        } finally {
          setFetchLoading(false)
        }
      }
      fetchProduct()
    }
  }, [productId])

  const handleSubmit = async (data: any) => {
    try {
      const response = await axiosInstance.put(`/api/admin/products/${productId}`, data)
      const result = response.data

      toast({
        title: 'Success',
        description: 'Product updated successfully',
      })

      router.push('/admin/products')
    } catch (error: any) {
      const errMessage = error.response?.data?.message || error.message
      toast({
        title: 'Error',
        description: errMessage,
        variant: 'destructive',
      })
      throw error // Re-throw to keep form in loading state
    }
  }

  if (fetchLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <div className="h-10 w-20 bg-muted rounded animate-pulse" />
          <div className="h-8 w-64 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-64 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!initialData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Product not found</p>
        <Button onClick={() => router.push('/admin/products')} className="mt-4">
          Back to Products
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Edit Product</h1>
          <p className="text-muted-foreground">Update product details</p>
        </div>
        <Button variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
      </div>

      <ProductForm
        mode="edit"
        initialData={initialData}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
