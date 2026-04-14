'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface ProductImage {
  url: string
  publicId?: string
}

interface ProductImageGalleryProps {
  images: ProductImage[]
  productName: string
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const validImages = (images || []).filter((image) => typeof image?.url === 'string' && image.url.trim())
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)

  if (validImages.length === 0) {
    return (
      <div className="aspect-square relative bg-muted rounded-lg overflow-hidden flex items-center justify-center">
        <span className="text-muted-foreground">No Image</span>
      </div>
    )
  }

  const safeSelectedIndex = Math.min(selectedIndex, validImages.length - 1)
  const currentImage = validImages[safeSelectedIndex]

  const openZoom = (index: number) => {
    setSelectedIndex(index)
    setZoomOpen(true)
  }

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIndex((prev) => (prev + 1) % validImages.length)
  }

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIndex((prev) => (prev - 1 + validImages.length) % validImages.length)
  }

  return (
    <>
      <div className="space-y-4">
        {/* Main Image with Zoom */}
        <div
          className="aspect-square relative rounded-lg overflow-hidden cursor-zoom-in border bg-white"
          onClick={() => openZoom(safeSelectedIndex)}
        >
          <Image
            src={currentImage.url}
            alt={productName}
            fill
            className="object-contain p-4 transition-transform hover:scale-[1.02] duration-300"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>

        {/* Thumbnails */}
        {validImages.length > 1 && (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {validImages.map((img, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`relative h-20 w-20 shrink-0 rounded-md overflow-hidden border-2 bg-white transition-colors ${
                  index === safeSelectedIndex ? 'border-primary' : 'border-transparent hover:border-primary/50'
                }`}
              >
                <Image
                  src={img.url}
                  alt={`${productName} ${index + 1}`}
                  fill
                  className="object-contain p-1.5"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zoom Modal */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-black/90 border-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Image Preview</DialogTitle>
            <DialogDescription>Zoomed product image</DialogDescription>
          </DialogHeader>
          <div className="relative w-full h-full flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 z-10 text-white hover:bg-white/20"
              onClick={() => setZoomOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation buttons */}
            {validImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                  onClick={prevImage}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                  onClick={nextImage}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </Button>
              </>
            )}

            {/* Zoomed Image */}
            <div className="relative w-full h-full flex items-center justify-center p-16">
              <Image
                src={validImages[safeSelectedIndex].url}
                alt={`${productName} ${safeSelectedIndex + 1}`}
                width={1200}
                height={1200}
                className="max-w-full max-h-full object-contain"
                priority
              />
            </div>

            {/* Image counter */}
            {validImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {safeSelectedIndex + 1} / {validImages.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
