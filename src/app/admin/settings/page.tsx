// src/app/admin/settings/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormField, FormLabel, FormControl } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Save, Upload, Trash2, Download, AlertTriangle } from 'lucide-react'
import Image from 'next/image'
import { Skeleton } from '@/components/shared/skeleton'

const settingsSchema = z.object({
  storeName: z.string().min(1, 'Store name is required'),
  storeEmail: z.string().email('Valid email is required'),
  storePhone: z.string().optional(),
  storeAddress: z.string().optional(),
  gstNumber: z.string().optional(),
  storeLogo: z
    .object({
      url: z.string(),
      publicId: z.string(),
    })
    .optional(),
  freeDeliveryThreshold: z.number().min(0),
  deliveryCharge: z.number().min(0),
  expressDeliveryCharge: z.number().min(0),
  taxRate: z.number().min(0).max(100),
  maintenanceMode: z.boolean().default(false),
})

type SettingsForm = z.infer<typeof settingsSchema>

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [logoUploading, setLogoUploading] = useState(false)
  const [maintenanceSaving, setMaintenanceSaving] = useState(false)

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      storeName: '',
      storeEmail: '',
      storePhone: '',
      storeAddress: '',
      gstNumber: '',
      storeLogo: undefined,
      freeDeliveryThreshold: 0,
      deliveryCharge: 0,
      expressDeliveryCharge: 0,
      taxRate: 0,
      maintenanceMode: false,
    },
  })

   
   
   
  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/settings')
      const result = await response.json()

      if (result.success) {
        const data = result.data
        form.reset({
          storeName: data.storeName || 'E-Shop',
          storeEmail: data.storeEmail || 'contact@eshop.com',
          storePhone: data.storePhone || '',
          storeAddress: data.storeAddress || '',
          gstNumber: data.gstNumber || '',
          storeLogo: data.storeLogo || undefined,
          freeDeliveryThreshold: data.freeDeliveryThreshold || 499,
          deliveryCharge: data.deliveryCharge || 49,
          expressDeliveryCharge: data.expressDeliveryCharge || 99,
          taxRate: data.taxRate || 18,
          maintenanceMode: data.maintenanceMode || false,
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      console.error('Failed to fetch settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive',
      })
    } finally {
      setInitialLoading(false)
    }
  }, [form])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const saveSettings = async (data: SettingsForm) => {
    const response = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to save settings')
    }

    return result
  }

  const onSubmit = async (data: SettingsForm) => {
    setLoading(true)
    try {
      await saveSettings(data)
      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'store')

    setLogoUploading(true)
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        const logoUrl = result.data.url
        const logoPublicId = result.data.publicId

        // Update settings with new logo
        await saveSettings({
          ...form.getValues(),
          storeLogo: { url: logoUrl, publicId: logoPublicId },
        })

        toast({
          title: 'Success',
          description: 'Logo uploaded successfully',
        })
        fetchSettings() // Refresh to get updated logo
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLogoUploading(false)
    }
  }

  const handleRemoveLogo = async () => {
    try {
      await saveSettings({
        ...form.getValues(),
        storeLogo: undefined,
      })

      toast({
        title: 'Success',
        description: 'Logo removed',
      })
      fetchSettings()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to remove logo',
        variant: 'destructive',
      })
    }
  }

  const handleClearAllCarts = async () => {
    if (!confirm('Are you sure you want to clear all shopping carts? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/admin/carts/clear', { method: 'POST' })
      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: 'Success',
          description: 'All carts have been cleared',
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to clear carts',
        variant: 'destructive',
      })
    }
  }

  const handleExportAllData = async () => {
    try {
      // This would typically export orders, users, products etc.
      // For now, we'll just export orders as a sample
      const response = await fetch('/api/admin/orders/export?limit=1000')
      const blob = await response.blob()

      if (response.ok) {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `all-data-export-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: 'Success',
          description: 'Data export started',
        })
      } else {
        throw new Error('Export failed')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive',
      })
    }
  }

  const handleMaintenanceToggle = async (checked: boolean) => {
    const previousValue = form.getValues('maintenanceMode')

    form.setValue('maintenanceMode', checked, {
      shouldDirty: true,
      shouldTouch: true,
    })
    setMaintenanceSaving(true)

    try {
      await saveSettings({
        ...form.getValues(),
        maintenanceMode: checked,
      })

      toast({
        title: checked ? 'Maintenance enabled' : 'Maintenance disabled',
        description: checked
          ? 'Visitors will now be redirected to the maintenance page.'
          : 'Visitors can access the storefront again.',
      })
    } catch (error: any) {
      form.setValue('maintenanceMode', previousValue, {
        shouldDirty: true,
        shouldTouch: true,
      })
      toast({
        title: 'Error',
        description: error.message || 'Failed to update maintenance mode',
        variant: 'destructive',
      })
    } finally {
      setMaintenanceSaving(false)
    }
  }

  const logoUrl = form.watch('storeLogo')?.url

  if (initialLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Store Settings</h1>
        <p className="text-muted-foreground">Configure your store preferences</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Store Information */}
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-6">
                <div className="space-y-2">
                  {logoUrl ? (
                    <div className="relative h-20 w-20 rounded-lg border overflow-hidden">
                      <Image
                        src={logoUrl}
                        alt="Store logo"
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={handleRemoveLogo}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="h-20 w-20 rounded-lg border bg-muted flex items-center justify-center">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={logoUploading}
                        asChild
                      >
                        <span>
                          <Upload className="mr-2 h-4 w-4" />
                          {logoUploading ? 'Uploading...' : 'Upload Logo'}
                        </span>
                      </Button>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                        disabled={logoUploading}
                      />
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended: 200x200px
                    </p>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <FormField
                    control={form.control}
                    name="storeName"
                    render={({ field }) => (
                      <div className="space-y-2">
                        <FormLabel>Store Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </div>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="storeEmail"
                    render={({ field }) => (
                      <div className="space-y-2">
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                      </div>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="storePhone"
                    render={({ field }) => (
                      <div className="space-y-2">
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+91 9876543210" {...field} />
                        </FormControl>
                      </div>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="storeAddress"
                    render={({ field }) => (
                      <div className="space-y-2">
                        <FormLabel>Store Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Commerce Street, City" {...field} />
                        </FormControl>
                      </div>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gstNumber"
                    render={({ field }) => (
                      <div className="space-y-2">
                        <FormLabel>GST Number</FormLabel>
                        <FormControl>
                          <Input placeholder="GSTIN-XXXXXXXXXXXXX" {...field} />
                        </FormControl>
                      </div>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping & Tax */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Shipping & Tax
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="freeDeliveryThreshold"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <FormLabel>Free Delivery Threshold (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Orders above this qualify for free delivery
                      </p>
                    </div>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliveryCharge"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <FormLabel>Standard Delivery (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Regular delivery fee
                      </p>
                    </div>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expressDeliveryCharge"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <FormLabel>Express Delivery (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Faster delivery option
                      </p>
                    </div>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="taxRate"
                render={({ field }) => (
                  <div className="space-y-2">
                    <FormLabel>GST Rate (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                        Tax rate applied to all orders
                      </p>
                  </div>
                )}
              />
            </CardContent>
          </Card>

          {/* Maintenance */}
          <Card>
            <CardHeader>
              <CardTitle>Maintenance</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="maintenanceMode"
                render={({ field }) => (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Maintenance Mode</p>
                      <p className="text-sm text-muted-foreground">
                        Temporarily disable the store for visitors. Changes apply immediately.
                      </p>
                    </div>
                    <Switch
                      checked={field.value}
                      disabled={maintenanceSaving}
                      onCheckedChange={handleMaintenanceToggle}
                    />
                  </div>
                )}
              />
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-red-50">
                <div>
                  <p className="font-medium text-red-900">Clear All Shopping Carts</p>
                  <p className="text-sm text-red-700">
                    Remove all items from every user&apos;s cart
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleClearAllCarts}
                  type="button"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All Carts
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-red-50">
                <div>
                  <p className="font-medium text-red-900">Export All Data</p>
                  <p className="text-sm text-red-700">
                    Download complete database as CSV files
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleExportAllData}
                  type="button"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export All
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading || logoUploading} className="gap-2">
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
