// src/app/(store)/categories/page.tsx
import { Metadata } from 'next'
import { CategoryGrid } from '@/components/category/category-grid'
import { dbConnect } from '@/lib/db'
import Category from '@/models/Category'
import { toPlainObject } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Categories',
  description: 'Browse all product categories in our store',
}

export default async function CategoriesPage() {
  await dbConnect()

  const categoriesRaw = await Category.find({ isActive: true })
    .populate('parent', 'name slug')
    .populate('children', 'name slug image')
    .sort({ name: 1 })
    .lean()

  const categories = categoriesRaw.map(toPlainObject)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">All Categories</h1>
        <p className="text-muted-foreground">
          Browse our wide selection of product categories
        </p>
      </div>

      <CategoryGrid categories={categories} />
    </div>
  )
}
