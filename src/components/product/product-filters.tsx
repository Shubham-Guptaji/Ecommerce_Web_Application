// src/components/product/product-filters.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Star, X } from 'lucide-react'

interface CategoryNode {
  _id: string
  name: string
  slug: string
  children?: CategoryNode[]
}

interface ProductFiltersProps {
  categories: CategoryNode[]
}

export function ProductFilters({ categories }: ProductFiltersProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000])
  const [minRating, setMinRating] = useState<number>(0)
  const [inStock, setInStock] = useState<boolean>(false)

  // Initialize state from URL params
   
   
  useEffect(() => {
    const cats = searchParams.get('category')?.split(',').filter(Boolean) || []
    const minP = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : 0
    const maxP = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : 100000
    const rating = searchParams.get('minRating') ? parseInt(searchParams.get('minRating')!) : 0
    const stock = searchParams.get('inStock') === 'true'
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedCategories(cats)
     
    setPriceRange([minP, maxP])
     
    setMinRating(rating)
     
    setInStock(stock)
  }, [searchParams])

  const updateURL = (updates: Record<string, string | boolean | null>) => {
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
  }

  const handleCategoryChange = (slug: string, checked: boolean) => {
    const newCats = checked ? [...selectedCategories, slug] : selectedCategories.filter(c => c !== slug)
    setSelectedCategories(newCats)
    updateURL({ category: newCats.length > 0 ? newCats.join(',') : null })
  }

  const handlePriceChange = (values: number[]) => {
    if (values.length === 2) {
      setPriceRange([values[0], values[1]])
      updateURL({ minPrice: values[0].toString(), maxPrice: values[1].toString() })
    }
  }

  const handlePriceInputChange = (type: 'min' | 'max', value: number) => {
    const newRange: [number, number] = type === 'min' ? [value, priceRange[1]] : [priceRange[0], value]
    setPriceRange(newRange)
    updateURL({ [type === 'min' ? 'minPrice' : 'maxPrice']: value.toString() })
  }

  const handleRatingChange = (rating: number) => {
    const newRating = minRating === rating ? 0 : rating
    setMinRating(newRating)
    updateURL({ minRating: newRating > 0 ? newRating.toString() : null })
  }

  const handleInStockChange = (checked: boolean) => {
    setInStock(checked)
    updateURL({ inStock: checked })
  }

  const handleClearFilters = () => {
    setSelectedCategories([])
    setPriceRange([0, 100000])
    setMinRating(0)
    setInStock(false)
    const params = new URLSearchParams(searchParams.toString())
    ;['category', 'minPrice', 'maxPrice', 'minRating', 'inStock'].forEach(key => params.delete(key))
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 100000 ||
    minRating > 0 ||
    inStock

  return (
    <div className="w-full space-y-6 overflow-x-hidden">
      {/* Categories */}
      <div>
        <h3 className="font-semibold mb-3">Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <CategoryNode
              key={category._id}
              node={category}
              selected={selectedCategories}
              onChange={handleCategoryChange}
              level={0}
            />
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold mb-3">Price Range</h3>
        <div className="space-y-4">
          <Slider
            value={priceRange}
            min={0}
            max={100000}
            step={1000}
            onValueChange={handlePriceChange}
          />
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
            <input
              type="number"
              placeholder="Min"
              value={priceRange[0] || ''}
              onChange={(e) => handlePriceInputChange('min', parseInt(e.target.value) || 0)}
              className="min-w-0 w-full border rounded px-3 py-2 text-sm"
            />
            <span className="text-muted-foreground">-</span>
            <input
              type="number"
              placeholder="Max"
              value={priceRange[1] || ''}
              onChange={(e) => handlePriceInputChange('max', parseInt(e.target.value) || 100000)}
              className="min-w-0 w-full border rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

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
              <Label htmlFor={`rating-${rating}`} className="text-sm flex items-center gap-1 cursor-pointer">
                {rating}+ <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* In Stock */}
      <div>
        <div className="flex items-center space-x-2">
          <Switch
            id="in-stock"
            checked={inStock}
            onCheckedChange={handleInStockChange}
          />
          <Label htmlFor="in-stock" className="text-sm cursor-pointer">
            In Stock Only
          </Label>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="outline" className="w-full" onClick={handleClearFilters}>
          <X className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  )
}

// Recursive component for category tree
function CategoryNode({
  node,
  selected,
  onChange,
  level,
}: {
  node: CategoryNode
  selected: string[]
  onChange: (slug: string, checked: boolean) => void
  level: number
}) {
  const isChecked = selected.includes(node.slug)

  return (
      <div key={node._id} className="min-w-0">
      <div className="flex items-center space-x-2" style={{ paddingLeft: `${level * 12}px` }}>
        <Checkbox
          id={`cat-${node._id}`}
          checked={isChecked}
          onCheckedChange={(checked) => onChange(node.slug, checked as boolean)}
        />
        <Label htmlFor={`cat-${node._id}`} className="cursor-pointer break-words text-sm">
          {node.name}
        </Label>
      </div>
      {node.children && node.children.length > 0 && (
        <div className="mt-1">
          {node.children.map((child) => (
            <CategoryNode
              key={child._id}
              node={child}
              selected={selected}
              onChange={onChange}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
