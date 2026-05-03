// src/app/(store)/page.tsx
import { Suspense, type ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle,
  CreditCard,
  Gem,
  Package,
  Shield,
  Sparkles,
  Star,
  Truck,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { formatCurrency, toPlainObject } from '@/lib/utils'
import { ProductGrid } from '@/components/product/product-grid'
import { Skeleton } from '@/components/shared/skeleton'
import { NewsletterForm } from '@/components/shared/newsletter-form'
import { CountdownTimer } from '@/components/shared/countdown-timer'
import { dbConnect } from '@/lib/db'
import Product from '@/models/Product'
import Category from '@/models/Category'

export const dynamic = 'force-dynamic'

type HomeProduct = {
  _id: string
  name: string
  slug: string
  shortDescription?: string
  price: number
  discountedPrice?: number
  discountPercent?: number
  images?: Array<{ url?: string }>
  ratings?: {
    average?: number
    count?: number
  }
  stock?: number
  isFeatured?: boolean
  soldCount?: number
}

type HomeCategory = {
  _id: string
  name: string
  slug: string
  image?: {
    url?: string
  }
  hasChildren?: boolean
}

const trustItems = [
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'On orders above ₹499',
  },
  {
    icon: Shield,
    title: 'Secure Payment',
    description: 'Razorpay and COD ready',
  },
  {
    icon: Package,
    title: 'Easy Returns',
    description: '7 days return policy',
  },
  {
    icon: CheckCircle,
    title: 'Authentic Products',
    description: 'Curated and verified',
  },
]

const whyChooseItems = [
  {
    icon: Users,
    title: '10,000+ Happy Customers',
    description:
      'A complete storefront experience with accounts, orders, and customer-first flows.',
  },
  {
    icon: BadgeCheck,
    title: 'Quality Assured',
    description:
      'Curated products, rich product pages, reviews, and polished discovery paths.',
  },
  {
    icon: Star,
    title: '5-Star Service',
    description:
      'Supportive order tracking, returns guidance, and confidence-building shopping details.',
  },
]

const promoItems = [
  'Free delivery above ₹499',
  'Secure Razorpay payments',
  '7 day return policy',
  'Curated new arrivals',
  'Fresh catalog updates',
]

function getNextMidnightIST(): Date {
  const OFFSET_MS = 5.5 * 60 * 60 * 1000 // IST offset in milliseconds (UTC+5:30)
  const now = Date.now()
  // Current time adjusted to IST perspective
  const nowIST = new Date(now + OFFSET_MS)
  const year = nowIST.getUTCFullYear()
  const month = nowIST.getUTCMonth()
  const day = nowIST.getUTCDate()
  // Create a timestamp for midnight IST of that day (in UTC it's 18:30 previous day)
  const midnightIST = new Date(Date.UTC(year, month, day, 0, 0, 0) - OFFSET_MS)
  // If this midnight has already passed, add 24 hours
  if (midnightIST.getTime() <= now) {
    midnightIST.setTime(midnightIST.getTime() + 24 * 60 * 60 * 1000)
  }
  return midnightIST
}

async function getFeaturedProducts() {
  try {
    await dbConnect()
    const products = await Product.find({ isFeatured: true, isActive: true })
      .limit(8)
      .lean()
    return { data: products }
  } catch (error) {
    console.error('Failed to fetch featured products:', error)
    return { data: [] }
  }
}

async function getCategories() {
  try {
    await dbConnect()
    const categories = await Category.find({ isActive: true })
      .populate('parent', 'name slug')
      .populate('children', 'name slug image')
      .sort({ name: 1 })
      .lean()

    // Build tree structure
    const buildCategoryTree = (cats: any[]) => {
      const map = new Map()
      const roots: any[] = []

      cats.forEach((cat) => {
        map.set(cat._id.toString(), { ...cat, children: [] })
      })

      cats.forEach((cat) => {
        const node = map.get(cat._id.toString())
        if (cat.parent) {
          const parentNode = map.get(cat.parent._id.toString())
          if (parentNode) {
            parentNode.children.push(node)
          }
        } else {
          roots.push(node)
        }
      })

      return roots
    }

    const categoryTree = buildCategoryTree(categories)

    const flatCategories = categories.map((cat: any) => ({
      _id: cat._id,
      name: cat.name,
      slug: cat.slug,
      image: cat.image,
      parent: cat.parent,
      hasChildren: cat.children && cat.children.length > 0,
    }))

    return { data: { tree: categoryTree, flat: flatCategories } }
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return { data: { tree: [], flat: [] } }
  }
}

