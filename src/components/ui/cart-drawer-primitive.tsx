'use client'

import * as React from 'react'
import * as CartDrawerPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const CartDrawer = CartDrawerPrimitive.Root
const CartDrawerTrigger = CartDrawerPrimitive.Trigger
const CartDrawerPortal = CartDrawerPrimitive.Portal
const CartDrawerClose = CartDrawerPrimitive.Close

const CartDrawerOverlay = React.forwardRef<
  React.ElementRef<typeof CartDrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof CartDrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <CartDrawerPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
))
CartDrawerOverlay.displayName = CartDrawerPrimitive.Overlay.displayName

const CartDrawerContent = React.forwardRef<
  React.ElementRef<typeof CartDrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof CartDrawerPrimitive.Content> & {
    side?: 'top' | 'bottom' | 'left' | 'right'
  }
>(({ className, children, side = 'right', ...props }, ref) => (
  <CartDrawerPortal>
    <CartDrawerOverlay />
    <CartDrawerPrimitive.Content
      ref={ref}
      className={cn(
        'fixed z-50 flex h-full w-full max-w-md flex-col border bg-background shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500',
        side === 'right' &&
          'inset-y-0 right-0 data-[state=closed]:translate-x-full data-[state=open]:translate-x-0',
        side === 'left' &&
          'inset-y-0 left-0 data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0',
        side === 'top' &&
          'inset-x-0 top-0 data-[state=closed]:translate-y-full data-[state=open]:translate-y-0',
        side === 'bottom' &&
          'inset-x-0 bottom-0 data-[state=closed]:translate-y-full data-[state=open]:translate-y-0',
        className
      )}
      {...props}
    >
      {children}
    </CartDrawerPrimitive.Content>
  </CartDrawerPortal>
))
CartDrawerContent.displayName = CartDrawerPrimitive.Content.displayName

const CartDrawerHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-2 text-center sm:text-left p-6 pb-2', className)}
    {...props}
  />
))
CartDrawerHeader.displayName = 'CartDrawerHeader'

const CartDrawerFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col gap-2 p-6 pt-2', className)}
    {...props}
  />
))
CartDrawerFooter.displayName = 'CartDrawerFooter'

const CartDrawerTitle = React.forwardRef<
  React.ElementRef<typeof CartDrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof CartDrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <CartDrawerPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold', className)}
    {...props}
  />
))
CartDrawerTitle.displayName = CartDrawerPrimitive.Title.displayName

const CartDrawerCloseButton = React.forwardRef<
  React.ElementRef<typeof CartDrawerPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof CartDrawerPrimitive.Close>
>(({ className, ...props }, ref) => (
  <CartDrawerPrimitive.Close
    ref={ref}
    className={cn(
      'absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground',
      className
    )}
    {...props}
  >
    <X className="h-4 w-4" />
    <span className="sr-only">Close</span>
  </CartDrawerPrimitive.Close>
))
CartDrawerCloseButton.displayName = CartDrawerPrimitive.Close.displayName

export {
  CartDrawer,
  CartDrawerPortal,
  CartDrawerClose,
  CartDrawerOverlay,
  CartDrawerTrigger,
  CartDrawerContent,
  CartDrawerHeader,
  CartDrawerFooter,
  CartDrawerTitle,
  CartDrawerCloseButton,
}
