// src/components/admin/ProductForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from '@/hooks/use-toast'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormField, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2, Upload, Save } from 'lucide-react'
import { axiosInstance } from '@/lib/axios'

// Dynamically import TipTapEditor to reduce initial bundle size
const TipTapEditor = dynamic(() => import('@/components/editor/tip-tap-editor').then(mod => mod.TipTapEditor), {
  ssr: false,
  loading: () => <div className="h-64 w-full bg-muted/20 animate-pulse rounded-md" />,
})

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().min(1, 'Slug is required'),
  shortDescription: z.string().min(1, 'Short description is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().positive('Price must be positive'),
  discountedPrice: z.number().positive().optional().nullable(),
  category: z.string().min(1, 'Category is required'),
  sku: z.string().min(1, 'SKU is required'),
  stock: z.number().int().min(0, 'Stock must be non-negative'),
  tags: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductFormProps {
  initialData?: any
  onSubmit: (data: Omit<ProductFormData, 'tags'> & {
    specifications: Array<{ key: string; value: string }>
    images: Array<{ url: string; publicId: string }>
    tags: string[]
  }) => Promise<void>
  isLoading?: boolean
  mode: 'create' | 'edit'
}

export default function ProductForm({
  initialData,
  onSubmit,
  isLoading = false,
  mode
}: ProductFormProps) {
  const [specifications, setSpecifications] = useState<Array<{ key: string; value: string }>>(
    initialData?.specifications || []
  )
  const [images, setImages] = useState<any[]>(initialData?.images || [])
  const [newSpecKey, setNewSpecKey] = useState('')
  const [newSpecValue, setNewSpecValue] = useState('')
  const [categories, setCategories] = useState<Array<{ _id: string; name: string }>>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || '',
      slug: initialData?.slug || '',
      shortDescription: initialData?.shortDescription || '',
      description: initialData?.description || '',
      price: initialData?.price || 0,
      discountedPrice: initialData?.discountedPrice || null,
      category: initialData?.category?._id || initialData?.category || '',
      sku: initialData?.sku || '',
      stock: initialData?.stock || 0,
      tags: initialData?.tags?.join(', ') || '',
      isFeatured: initialData?.isFeatured || false,
      isActive: initialData?.isActive !== false, // default true
    },
  })

  // Reset form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || '',
        slug: initialData.slug || '',
        shortDescription: initialData.shortDescription || '',
        description: initialData.description || '',
        price: initialData.price || 0,
        discountedPrice: initialData.discountedPrice || null,
        category: initialData.category?._id || initialData.category || '',
        sku: initialData.sku || '',
        stock: initialData.stock || 0,
        tags: initialData.tags?.join(', ') || '',
        isFeatured: initialData.isFeatured || false,
        isActive: initialData.isActive !== false,
      })
      setSpecifications(initialData.specifications || [])
      setImages(initialData.images || [])
    }
  }, [initialData, form])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axiosInstance.get('/api/admin/categories')
        const result = response.data
        if (result.success) {
          setCategories(result.data.flat || [])
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
        toast({
          title: 'Error',
          description: 'Failed to load categories',
          variant: 'destructive',
        })
      } finally {
        setCategoriesLoading(false)
      }
    }
    fetchCategories()
  }, [])

  const handleNameChange = (name: string) => {
    form.setValue('name', name)
    if (!form.getValues('slug')) {
      form.setValue(
        'slug',
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      )
    }
  }

  const handleAddSpecification = () => {
    if (newSpecKey && newSpecValue) {
      setSpecifications([...specifications, { key: newSpecKey, value: newSpecValue }])
      setNewSpecKey('')
      setNewSpecValue('')
    }
  }

  const handleRemoveSpecification = (index: number) => {
    setSpecifications(specifications.filter((_, i) => i !== index))
  }

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const formData = new FormData()
    Array.from(files).forEach((file) => formData.append('file', file))
    formData.append('folder', 'products')

    try {
      const response = await axiosInstance.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const result = response.data

      if (result.success) {
        setImages([...images, result.data])
        toast({
          title: 'Success',
          description: 'Image uploaded successfully',
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleFormSubmit = async (data: ProductFormData) => {
    const payload = {
      ...data,
      tags: data.tags ? data.tags.split(',').map((t) => t.trim().toLowerCase()) : [],
      specifications,
      images: images.map((img) => ({
        url: img.url,
        publicId: img.publicId,
      })),
    }

    await onSubmit(payload)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <div className="space-y-2">
                    <FormLabel>Product Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter product name"
                        {...field}
                        onChange={(e) => handleNameChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <div className="space-y-2">
                    <FormLabel>Slug *</FormLabel>
                    <FormControl>
                      <Input placeholder="product-slug" {...field} />
                    </FormControl>
                    <FormMessage />
                  </div>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <div className="space-y-2">
                    <FormLabel>Category *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat._id} value={cat._id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </div>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <div className="space-y-2">
                    <FormLabel>SKU *</FormLabel>
                    <FormControl>
                      <Input placeholder="SKU-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </div>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="shortDescription"
              render={({ field }) => (
                <div className="space-y-2">
                  <FormLabel>Short Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief product description (max 300 chars)"
                      maxLength={300}
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    {field.value?.length || 0}/300
                  </p>
                  <FormMessage />
                </div>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <div className="space-y-2">
                  <FormLabel>Full Description *</FormLabel>
                  <TipTapEditor
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Detailed product description with rich formatting..."
                  />
                  <FormMessage />
                </div>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <div className="space-y-2">
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="tag1, tag2, tag3"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Comma-separated keywords
                  </p>
                </div>
              )}
            />
          </CardContent>
        </Card>

        {/* Pricing & Inventory */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing & Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <div className="space-y-2">
                    <FormLabel>Price (₹) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                )}
              />

              <FormField
                control={form.control}
                name="discountedPrice"
                render={({ field }) => (
                  <div className="space-y-2">
                    <FormLabel>Discounted Price (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || null)}
                        placeholder="Optional"
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                )}
              />

              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <div className="space-y-2">
                    <FormLabel>Stock Quantity *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                {images.map((img, index) => (
                  <div key={index} className="relative h-24 w-24 rounded-md overflow-hidden border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}

                <label className="h-24 w-24 flex flex-col items-center justify-center rounded-md border border-dashed cursor-pointer hover:bg-muted/50">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-xs text-muted-foreground">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Upload up to 10 images. Recommended size: 800x800px
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Specifications */}
        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {specifications.map((spec, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{spec.key}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{spec.value}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSpecification(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <div className="flex items-center gap-4">
                <Input
                  placeholder="Specification name"
                  value={newSpecKey}
                  onChange={(e) => setNewSpecKey(e.target.value)}
                />
                <Input
                  placeholder="Value"
                  value={newSpecValue}
                  onChange={(e) => setNewSpecValue(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddSpecification}
                  disabled={!newSpecKey || !newSpecValue}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Publishing */}
        <Card>
          <CardHeader>
            <CardTitle>Publishing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Featured Product</p>
                <p className="text-sm text-muted-foreground">
                  Showcase on homepage and featured sections
                </p>
              </div>
              <FormField
                control={form.control}
                name="isFeatured"
                render={({ field }) => (
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                )}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Active</p>
                <p className="text-sm text-muted-foreground">
                  Make this product available for purchase
                </p>
              </div>
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="gap-2">
            <Save className="h-4 w-4" />
            {isLoading ? (mode === 'create' ? 'Creating...' : 'Updating...') : (mode === 'create' ? 'Create Product' : 'Update Product')}
          </Button>
        </div>
      </form>
    </Form>
  )
}
