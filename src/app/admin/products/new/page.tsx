// src/app/admin/products/new/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { axiosInstance } from '@/lib/axios'
import ProductForm from '@/components/admin/ProductForm'

export default function NewProductPage() {
  const router = useRouter()

  const handleSubmit = async (data: any) => {
    try {
      const response = await axiosInstance.post('/api/admin/products', data)
      const result = response.data

      toast({
        title: 'Success',
        description: 'Product created successfully',
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

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Add New Product</h1>
          <p className="text-muted-foreground">Create a new product listing</p>
        </div>
        <Button variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
      </div>

      <ProductForm
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  )
}
