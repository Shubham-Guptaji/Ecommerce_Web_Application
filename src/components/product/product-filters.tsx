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

const DEFAULT_MIN_PRICE = 0
const DEFAULT_MAX_PRICE = 100000

type PriceInputState = {
  min: string
  max: string
}

export function ProductFilters({ categories }: ProductFiltersProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const searchParamsKey = searchParams.toString()

  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([
    DEFAULT_MIN_PRICE,
    DEFAULT_MAX_PRICE,
  ])
  const [priceInputs, setPriceInputs] = useState<PriceInputState>({ min: '', max: '' })
  const [minRating, setMinRating] = useState<number>(0)
  const [inStock, setInStock] = useState<boolean>(false)

  // Initialize state from URL params
   
   
  useEffect(() => {
    const params = new URLSearchParams(searchParamsKey)
    const cats = params.get('category')?.split(',').filter(Boolean) || []
    const minPriceParam = params.get('minPrice')
    const maxPriceParam = params.get('maxPrice')
    const minP = minPriceParam ? parseInt(minPriceParam) : DEFAULT_MIN_PRICE
    const maxP = maxPriceParam ? parseInt(maxPriceParam) : DEFAULT_MAX_PRICE
    const minRatingParam = params.get('minRating')
    const rating = minRatingParam ? parseInt(minRatingParam) : 0
    const stock = params.get('inStock') === 'true'
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedCategories(cats)
    setPriceRange([minP, maxP])
    setPriceInputs({
      min: minPriceParam ?? '',
      max: maxPriceParam ?? '',
    })
    setMinRating(rating)
    setInStock(stock)
  }, [searchParamsKey])

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

    const nextQuery = params.toString()
    const currentQuery = searchParams.toString()

    if (nextQuery === currentQuery) {
      return
    }

    router.push(nextQuery ? `?${nextQuery}` : '?', { scroll: false })
  }

  const handleCategoryChange = (slug: string, checked: boolean) => {
    const newCats = checked ? [...selectedCategories, slug] : selectedCategories.filter(c => c !== slug)
    setSelectedCategories(newCats)
    updateURL({ category: newCats.length > 0 ? newCats.join(',') : null })
  }

  const handlePriceChange = (values: number[]) => {
    if (values.length === 2) {
      const nextRange: [number, number] = [values[0], values[1]]
      setPriceRange(nextRange)
      setPriceInputs({
        min: values[0] === DEFAULT_MIN_PRICE ? '' : values[0].toString(),
        max: values[1] === DEFAULT_MAX_PRICE ? '' : values[1].toString(),
      })
    }
  }

  const handlePriceInputChange = (type: 'min' | 'max', value: string) => {
    if (value !== '' && !/^\d+$/.test(value)) {
      return
    }

    setPriceInputs((current) => ({
      ...current,
      [type]: value,
    }))
  }

  const applyPriceInputs = () => {
    const rawMin = priceInputs.min.trim()
    const rawMax = priceInputs.max.trim()

    const parsedMin = rawMin ? Number.parseInt(rawMin, 10) : DEFAULT_MIN_PRICE
    const parsedMax = rawMax ? Number.parseInt(rawMax, 10) : DEFAULT_MAX_PRICE

    const safeMin = Number.isNaN(parsedMin) ? DEFAULT_MIN_PRICE : parsedMin
    const safeMax = Number.isNaN(parsedMax) ? DEFAULT_MAX_PRICE : parsedMax

    const clampedMin = Math.min(Math.max(safeMin, DEFAULT_MIN_PRICE), DEFAULT_MAX_PRICE)
    const clampedMax = Math.max(Math.min(safeMax, DEFAULT_MAX_PRICE), clampedMin)

    setPriceRange([clampedMin, clampedMax])
    setPriceInputs({
      min: rawMin ? clampedMin.toString() : '',
      max: rawMax ? clampedMax.toString() : '',
    })
    updateURL({
      minPrice: rawMin ? clampedMin.toString() : null,
      maxPrice: rawMax ? clampedMax.toString() : null,
    })
  }

  const hasPendingPriceChanges =
    priceInputs.min !== (searchParams.get('minPrice') ?? '') ||
    priceInputs.max !== (searchParams.get('maxPrice') ?? '')

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
    setPriceRange([DEFAULT_MIN_PRICE, DEFAULT_MAX_PRICE])
    setPriceInputs({ min: '', max: '' })
    setMinRating(0)
    setInStock(false)
    const params = new URLSearchParams(searchParams.toString())
    ;['category', 'minPrice', 'maxPrice', 'minRating', 'inStock'].forEach(key => params.delete(key))
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    priceRange[0] > DEFAULT_MIN_PRICE ||
    priceRange[1] < DEFAULT_MAX_PRICE ||
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
              value={priceInputs.min}
              onChange={(e) => handlePriceInputChange('min', e.target.value)}
              className="min-w-0 w-full border rounded px-3 py-2 text-sm"
            />
            <span className="text-muted-foreground">-</span>
            <input
              type="number"
              placeholder="Max"
              value={priceInputs.max}
              onChange={(e) => handlePriceInputChange('max', e.target.value)}
              className="min-w-0 w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <Button
            type="button"
            className="w-full"
            onClick={applyPriceInputs}
            disabled={!hasPendingPriceChanges}
          >
            Apply Price Range
          </Button>
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
