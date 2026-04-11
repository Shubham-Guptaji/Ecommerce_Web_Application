import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
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
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
