// src/components/layout/navbar.tsx
'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  ShoppingBag,
  Search,
  User,
  Menu,
  X,
  Heart,
  LogOut,
  Package,
  Settings,
  LayoutDashboard,
} from 'lucide-react'
import { useState, useEffect } from 'react'
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

export function Navbar() {
  const router = useRouter()
  const { data: session } = useSession()
  const { getItemCount, toggleCart } = useCartStore()
  const { items: wishlistItems } = useWishlist()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isHydrated, setIsHydrated] = useState(false)

  const cartItemCount = getItemCount()
  const wishlistCount = wishlistItems.length

   
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true)
  }, [])

  const navItems = [
    { href: '/products', label: 'Products' },
    { href: '/categories', label: 'Categories' },
    { href: '/orders', label: 'Orders', authOnly: true },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
      setIsMobileMenuOpen(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold">E-Shop</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              if (item.authOnly && !session) return null
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          {/* Actions - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            <ModeToggle />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden"
            >
              <Search className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.href = '/wishlist'}
              className="relative"
            >
              <Heart className="h-5 w-5" />
              {isHydrated && wishlistCount > 0 && (
                <span className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-primary text-xs font-bold text-primary-foreground flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCart}
              className="relative"
            >
              <ShoppingBag className="h-5 w-5" />
              {isHydrated && cartItemCount > 0 && (
                <span className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-primary text-xs font-bold text-primary-foreground flex items-center justify-center">
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
                  <DropdownMenuLabel>
                    {session.user?.email}
                  </DropdownMenuLabel>
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

          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col gap-4 py-4">
                <div className="flex items-center justify-between mb-4">
                  <ModeToggle />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                </div>

                {isSearchOpen && (
                  <form onSubmit={handleSearch} className="mb-4">
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </form>
                )}

                {session && (
                  <div className="border-b pb-4 mb-4">
                    <p className="text-sm text-muted-foreground">
                      {session.user?.email}
                    </p>
                  </div>
                )}

                {navItems.map((item) => {
                  if (item.authOnly && !session) return null
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="text-lg font-medium py-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )
                })}

                {session && (
                  <>
                    <Link
                      href="/wishlist"
                      className="text-lg font-medium py-2 flex items-center"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Heart className="mr-2 h-5 w-5" />
                      Wishlist {isHydrated && `(${wishlistCount})`}
                    </Link>
                    <Link
                      href="/profile"
                      className="text-lg font-medium py-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                  </>
                )}

                {!session && (
                  <div className="flex flex-col gap-2 mt-4 border-t pt-4">
                    <Button asChild onClick={() => setIsMobileMenuOpen(false)}>
                      <Link href="/sign-in">Sign In</Link>
                    </Button>
                    <Button variant="outline" asChild onClick={() => setIsMobileMenuOpen(false)}>
                      <Link href="/sign-up">Sign Up</Link>
                    </Button>
                  </div>
                )}

                {session && (
                  <div className="flex flex-col gap-2 mt-4 border-t pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        signOut({ callbackUrl: '/' })
                        setIsMobileMenuOpen(false)
                      }}
                    >
                      Sign Out
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
