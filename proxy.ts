import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export default auth((req) => {
  const path = req.nextUrl.pathname

  if (path === '/sign-in' || path === '/sign-up') {
    if (req.auth) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  }

  if (path.startsWith('/admin')) {
    if (!req.auth) {
      return NextResponse.redirect(new URL('/sign-in?callbackUrl=' + encodeURIComponent(path), req.url))
    }

    if (req.auth.user?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }

    return NextResponse.next()
  }

  const protectedRoutes = ['/cart', '/checkout', '/payment', '/orders', '/profile']
  const isProtected = protectedRoutes.some((route) => path === route || path.startsWith(route + '/'))

  if (isProtected) {
    if (!req.auth) {
      return NextResponse.redirect(new URL('/sign-in?callbackUrl=' + encodeURIComponent(path), req.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/admin/:path*',
    '/cart/:path*',
    '/checkout',
    '/payment/:path*',
    '/orders/:path*',
    '/profile/:path*',
    '/sign-in',
    '/sign-up',
  ],
}
