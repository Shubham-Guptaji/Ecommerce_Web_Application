'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

const Accordion = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    type?: 'single' | 'multiple'
    defaultValue?: string | string[]
    value?: string | string[]
    onValueChange?: (value: string | string[]) => void
    collapsible?: boolean
  }
>(({ className, type = 'single', defaultValue, value, onValueChange, collapsible = true, children, ...props }, ref) => {
  const [internalValue, setInternalValue] = React.useState<string | string[]>(
    defaultValue ?? (type === 'multiple' ? [] : '')
  )

  const currentValue = value !== undefined ? value : internalValue

  const handleValueChange = (newValue: string | string[]) => {
    if (value === undefined) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
  }

  const toggleValue = (itemValue: string) => {
    if (type === 'single') {
      if (currentValue === itemValue && collapsible) {
        handleValueChange('')
      } else {
        handleValueChange(itemValue)
      }
    } else {
      const values = Array.isArray(currentValue) ? currentValue : []
      if (values.includes(itemValue)) {
        handleValueChange(values.filter((v) => v !== itemValue))
      } else {
        handleValueChange([...values, itemValue])
      }
    }
  }

  return (
    <div ref={ref} className={cn('space-y-1', className)} {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement<AccordionItemProps>(child)) {
          const childValue = child.props.value
          return React.cloneElement(child, {
            isOpen: type === 'single' ? currentValue === childValue : (Array.isArray(currentValue) && currentValue.includes(childValue)),
            onToggle: () => toggleValue(childValue),
          } as Partial<AccordionItemProps>)
        }
        return child
      })}
    </div>
  )
})
Accordion.displayName = 'Accordion'

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  isOpen?: boolean
  onToggle?: () => void
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, value, isOpen, onToggle, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('border-b', className)} {...props}>
        {children}
      </div>
    )
  }
)
AccordionItem.displayName = 'AccordionItem'

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  isOpen?: boolean
  onToggle?: () => void
}

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, isOpen, onToggle, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-expanded={isOpen}
        className={cn(
          'flex w-full items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180',
          className
        )}
        onClick={onToggle}
        {...props}
      >
        {children}
        <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform duration-200', isOpen && 'rotate-180')} />
      </button>
    )
  }
)
AccordionTrigger.displayName = 'AccordionTrigger'

interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  isOpen?: boolean
}

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, isOpen, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className="overflow-hidden text-sm"
        data-state={isOpen ? 'open' : 'closed'}
        {...props}
      >
        <div className={cn('pb-4 pt-0', className)}>{children}</div>
      </div>
    )
  }
)
AccordionContent.displayName = 'AccordionContent'

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
