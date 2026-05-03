import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'
import { auth } from '@/lib/auth'
import { getSiteUrl } from '@/lib/site-url'

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'E-Shop — Best Products Online',
    template: '%s | E-Shop',
  },
  description: 'Shop the best products at unbeatable prices.',
  keywords: ['ecommerce', 'online shopping', 'electronics', 'fashion', 'home', 'deals'],
  authors: [{ name: 'E-Shop' }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteUrl,
    title: 'E-Shop — Best Products Online',
    description: 'Shop the best products at unbeatable prices.',
    siteName: 'E-Shop',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'E-Shop',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@eshop',
    creator: '@eshop',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  )
}
