import type { MetadataRoute } from 'next'
import { dbConnect } from '@/lib/db'
import Product from '@/models/Product'
import Category from '@/models/Category'
import { getSiteUrl } from '@/lib/site-url'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await dbConnect()
  const baseUrl = getSiteUrl()

  // Fetch all active products
  const products = await Product.find({ isActive: true }).select('slug updatedAt')
  const categories = await Category.find({ isActive: true }).select('slug updatedAt')

  const now = new Date().toISOString()

  // Build sitemap entries
  const staticPages = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ]

  const categoryPages = categories.map((cat: any) => ({
    url: `${baseUrl}/category/${cat.slug}`,
    lastModified: cat.updatedAt.toISOString(),
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  const productPages = products.map((product: any) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: product.updatedAt.toISOString(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...staticPages, ...categoryPages, ...productPages] as MetadataRoute.Sitemap
}
