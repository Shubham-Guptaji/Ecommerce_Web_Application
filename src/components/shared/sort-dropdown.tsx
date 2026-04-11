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
        <Button variant="outline" className={className}>
          Sort by: {getCurrentOptionLabel()}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {sortOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleSort(option.value)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
