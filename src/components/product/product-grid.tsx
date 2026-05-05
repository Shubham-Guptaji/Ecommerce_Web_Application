'use client'

import { ProductCard } from './product-card'
import type { IProduct } from '@/models/Product'
import { cn } from '@/lib/utils'

interface ProductGridProps {
  products: Array<IProduct | any>
  columns?: 2 | 3 | 4
  className?: string
  itemClassName?: string
  variant?: 'default' | 'editorial'
  stagger?: boolean
}

export function ProductGrid({
  products,
  columns = 4,
  className,
  itemClassName,
  variant = 'default',
  stagger = false,
}: ProductGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No products found</p>
      </div>
    )
  }

  return (
    <div className={cn('grid gap-6', gridCols[columns], className)}>
      {products.map((product, index) => (
        <div
          key={product._id.toString()}
          className={itemClassName}
          style={stagger ? { animationDelay: `${index * 90}ms` } : undefined}
        >
          <ProductCard product={product} variant={variant} />
        </div>
      ))}
    </div>
  )
}

export default ProductGrid
