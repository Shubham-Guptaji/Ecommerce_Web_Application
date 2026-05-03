// src/components/layout/navbar.tsx
'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  ShoppingBag,
  Search,
  User,
  Menu,
  Heart,
  LogOut,
  Package,
  LayoutDashboard,
  Home,
  FolderTree,
  ChevronRight,
} from 'lucide-react'
import { useState, useSyncExternalStore } from 'react'
import { useCartStore } from '@/store/cartStore'
import { useWishlist } from '@/hooks/useWishlist'
import { ModeToggle } from '@/components/mode-toggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  authOnly?: boolean
  badge?: number
}

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const { getItemCount, toggleCart } = useCartStore()
  const { items: wishlistItems } = useWishlist()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  const cartItemCount = getItemCount()
  const wishlistCount = wishlistItems.length

  const navItems: NavItem[] = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/products', label: 'Products', icon: ShoppingBag },
    { href: '/categories', label: 'Categories', icon: FolderTree },
    { href: '/orders', label: 'Orders', icon: Package, authOnly: true },
  ]

  const accountItems: NavItem[] = [
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/wishlist', label: 'Wishlist', icon: Heart, badge: wishlistCount },
    ...(session?.user?.role === 'admin'
      ? [{ href: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard }]
      : []),
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const query = searchQuery.trim()
    if (!query) return

    router.push(`/products?search=${encodeURIComponent(query)}`)
    setIsMobileMenuOpen(false)
  }

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  const isActiveRoute = (href: string) => {
    if (!pathname) return false
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center space-x-2">
            <span className="truncate text-xl font-bold md:text-2xl">E-Shop</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              if (item.authOnly && !session) return null

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary',
                    isActiveRoute(item.href) && 'text-primary'
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="w-full pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <ModeToggle />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/wishlist')}
              className="relative"
            >
              <Heart className="h-5 w-5" />
              {isHydrated && wishlistCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {wishlistCount}
                </span>
              )}
            </Button>

            <Button variant="ghost" size="icon" onClick={toggleCart} className="relative">
              <ShoppingBag className="h-5 w-5" />
              {isHydrated && cartItemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {cartItemCount}
                </span>
              )}
            </Button>

            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{session.user?.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="flex items-center">
                      <Package className="mr-2 h-4 w-4" />
                      Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wishlist" className="flex items-center">
                      <Heart className="mr-2 h-4 w-4" />
                      Wishlist
                    </Link>
                  </DropdownMenuItem>
                  {session.user?.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex items-center text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/sign-up">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-full"
              onClick={() => router.push('/wishlist')}
              aria-label="Open wishlist"
            >
              <Heart className="h-4 w-4" />
              {isHydrated && wishlistCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {wishlistCount}
                </span>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-full"
              onClick={toggleCart}
              aria-label="Open cart"
            >
              <ShoppingBag className="h-4 w-4" />
              {isHydrated && cartItemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {cartItemCount}
                </span>
              )}
            </Button>

            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
<SheetContent side="right" className="w-[92vw] max-w-sm border-l bg-background p-0">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <div className="flex h-full flex-col">
                  <div className="border-b bg-muted/40 px-5 pb-5 pt-10">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                          Menu
                        </p>
                        <p className="mt-1 truncate text-lg font-semibold">E-Shop</p>
                      </div>
                      <ModeToggle />
                    </div>

                    <form onSubmit={handleSearch} className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-11 rounded-xl border-0 bg-background pl-10 pr-4 shadow-sm"
                      />
                    </form>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          toggleCart()
                          closeMobileMenu()
                        }}
                        className="flex items-center justify-between rounded-2xl border bg-background px-4 py-3 text-left shadow-sm"
                      >
                        <div>
                          <p className="text-sm font-medium">Cart</p>
                          <p className="text-xs text-muted-foreground">
                            {isHydrated ? `${cartItemCount} items` : 'Your bag'}
                          </p>
                        </div>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          router.push('/wishlist')
                          closeMobileMenu()
                        }}
                        className="flex items-center justify-between rounded-2xl border bg-background px-4 py-3 text-left shadow-sm"
                      >
                        <div>
                          <p className="text-sm font-medium">Wishlist</p>
                          <p className="text-xs text-muted-foreground">
                            {isHydrated ? `${wishlistCount} saved` : 'Saved items'}
                          </p>
                        </div>
                        <Heart className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-3 py-4">
                    {session && (
                      <div className="mx-2 mb-5 rounded-2xl border bg-card px-4 py-3">
                        <p className="text-sm font-medium">Signed in</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {session.user?.email}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      {navItems.map((item) => {
                        if (item.authOnly && !session) return null

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              'flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
                              isActiveRoute(item.href)
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'hover:bg-muted'
                            )}
                            onClick={closeMobileMenu}
                          >
                            <span className="flex items-center gap-3">
                              <item.icon className="h-4 w-4" />
                              {item.label}
                            </span>
                            <ChevronRight className="h-4 w-4 opacity-60" />
                          </Link>
                        )
                      })}
                    </div>

                    {session && (
                      <div className="mt-6">
                        <p className="px-4 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                          Account
                        </p>
                        <div className="mt-2 space-y-2">
                          {accountItems.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={cn(
                                'flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
                                isActiveRoute(item.href)
                                  ? 'bg-primary text-primary-foreground shadow-sm'
                                  : 'hover:bg-muted'
                              )}
                              onClick={closeMobileMenu}
                            >
                              <span className="flex items-center gap-3">
                                <item.icon className="h-4 w-4" />
                                {item.label}
                              </span>
                              {typeof item.badge === 'number' && isHydrated && item.badge > 0 ? (
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                  {item.badge}
                                </span>
                              ) : (
                                <ChevronRight className="h-4 w-4 opacity-60" />
                              )}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t bg-background px-5 py-4">
                    {!session ? (
                      <div className="grid grid-cols-2 gap-3">
                        <Button asChild className="h-11 rounded-xl">
                          <Link href="/sign-in" onClick={closeMobileMenu}>
                            Sign In
                          </Link>
                        </Button>
                        <Button variant="outline" asChild className="h-11 rounded-xl">
                          <Link href="/sign-up" onClick={closeMobileMenu}>
                            Sign Up
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="h-11 w-full rounded-xl"
                        onClick={() => {
                          signOut({ callbackUrl: '/' })
                          closeMobileMenu()
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
