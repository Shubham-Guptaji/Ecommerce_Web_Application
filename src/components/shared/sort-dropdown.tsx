// src/components/shared/sort-dropdown.tsx
'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popular', label: 'Most Popular' },
]

interface SortDropdownProps {
  className?: string
}

export function SortDropdown({ className }: SortDropdownProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const currentSort = searchParams.get('sortBy') || 'createdAt'
  const currentOrder = searchParams.get('sortOrder') || 'desc'
  const currentIsFeatured = searchParams.get('isFeatured') === 'true'

  // Determine current option label
  const getCurrentOptionLabel = () => {
    if (currentIsFeatured) return 'Featured'
    if (currentSort === 'createdAt') return 'Newest'
    if (currentSort === 'price' && currentOrder === 'asc') return 'Price: Low to High'
    if (currentSort === 'price' && currentOrder === 'desc') return 'Price: High to Low'
    if (currentSort === 'ratings.average') return 'Highest Rated'
    if (currentSort === 'soldCount') return 'Most Popular'
    return 'Sort by'
  }

  const handleSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())

    // Clear isFeatured if present (for featured we use isFeatured=true param)
    params.delete('isFeatured')

    switch (value) {
      case 'featured':
        params.set('isFeatured', 'true')
        params.set('sortBy', 'createdAt')
        params.set('sortOrder', 'desc')
        break
      case 'newest':
        params.set('sortBy', 'createdAt')
        params.set('sortOrder', 'desc')
        break
      case 'price-asc':
        params.set('sortBy', 'price')
        params.set('sortOrder', 'asc')
        break
      case 'price-desc':
        params.set('sortBy', 'price')
        params.set('sortOrder', 'desc')
        break
      case 'rating':
        params.set('sortBy', 'ratings.average')
        params.set('sortOrder', 'desc')
        break
      case 'popular':
        params.set('sortBy', 'soldCount')
        params.set('sortOrder', 'desc')
        break
      default:
        params.set('sortBy', 'createdAt')
        params.set('sortOrder', 'desc')
    }

    // Reset to page 1
    params.delete('page')

    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'rounded-full border-slate-300/80 bg-white/85 font-semibold text-slate-900 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-slate-900/80 dark:text-white dark:hover:bg-slate-800',
            className
          )}
        >
          Sort by: {getCurrentOptionLabel()}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur dark:border-white/10 dark:bg-slate-950/95"
      >
        {sortOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            className="rounded-xl px-3 py-2 font-medium text-slate-700 focus:bg-slate-100 focus:text-slate-950 dark:text-slate-200 dark:focus:bg-slate-800 dark:focus:text-white"
            onClick={() => handleSort(option.value)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