async function getFlashSaleProducts() {
  try {
    await dbConnect()
    const products = await Product.find({
      isActive: true,
      discountPercent: { $gte: 20 },
    })
      .sort({ discountPercent: -1 })
      .limit(8)
      .lean()
    return { data: products }
  } catch (error) {
    console.error('Failed to fetch flash sale products:', error)
    return { data: [] }
  }
}

async function getBestSellers() {
  try {
    await dbConnect()
    const products = await Product.find({ isActive: true })
      .sort({ soldCount: -1 })
      .limit(8)
      .lean()
    return { data: products }
  } catch (error) {
    console.error('Failed to fetch best sellers:', error)
    return { data: [] }
  }
}

async function getNewArrivals() {
  try {
    await dbConnect()
    const products = await Product.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean()
    return { data: products }
  } catch (error) {
    console.error('Failed to fetch new arrivals:', error)
    return { data: [] }
  }
}

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  align = 'between',
}: {
  eyebrow: string
  title: string
  description?: string
  action?: ReactNode
  align?: 'center' | 'between'
}) {
  if (align === 'center') {
    return (
      <div className="mx-auto mb-10 max-w-3xl text-center home-reveal">
        <span className="mb-3 inline-flex rounded-full border border-amber-300/40 bg-amber-100/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-200">
          {eyebrow}
        </span>
        <h2 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
          {title}
        </h2>
        {description && (
          <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300">
            {description}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between home-reveal">
      <div className="max-w-2xl">
        <span className="mb-3 inline-flex rounded-full border border-amber-300/40 bg-amber-100/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-200">
          {eyebrow}
        </span>
        <h2 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
          {title}
        </h2>
        {description && (
          <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

function TrustCard({
  icon: Icon,
  title,
  description,
  delay = 0,
}: {
  icon: LucideIcon
  title: string
  description: string
  delay?: number
}) {
  return (
    <div
      className="home-reveal rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_22px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(15,23,42,0.13)] dark:border-white/10 dark:bg-slate-900/80 dark:shadow-[0_22px_55px_rgba(0,0,0,0.28)] dark:hover:shadow-[0_28px_70px_rgba(0,0,0,0.35)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-amber-300 shadow-lg shadow-slate-950/15 dark:bg-amber-300 dark:text-slate-950 dark:shadow-amber-300/10">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-bold text-slate-950 dark:text-white">{title}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>
        </div>
      </div>
    </div>
  )
}

function HeroProductCollage({ products }: { products: HomeProduct[] }) {
  const collageProducts = products
    .filter((product) => product.images?.[0]?.url)
    .slice(0, 2)

  const primary = collageProducts[0]
  const secondary = collageProducts[1]

  return (
    <div className="relative min-h-[360px] lg:min-h-[500px]">
      <div className="absolute left-8 top-12 h-56 w-56 rounded-full bg-amber-300/30 blur-3xl home-orbit" />
      <div className="absolute bottom-8 right-10 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl home-orbit-reverse" />

      <div className="absolute right-4 top-6 z-10 w-48 overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 p-3 shadow-[0_28px_80px_rgba(15,23,42,0.22)] backdrop-blur-xl home-float dark:border-white/10 dark:bg-slate-900/85 dark:shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
        <ProductVisual product={primary} priority />
        <div className="mt-3">
          <p className="line-clamp-1 text-sm font-bold text-slate-950 dark:text-white">
            {primary?.name || 'Curated premium drop'}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {primary ? formatCurrency(primary.discountedPrice || primary.price) : 'Fresh arrivals'}
          </p>
        </div>
      </div>

      <div className="absolute bottom-10 left-0 z-20 w-40 rotate-[-8deg] overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/90 p-3 shadow-[0_24px_70px_rgba(15,23,42,0.2)] backdrop-blur-xl home-float-slower dark:border-white/10 dark:bg-slate-900/85 dark:shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
        <ProductVisual product={secondary} />
        <div className="mt-3">
          <p className="line-clamp-1 text-sm font-bold text-slate-950 dark:text-white">
            {secondary?.name || 'Selected essentials'}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Editorial pick</p>
        </div>
      </div>

      <div className="absolute bottom-24 right-0 z-30 rounded-full border border-slate-900/10 bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-2xl home-shimmer">
        Premium build
      </div>

      <div className="absolute left-10 top-4 z-30 rounded-2xl border border-white/70 bg-white/75 px-4 py-3 text-sm text-slate-700 shadow-xl backdrop-blur-xl home-reveal home-delay-4 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-300">
        <span className="font-black text-slate-950 dark:text-white">4.8</span> average rating
      </div>
    </div>
  )
}

function ProductVisual({
  product,
  priority = false,
}: {
  product?: HomeProduct
  priority?: boolean
}) {
  const imageUrl = product?.images?.[0]?.url

  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-[1.35rem] bg-gradient-to-br from-amber-100 via-slate-100 to-sky-100 dark:from-slate-800 dark:via-slate-900 dark:to-sky-950">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={product?.name || 'Featured product'}
          fill
          priority={priority}
          className="object-cover"
          sizes="(max-width: 768px) 45vw, 240px"
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <Gem className="h-12 w-12 text-slate-300 dark:text-slate-600" />
        </div>
      )}
    </div>
  )
}

function HomeProductCard({
  product,
  badge,
  dark = false,
}: {
  product: HomeProduct
  badge?: string
  dark?: boolean
}) {
  const currentPrice = product.discountedPrice || product.price
  const hasDiscount = Boolean(product.discountedPrice && product.discountedPrice < product.price)
  const imageUrl = product.images?.[0]?.url
  const cardClass = dark
    ? 'border-white/10 bg-white text-slate-950 dark:bg-slate-50 dark:text-slate-950'
    : 'border-slate-200/80 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-900/90 dark:shadow-[0_18px_50px_rgba(0,0,0,0.28)]'
  const titleClass = dark
    ? 'text-slate-950 group-hover:text-amber-700'
    : 'text-slate-950 group-hover:text-amber-700 dark:text-white dark:group-hover:text-amber-300'
  const descriptionClass = dark
    ? 'text-slate-600'
    : 'text-slate-600 dark:text-slate-300'
  const priceClass = dark
    ? 'text-slate-950'
    : 'text-slate-950 dark:text-white'

  return (
    <Card
      className={`group overflow-hidden rounded-[1.75rem] border transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_28px_80px_rgba(15,23,42,0.16)] ${
        cardClass
      }`}
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-amber-100 via-slate-100 to-sky-100 dark:from-slate-800 dark:via-slate-900 dark:to-sky-950">
              <Package className="h-16 w-16 text-slate-300 dark:text-slate-600" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent opacity-70 transition-opacity group-hover:opacity-90" />
          <div className="absolute left-3 top-3 flex flex-col gap-2">
            {badge && (
              <Badge className="rounded-full bg-slate-950/90 px-3 py-1 text-xs text-white backdrop-blur">
                {badge}
              </Badge>
            )}
            {hasDiscount && (
              <Badge className="rounded-full bg-amber-400 px-3 py-1 text-xs text-slate-950">
                {product.discountPercent || Math.round(((product.price - currentPrice) / product.price) * 100)}% off
              </Badge>
            )}
          </div>
        </div>
      </Link>
      <CardContent className="p-5">
        <Link href={`/products/${product.slug}`}>
          <h3 className={`line-clamp-2 text-lg font-black tracking-tight transition-colors ${titleClass}`}>
            {product.name}
          </h3>
        </Link>
        {product.shortDescription && (
          <p className={`mt-2 line-clamp-2 text-sm leading-6 ${descriptionClass}`}>
            {product.shortDescription}
          </p>
        )}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`text-xl font-black ${priceClass}`}>
              {formatCurrency(currentPrice)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-slate-400 line-through">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>
          <div className="flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
            <Star className="mr-1 h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            {(product.ratings?.average || 0).toFixed(1)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function HomePage() {
  const [featuredData, categoriesData, flashSaleData, newArrivalsData, bestSellersData] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
    getFlashSaleProducts(),
    getNewArrivals(),
    getBestSellers(),
  ])

  const featuredProducts = (featuredData.data || []).map(toPlainObject) as HomeProduct[]
  const categories = (categoriesData.data?.flat || []).map(toPlainObject) as HomeCategory[]
  const flashSaleProducts = (flashSaleData.data || []).map(toPlainObject) as HomeProduct[]
  const newArrivals = (newArrivalsData.data || []).map(toPlainObject) as HomeProduct[]
  const bestSellers = (bestSellersData.data || []).map(toPlainObject) as HomeProduct[]
  const heroProducts = [...featuredProducts, ...newArrivals, ...bestSellers]

  // Calculate countdown to next midnight IST
  const flashSaleEnds = getNextMidnightIST()

  return (
    <div className="min-h-screen overflow-hidden bg-[#f8f5ef] text-slate-950 dark:bg-slate-950 dark:text-white">
      <style>{`
@keyframes homeFadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes homeFloat {
  0%, 100% { transform: translateY(0) rotate(4deg); }
  50% { transform: translateY(-14px) rotate(1deg); }
}
@keyframes homeFloatSlow {
  0%, 100% { transform: translateY(0) rotate(-8deg); }
  50% { transform: translateY(12px) rotate(-4deg); }
}
@keyframes homeOrbit {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(20px, -18px, 0) scale(1.08); }
}
@keyframes homeOrbitReverse {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(-18px, 18px, 0) scale(1.06); }
}
@keyframes homeTicker {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.home-reveal {
  opacity: 0;
  animation: homeFadeUp 0.8s cubic-bezier(.22,1,.36,1) forwards;
}
.home-delay-1 { animation-delay: 120ms; }
.home-delay-2 { animation-delay: 220ms; }
.home-delay-3 { animation-delay: 340ms; }
.home-delay-4 { animation-delay: 460ms; }
.home-float { animation: homeFloat 7s ease-in-out infinite; }
.home-float-slower { animation: homeFloatSlow 8s ease-in-out infinite; }
.home-orbit { animation: homeOrbit 11s ease-in-out infinite; }
.home-orbit-reverse { animation: homeOrbitReverse 13s ease-in-out infinite; }
.home-ticker-track { animation: homeTicker 28s linear infinite; }
.home-shimmer { position: relative; overflow: hidden; }
.home-shimmer::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-120%);
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.32), transparent);
  animation: homeTicker 3.8s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .home-reveal,
  .home-float,
  .home-float-slower,
  .home-orbit,
  .home-orbit-reverse,
  .home-ticker-track,
  .home-shimmer::after {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
  * {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
`}</style>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(245,158,11,0.22),transparent_26%),radial-gradient(circle_at_86%_18%,rgba(125,211,252,0.14),transparent_28%),linear-gradient(135deg,#020617_0%,#0f172a_46%,#f8f5ef_46%,#e7dfd2_100%)] dark:bg-[radial-gradient(circle_at_18%_20%,rgba(245,158,11,0.22),transparent_26%),radial-gradient(circle_at_86%_18%,rgba(125,211,252,0.14),transparent_28%),linear-gradient(135deg,#020617_0%,#0f172a_46%,#111827_46%,#020617_100%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:54px_54px]" />
        <div className="container relative z-10 mx-auto px-4 py-20 md:py-28 lg:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
            <div className="max-w-4xl">
              <Badge className="home-reveal mb-5 rounded-full border border-amber-300/30 bg-amber-300/15 px-4 py-1.5 text-amber-100 hover:bg-amber-300/20">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Premium commerce experience
              </Badge>
              <h1 className="home-reveal home-delay-1 max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.075em] md:text-7xl lg:text-8xl">
                Discover your <span className="text-amber-300">perfect style.</span>
              </h1>
              <p className="home-reveal home-delay-2 mt-7 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
                A curated shopping experience with polished product discovery, secure checkout, and a production-grade storefront recruiters can immediately feel.
              </p>
              <div className="home-reveal home-delay-3 mt-9 flex flex-col gap-4 sm:flex-row">
                <Button size="lg" asChild className="rounded-full bg-white px-7 text-base font-bold text-slate-950 shadow-2xl shadow-amber-500/10 transition-transform hover:-translate-y-0.5 hover:bg-amber-100">
                  <Link href="/products">
                    Shop the Collection <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-full border-white/20 bg-white/10 px-7 text-base font-bold text-white backdrop-blur hover:bg-white/20" asChild>
                  <Link href="/products?sort=discount">
                    View Today&apos;s Deals <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>

            <HeroProductCollage products={heroProducts} />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#f8f5ef] to-transparent dark:from-slate-950" />
      </section>

      {/* Trust Badges */}
      <section className="relative z-20 -mt-10 pb-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {trustItems.map((item, index) => (
              <TrustCard
                key={item.title}
                icon={item.icon}
                title={item.title}
                description={item.description}
                delay={index * 90}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <SectionHeader
            eyebrow="Shop by mood"
            title="Curated categories, elevated browsing"
            description="Recruiters see the structure. Customers see a smooth path into the catalog."
            action={(
              <Button variant="outline" asChild className="rounded-full border-slate-300 bg-white/80 font-semibold shadow-sm hover:bg-white dark:border-white/10 dark:bg-slate-900/70 dark:text-white dark:hover:bg-slate-800">
                <Link href="/products">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          />

          <Suspense fallback={<div className="grid grid-cols-2 gap-4 md:grid-cols-4"><Skeleton className="h-48" /><Skeleton className="h-48" /><Skeleton className="h-48" /><Skeleton className="h-48" /></div>}>
            {categories.length > 0 ? (
              <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-5">
                {categories.slice(0, 8).map((category, index) => (
                  <Link
                    key={String(category._id)}
                    href={`/category/${category.slug}`}
                    className="group home-reveal relative w-64 flex-shrink-0 snap-start overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_28px_80px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-slate-900 dark:shadow-[0_18px_50px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_28px_80px_rgba(0,0,0,0.38)]"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div className="relative aspect-[4/5] bg-slate-100 dark:bg-slate-800">
                      {category.image?.url ? (
                        <Image
                          src={category.image.url}
                          alt={category.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                          sizes="256px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-100 via-slate-100 to-sky-100 dark:from-slate-800 dark:via-slate-900 dark:to-sky-950">
                          <span className="text-6xl font-black text-slate-300 dark:text-slate-600">
                            {category.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                      <p className="text-xl font-black tracking-tight">{category.name}</p>
                      <div className="mt-3 flex items-center justify-between text-sm text-white/80">
                        <span>{category.hasChildren ? 'Explore subcategories' : 'Open collection'}</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 py-12 text-center dark:border-white/15 dark:bg-slate-900/70">
                <p className="text-slate-500 dark:text-slate-400">No categories available</p>
              </div>
            )}
          </Suspense>
        </div>
      </section>

      {/* Featured Products */}
      <section className="relative py-20">
        <div className="absolute inset-0 bg-white/55 dark:bg-slate-900/35" />
        <div className="container relative mx-auto px-4">
          <SectionHeader
            eyebrow="Featured edit"
            title="Products that lead the first impression"
            description="A clean premium section around the existing interactive product cards."
            action={(
              <Button variant="outline" asChild className="rounded-full border-slate-300 bg-white font-semibold shadow-sm hover:bg-amber-50 dark:border-white/10 dark:bg-slate-900/80 dark:text-white dark:hover:bg-slate-800">
                <Link href="/products?isFeatured=true">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          />

          <Suspense fallback={<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"><Skeleton className="h-80" /><Skeleton className="h-80" /><Skeleton className="h-80" /><Skeleton className="h-80" /></div>}>
            {featuredProducts.length > 0 ? (
              <div className="rounded-[2rem] border border-white/70 bg-[#f8f5ef]/80 p-4 shadow-[0_22px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-950/70 dark:shadow-[0_22px_70px_rgba(0,0,0,0.28)] md:p-6">
                <ProductGrid products={featuredProducts} />
              </div>
            ) : (
              <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 py-12 text-center dark:border-white/15 dark:bg-slate-900/70">
                <p className="text-slate-500 dark:text-slate-400">No featured products</p>
              </div>
            )}
          </Suspense>
        </div>
      </section>

      {/* Flash Sale */}
      {flashSaleProducts.length > 0 && (
        <section className="relative overflow-hidden bg-slate-950 py-20 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(251,191,36,0.25),transparent_26%),radial-gradient(circle_at_88%_80%,rgba(14,165,233,0.18),transparent_30%)]" />
          <div className="container relative mx-auto px-4">
            <div className="mb-9 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="home-reveal max-w-2xl">
                <Badge className="mb-4 rounded-full bg-amber-300 px-4 py-1.5 text-slate-950 hover:bg-amber-300">
                  <Zap className="mr-2 h-3.5 w-3.5" />
                  Limited time
                </Badge>
                <h2 className="text-4xl font-black tracking-tight md:text-5xl">Flash sale, refined.</h2>
                <div className="mt-4 flex flex-col gap-3 text-slate-300 sm:flex-row sm:items-center">
                  <p>Ends in:</p>
                  <CountdownTimer targetDate={flashSaleEnds} />
                </div>
              </div>
              <Button variant="outline" asChild className="home-reveal home-delay-2 rounded-full border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20">
                <Link href="/products?sort=discount">
                  View All Deals <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {flashSaleProducts.slice(0, 4).map((product, index) => (
                <div key={String(product._id)} className="home-reveal" style={{ animationDelay: `${index * 90}ms` }}>
                  <HomeProductCard product={product} badge="Flash deal" dark />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <SectionHeader
            eyebrow="Fresh arrivals"
            title="New pieces with a calmer reveal"
            description="The product data stays the same, but the presentation now feels curated and portfolio-grade."
            action={(
              <Button variant="outline" asChild className="rounded-full border-slate-300 bg-white/80 font-semibold shadow-sm hover:bg-white dark:border-white/10 dark:bg-slate-900/70 dark:text-white dark:hover:bg-slate-800">
                <Link href="/products?sortBy=createdAt&sortOrder=desc">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          />

          {newArrivals.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {newArrivals.map((product, index) => (
                <div key={String(product._id)} className="home-reveal" style={{ animationDelay: `${index * 70}ms` }}>
                  <HomeProductCard product={product} badge="New arrival" />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/70 py-12 text-center dark:border-white/15 dark:bg-slate-900/70">
              <p className="text-slate-500 dark:text-slate-400">No new arrivals yet</p>
            </div>
          )}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="border-y border-slate-200 bg-white py-4 dark:border-white/10 dark:bg-slate-900">
        <div className="flex overflow-hidden">
          <div className="home-ticker-track flex min-w-full shrink-0 gap-3 pr-3">
            {[...promoItems, ...promoItems].map((item, index) => (
              <span
                key={`${item}-${index}`}
                className="inline-flex items-center rounded-full bg-slate-950 px-5 py-2 text-sm font-bold text-white"
              >
                <Sparkles className="mr-2 h-3.5 w-3.5 text-amber-300" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-4">
            <SectionHeader
              eyebrow="Customer favorites"
              title="Best sellers with boardroom polish"
              description="A tighter card system makes the existing catalog feel more intentional."
              action={(
                <Button variant="outline" asChild className="rounded-full border-slate-300 bg-white/80 font-semibold shadow-sm hover:bg-white dark:border-white/10 dark:bg-slate-900/70 dark:text-white dark:hover:bg-slate-800">
                  <Link href="/products?sortBy=soldCount&sortOrder=desc">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {bestSellers.slice(0, 4).map((product, index) => (
                <div key={String(product._id)} className="home-reveal" style={{ animationDelay: `${index * 80}ms` }}>
                  <HomeProductCard product={product} badge="Best seller" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="relative py-20">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(251,191,36,0.18),transparent_24%),radial-gradient(circle_at_90%_75%,rgba(56,189,248,0.16),transparent_26%)]" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto mb-12 max-w-3xl text-center home-reveal">
            <span className="mb-3 inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
              Why customers love us
            </span>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Trust signals with a production feel
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-300">
              This section speaks to shoppers, but it also quietly proves the app has real ecommerce depth.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {whyChooseItems.map((item, index) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="home-reveal rounded-[2rem] border border-white/10 bg-white/10 p-7 text-white shadow-[0_22px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl transition-transform duration-500 hover:-translate-y-2"
                  style={{ animationDelay: `${index * 110}ms` }}
                >
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-300 text-slate-950">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-black">{item.title}</h3>
                  <p className="mt-3 leading-7 text-slate-300">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-[#f8f5ef] py-20 dark:bg-slate-950">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/70 bg-white p-8 text-center shadow-[0_28px_90px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-slate-900 dark:shadow-[0_28px_90px_rgba(0,0,0,0.32)] md:p-12">
            <div className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-amber-200/70 blur-3xl home-orbit" />
            <div className="absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-sky-200/70 blur-3xl home-orbit-reverse" />
            <div className="relative mx-auto max-w-2xl">
              <Badge className="mb-4 rounded-full bg-slate-950 px-4 py-1.5 text-white hover:bg-slate-900">
                <CreditCard className="mr-2 h-3.5 w-3.5 text-amber-300" />
                Stay in the loop
              </Badge>
              <h2 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                Get the best drops before they disappear
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
                Subscribe for new arrivals, exclusive offers, and product updates from the store.
              </p>
              <div className="mx-auto mt-8 max-w-xl">
                <NewsletterForm />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
