// File path: src/components/shared/InvoiceDownload.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { Download } from 'lucide-react'
import type { IOrder } from '@/models/Order'

interface InvoiceDownloadProps {
  order: IOrder
  storeName?: string
  storeEmail?: string
  storeAddress?: string
  storePhone?: string
  currency?: string
  currencySymbol?: string
}

export default function InvoiceDownload({
  order,
  storeName = 'E-Shop',
  storeEmail = 'contact@eshop.com',
  storeAddress = '123 Commerce Street, India',
  storePhone = '+91 9876543210',
  currency = 'INR',
  currencySymbol = '₹',
}: InvoiceDownloadProps) {
  const [loading, setLoading] = useState(false)
  const [LinkComponent, setLinkComponent] = useState<any>(null)

  const handleDownload = async () => {
    if (loading) return
    setLoading(true)
    try {
      // Dynamically import to avoid SSR issues and reduce initial bundle size
      const { PDFDownloadLink } = await import('@react-pdf/renderer')
      const { InvoicePDF } = await import('@/lib/invoice')

      // Cast to any to allow custom 'auto' prop for triggering auto-download
      const PDFDownloadLinkAny = PDFDownloadLink as any

      // Create a wrapper component that triggers auto download
      const AutoDownloadLink = () => (
        <PDFDownloadLinkAny
          document={
            <InvoicePDF
              data={{
                // Cast order to any to satisfy populated user type
                order: order as any,
                storeName,
                storeEmail,
                storeAddress,
                storePhone,
                currency,
                currencySymbol,
              }}
            />
          }
          fileName={`invoice-${order.orderNumber}.pdf`}
          auto
        >
          {() => null}
        </PDFDownloadLinkAny>
      )

      // Set the component to trigger download
      setLinkComponent(() => AutoDownloadLink)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to generate invoice',
        variant: 'destructive',
      })
      setLoading(false)
    }
  }

  // When LinkComponent changes, trigger download and reset after a delay
  useEffect(() => {
    if (LinkComponent) {
      const timer = setTimeout(() => {
        setLinkComponent(null)
        setLoading(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [LinkComponent])

  return (
    <>
      <Button variant="outline" className="gap-2" onClick={handleDownload} disabled={loading || !!LinkComponent}>
        <Download className="h-4 w-4" />
        {loading ? 'Generating...' : 'Download Invoice'}
      </Button>
      {LinkComponent && <LinkComponent />}
    </>
  )
}
