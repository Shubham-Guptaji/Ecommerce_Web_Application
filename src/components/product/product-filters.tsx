// src/components/product/product-filters.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { cn, formatCurrency } from '@/lib/utils'
import { SlidersHorizontal, Sparkles, Star, X } from 'lucide-react'

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

function buildCategoryLabelMap(nodes: CategoryNode[], map = new Map<string, string>()) {
  nodes.forEach((node) => {
    map.set(node.slug, node.name)
    if (node.children?.length) {
      buildCategoryLabelMap(node.children, map)
    }
  })

  return map
}

function FilterSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[1.8rem] border border-white/70 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 dark:shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
      <div className="mb-4">
        <h3 className="text-base font-black tracking-tight text-slate-950 dark:text-white">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
      {children}
    </section>
  )
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

  const categoryLabelMap = buildCategoryLabelMap(categories)
  const activeFilterBadges = [
    ...selectedCategories.map((slug) => categoryLabelMap.get(slug) || slug),
    ...(priceRange[0] > DEFAULT_MIN_PRICE || priceRange[1] < DEFAULT_MAX_PRICE
      ? [`${formatCurrency(priceRange[0])} - ${formatCurrency(priceRange[1])}`]
      : []),
    ...(minRating > 0 ? [`${minRating}+ stars`] : []),
    ...(inStock ? ['In stock only'] : []),
  ]

  return (
    <div className="w-full space-y-5 overflow-x-hidden">
      <div className="rounded-[1.9rem] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(248,245,239,0.92))] p-5 shadow-[0_22px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.92),rgba(2,6,23,0.92))] dark:shadow-[0_22px_60px_rgba(0,0,0,0.3)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center rounded-full border border-amber-300/50 bg-amber-100/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-200">
              <Sparkles className="mr-1.5 h-3 w-3" />
              Refine selection
            </span>
            <h2 className="mt-3 text-xl font-black tracking-tight text-slate-950 dark:text-white">
              Filters and preferences
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Tune the catalog without disrupting the current browsing flow.
            </p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-amber-300 shadow-lg shadow-slate-950/15 dark:bg-amber-300 dark:text-slate-950 dark:shadow-amber-300/10">
            <SlidersHorizontal className="h-5 w-5" />
          </div>
        </div>

        {hasActiveFilters ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {activeFilterBadges.map((badge) => (
              <Badge
                key={badge}
                variant="secondary"
                className="rounded-full border border-slate-200/80 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-200"
              >
                {badge}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            No filters applied yet. Start with category, price, rating, or stock.
          </p>
        )}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            className="mt-4 h-auto rounded-full px-0 text-sm font-semibold text-slate-600 hover:bg-transparent hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
            onClick={handleClearFilters}
          >
            <X className="mr-2 h-4 w-4" />
            Reset all filters
          </Button>
        )}
      </div>

      <FilterSection
        title="Categories"
        description="Explore one or more product families without leaving the page."
      >
        <div className="space-y-2.5">
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
      </FilterSection>

      <FilterSection
        title="Price range"
        description="Adjust the draft range locally, then apply it when it looks right."
      >
        <div className="space-y-4">
          <Slider
            value={priceRange}
            min={0}
            max={100000}
            step={1000}
            onValueChange={handlePriceChange}
          />
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
            <label className="min-w-0">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Minimum
              </span>
              <input
                type="number"
                placeholder="0"
                value={priceInputs.min}
                onChange={(e) => handlePriceInputChange('min', e.target.value)}
                className="min-w-0 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:focus:border-white dark:focus:ring-white/10"
              />
            </label>
            <span className="pt-6 text-center text-muted-foreground">-</span>
            <label className="min-w-0">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Maximum
              </span>
              <input
                type="number"
                placeholder="100000"
                value={priceInputs.max}
                onChange={(e) => handlePriceInputChange('max', e.target.value)}
                className="min-w-0 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:focus:border-white dark:focus:ring-white/10"
              />
            </label>
          </div>
          <Button
            type="button"
            className="w-full rounded-full bg-slate-950 font-semibold text-white shadow-lg shadow-slate-950/10 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
            onClick={applyPriceInputs}
            disabled={!hasPendingPriceChanges}
          >
            Apply Price Range
          </Button>
        </div>
      </FilterSection>

      <FilterSection
        title="Customer rating"
        description="Surface the strongest-reviewed products with a single click."
      >
        <div className="space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <div
              key={rating}
              className={cn(
                'flex items-center justify-between rounded-2xl border px-3 py-3 transition-colors',
                minRating === rating
                  ? 'border-slate-950/15 bg-white shadow-sm dark:border-white/15 dark:bg-slate-950/80'
                  : 'border-slate-200/70 bg-slate-50/80 hover:bg-white dark:border-white/10 dark:bg-slate-900/40 dark:hover:bg-slate-900/70'
              )}
            >
              <Checkbox
                id={`rating-${rating}`}
                checked={minRating === rating}
                onCheckedChange={() => handleRatingChange(rating)}
              />
              <Label
                htmlFor={`rating-${rating}`}
                className="flex flex-1 cursor-pointer items-center justify-between gap-3 text-sm"
              >
                <span className="font-medium text-slate-800 dark:text-slate-100">{rating}+ stars</span>
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-300">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span className="text-xs font-semibold uppercase tracking-[0.16em]">Rated</span>
                </span>
              </Label>
            </div>
          ))}
        </div>
      </FilterSection>

      <FilterSection
        title="Availability"
        description="Hide unavailable items when you want a cleaner shortlist."
      >
        <div className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 dark:border-white/10 dark:bg-slate-900/40">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">In stock only</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Only show products ready to order now.
            </p>
          </div>
          <Switch
            id="in-stock"
            checked={inStock}
            onCheckedChange={handleInStockChange}
          />
        </div>
      </FilterSection>
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
      <div
        className={cn(
          'flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition-colors',
          isChecked
            ? 'border-slate-950/15 bg-white shadow-sm dark:border-white/15 dark:bg-slate-950/80'
            : 'border-slate-200/70 bg-slate-50/80 hover:bg-white dark:border-white/10 dark:bg-slate-900/40 dark:hover:bg-slate-900/70'
        )}
        style={{ paddingLeft: `${level * 14 + 12}px` }}
      >
        <Checkbox
          id={`cat-${node._id}`}
          checked={isChecked}
          onCheckedChange={(checked) => onChange(node.slug, checked as boolean)}
        />
        <Label
          htmlFor={`cat-${node._id}`}
          className="cursor-pointer break-words text-sm font-medium text-slate-800 dark:text-slate-100"
        >
          {node.name}
        </Label>
      </div>
      {node.children && node.children.length > 0 && (
        <div className="mt-2 space-y-2">
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
