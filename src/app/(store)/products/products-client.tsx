'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProductGrid } from '@/components/product/product-grid'
import { useDebounce } from '@/hooks/useDebounce'
import type { IProduct } from '@/models/Product'

interface ProductsClientProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export function ProductsClient({ searchParams }: ProductsClientProps) {
  const searchParamsHook = useSearchParams()
  const [products, setProducts] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  })

  const debouncedSearch = useDebounce(searchParamsHook.toString(), 500)

  const fetchProducts = useCallback(async (params: any) => {
    setLoading(true)
    try {
      const queryString = new URLSearchParams(params).toString()
      const response = await fetch(`/api/products?${queryString}`)
      const result = await response.json()

      if (result.success) {
        setProducts(result.data)
        setPagination(result.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }, [])

   
  useEffect(() => {
    const params: any = {}

    // Convert search params to API params
    if (searchParams.category) params.category = searchParams.category
    if (searchParams.minPrice) params.minPrice = searchParams.minPrice
    if (searchParams.maxPrice) params.maxPrice = searchParams.maxPrice
    if (searchParams.minRating) params.minRating = searchParams.minRating
    if (searchParams.inStock) params.inStock = searchParams.inStock
    if (searchParams.isFeatured) params.isFeatured = searchParams.isFeatured
    if (searchParams.search) params.search = searchParams.search
    if (searchParams.sortBy) params.sortBy = searchParams.sortBy
    if (searchParams.sortOrder) params.sortOrder = searchParams.sortOrder

    fetchProducts(params)
    // All searchParams properties are captured by debouncedSearch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, fetchProducts])

  return (
    <div>
      <div className="mb-6 text-sm text-muted-foreground">
        Showing {products.length} of {pagination.total} products
        {searchParams.search && (
          <span> for &quot;{searchParams.search}&quot;</span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="border rounded-lg overflow-hidden">
              <div className="aspect-square w-full animate-pulse bg-muted" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-1/3 animate-pulse bg-muted rounded" />
                <div className="h-6 w-full animate-pulse bg-muted rounded" />
                <div className="h-4 w-2/3 animate-pulse bg-muted rounded" />
                <div className="h-8 w-24 animate-pulse bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <ProductGrid products={products} columns={3} />
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products found matching your criteria.</p>
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: pagination.pages }).map((_, i) => (
            <button
              key={i}
              className={`px-3 py-2 rounded-md ${
                pagination.page === i + 1
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
  )
}
