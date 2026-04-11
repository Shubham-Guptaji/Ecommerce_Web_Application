'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { X } from 'lucide-react'
import type { ICategory } from '@/models/Category'

interface CategorySidebarProps {
  category: any
}

export function CategorySidebar({ category }: CategorySidebarProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Get current filter values from URL
  const currentMinPrice = searchParams.get('minPrice') || ''
  const currentMaxPrice = searchParams.get('maxPrice') || ''
  const currentMinRating = searchParams.get('minRating') || ''
  const currentInStock = searchParams.get('inStock') === 'true'

  const [priceRange, setPriceRange] = useState([
    currentMinPrice ? parseInt(currentMinPrice) : 0,
    currentMaxPrice ? parseInt(currentMaxPrice) : 100000,
  ])
  const [inStock, setInStock] = useState(currentInStock)
  const [minRating, setMinRating] = useState(currentMinRating ? parseInt(currentMinRating) : 0)

  // Update URL with filters
  const updateFilters = useCallback((updates: Record<string, string | boolean | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === false) {
        params.delete(key)
      } else {
        params.set(key, value.toString())
      }
    })

    // Reset to page 1 when filters change
    params.delete('page')

    router.push(`?${params.toString()}`, { scroll: false })
  }, [searchParams, router])

  const handlePriceChange = () => {
    updateFilters({
      minPrice: priceRange[0] > 0 ? priceRange[0].toString() : null,
      maxPrice: priceRange[1] < 100000 ? priceRange[1].toString() : null,
    })
  }

  const handleInStockChange = (checked: boolean) => {
    setInStock(checked)
    updateFilters({ inStock: checked })
  }

  const handleRatingChange = (rating: number) => {
    const newRating = minRating === rating ? 0 : rating
    setMinRating(newRating)
    updateFilters({ minRating: newRating > 0 ? newRating.toString() : null })
  }

  const handleClearFilters = () => {
    setPriceRange([0, 100000])
    setInStock(false)
    setMinRating(0)
    router.push(window.location.pathname, { scroll: false })
  }

  const children = category.children || []

  // Check if any filters are active
  const hasActiveFilters = priceRange[0] > 0 || priceRange[1] < 100000 || inStock || minRating > 0

  return (
    <div key={searchParams.toString()} className="space-y-6">
      {/* Subcategories */}
      {children.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Subcategories</h3>
          <div className="space-y-2">
            {children.map((sub: any) => (
              <Link
                key={sub._id}
                href={`/category/${sub.slug}`}
                className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
              >
                <span className="w-1 h-1 bg-current rounded-full" />
                {sub.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Price Range */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Price Range</h3>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-auto p-0 text-xs">
              Clear all
            </Button>
          )}
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="number"
              placeholder="Min"
              className="w-full border rounded px-3 py-2 text-sm"
              value={priceRange[0] || ''}
              onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
              onBlur={handlePriceChange}
            />
            <span className="text-muted-foreground">-</span>
            <input
              type="number"
              placeholder="Max"
              className="w-full border rounded px-3 py-2 text-sm"
              value={priceRange[1] || ''}
              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 100000])}
              onBlur={handlePriceChange}
            />
          </div>
          <input
            type="range"
            min="0"
            max="100000"
            step="1000"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
            onMouseUp={handlePriceChange}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>₹{priceRange[0]}</span>
            <span>₹{priceRange[1]}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Rating */}
      <div>
        <h3 className="font-semibold mb-3">Customer Rating</h3>
        <div className="space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center space-x-2">
              <Checkbox
                id={`rating-${rating}`}
                checked={minRating === rating}
                onCheckedChange={() => handleRatingChange(rating)}
              />
              <label htmlFor={`rating-${rating}`} className="text-sm flex items-center gap-1 cursor-pointer">
                {rating}+ <span className="text-yellow-500">★</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Availability */}
      <div>
        <h3 className="font-semibold mb-3">Availability</h3>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="in-stock"
            checked={inStock}
            onCheckedChange={handleInStockChange}
          />
          <label htmlFor="in-stock" className="text-sm cursor-pointer">
            In Stock Only
          </label>
        </div>
      </div>

      <Separator />

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button variant="outline" className="w-full" onClick={handleClearFilters}>
          <X className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  )
}
