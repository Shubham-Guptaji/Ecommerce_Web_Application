'use client'

import Link from 'next/link'
import Image from 'next/image'

interface Category {
  _id: string
  name: string
  slug: string
  image?: {
    url: string
  }
  hasChildren?: boolean
}

interface CategoryGridProps {
  categories: Category[]
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No categories available</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {categories.map((category) => (
        <Link
          key={category._id}
          href={`/category/${category.slug}`}
          className="group relative overflow-hidden rounded-lg border hover:shadow-lg transition-all duration-300"
        >
          <div className="aspect-square relative bg-muted">
            {category.image?.url ? (
              <Image
                src={category.image.url}
                alt={category.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                <span className="text-4xl font-bold text-muted-foreground/20">
                  {category.name.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
            <h3 className="font-semibold text-xl text-center mb-1">
              {category.name}
            </h3>
            {category.hasChildren && (
              <span className="text-xs bg-white/20 px-2 py-1 rounded">
                {category.hasChildren ? 'Subcategories' : ''}
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}
