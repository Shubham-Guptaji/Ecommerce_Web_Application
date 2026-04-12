// src/app/admin/categories/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import {
  selectAllCategories,
  selectCategoriesLoading,
  selectCategoriesError,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/store/slices/categoriesSlice'
import { toast } from '@/hooks/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import {
  Plus,
  Edit,
  Trash2,
  FolderTree,
  Image as ImageIcon,
  X,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Form, FormField, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/shared/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Image from 'next/image'

// Extend categorySchema to include image
const categoryFormSchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().max(500).optional(),
  parent: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  imageUrl: z.string().url().optional().nullable(),
  imagePublicId: z.string().optional().nullable(),
})

type CategoryForm = z.infer<typeof categoryFormSchema>

const getCategoryId = (value: any): string | null => {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value._id) {
    return value._id.toString()
  }
  if (typeof value?.toString === 'function') {
    const id = value.toString()
    return id && id !== '[object Object]' ? id : null
  }
  return null
}

export default function AdminCategoriesPage() {
  const dispatch = useAppDispatch()
  const categories = useAppSelector(selectAllCategories)
  const loading = useAppSelector(selectCategoriesLoading)
  const error = useAppSelector(selectCategoriesError)

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [pendingActiveToggle, setPendingActiveToggle] = useState<{
    id: string
    value: boolean
  } | null>(null)

  const form = useForm<CategoryForm>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      description: '',
      parent: 'none',
      isActive: true,
      imageUrl: null,
      imagePublicId: null,
    },
  })
  const imageUrl = useWatch({
    control: form.control,
    name: 'imageUrl',
  })

  useEffect(() => {
    dispatch(fetchCategories())
  }, [dispatch])

  // Get flat categories for parent selector (exclude current category being edited to avoid cycles)
  const flatCategories = categories as any[]
  const editingId = selectedCategoryId

  const handleSelectCategory = (categoryId: string) => {
    const category = flatCategories.find((c) => c._id === categoryId)
    if (category) {
      setSelectedCategoryId(categoryId)
      form.reset({
        name: category.name,
        description: category.description || '',
        parent: getCategoryId(category.parent) || '',
        isActive: category.isActive,
        imageUrl: category.image?.url || null,
        imagePublicId: category.image?.publicId || null,
      })
    }
  }

  const handleAddNew = () => {
    setSelectedCategoryId(null)
    form.reset({
      name: '',
      description: '',
      parent: '',
      isActive: true,
      imageUrl: null,
      imagePublicId: null,
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'categories')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        form.setValue('imageUrl', result.data.url)
        form.setValue('imagePublicId', result.data.publicId)
        toast({
          title: 'Success',
          description: 'Image uploaded',
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const onSubmit = async (data: CategoryForm) => {
    try {
      const payload = {
        ...data,
        parent: data.parent || null,
      }

      if (selectedCategoryId) {
        // Update
        await dispatch(
          updateCategory({
            id: selectedCategoryId,
            categoryData: payload,
          })
        ).unwrap()
        toast({
          title: 'Success',
          description: 'Category updated successfully',
        })
      } else {
        // Create
        await dispatch(createCategory(payload)).unwrap()
        toast({
          title: 'Success',
          description: 'Category created successfully',
        })
        handleAddNew()
      }

      // Refresh categories list
      dispatch(fetchCategories())
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save category',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Delete this category? This cannot be undone.')) return

    try {
      await dispatch(deleteCategory(categoryId)).unwrap()
      toast({
        title: 'Success',
        description: 'Category deleted',
      })
      if (selectedCategoryId === categoryId) {
        handleAddNew()
      }
      dispatch(fetchCategories())
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete category',
        variant: 'destructive',
      })
    }
  }

  const handleActiveToggle = async (categoryId: string, isActive: boolean) => {
    setPendingActiveToggle({ id: categoryId, value: isActive })
    try {
      await dispatch(
        updateCategory({
          id: categoryId,
          categoryData: { isActive },
        })
      ).unwrap()
      toast({
        title: 'Success',
        description: `Category ${isActive ? 'activated' : 'deactivated'}`,
      })
      dispatch(fetchCategories())
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      })
    } finally {
      setPendingActiveToggle(null)
    }
  }

  const buildTreeFromFlat = (categories: any[]) => {
    const map = new Map()
    const roots: any[] = []

    categories.forEach((cat) => {
      map.set(cat._id.toString(), { ...cat, children: [] })
    })

    categories.forEach((cat) => {
      const node = map.get(cat._id.toString())
      const parentId = getCategoryId(cat.parent)
      if (parentId) {
        const parentNode = map.get(parentId)
        if (parentNode) {
          parentNode.children.push(node)
        } else {
          roots.push(node)
        }
      } else {
        roots.push(node)
      }
    })

    return roots
  }

  const tree = buildTreeFromFlat(flatCategories)

  const renderTree = (nodes: any[], level = 0) => {
    return nodes.map((node) => (
      <div key={node._id}>
        <div
          className={`flex flex-wrap items-start gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer sm:flex-nowrap sm:items-center ${
            selectedCategoryId === node._id ? 'bg-muted' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => handleSelectCategory(node._id)}
        >
          {/* Image thumbnail */}
          {node.image?.url ? (
            <Image
              src={node.image.url}
              alt={node.name}
              width={32}
              height={32}
              className="h-8 w-8 rounded object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
              <FolderTree className="h-4 w-4 text-muted-foreground" />
            </div>
          )}

          {/* Name + product count */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{node.name}</p>
            <p className="text-xs text-muted-foreground">{node.productCount} products</p>
          </div>

          {/* Active toggle */}
          <div className="ml-auto flex items-center gap-1">
            <Switch
              checked={node.isActive}
              onCheckedChange={(checked) => handleActiveToggle(node._id, checked)}
              disabled={pendingActiveToggle?.id === node._id}
              className="scale-75"
            />

            {/* Actions */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                handleSelectCategory(node._id)
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600"
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(node._id)
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {node.children && node.children.length > 0 && renderTree(node.children, level + 1)}
      </div>
    ))
  }

  return (
    <div className="flex flex-col gap-6 xl:h-[calc(100vh-12rem)] xl:flex-row">
      {/* Left Panel: Category Tree */}
      <Card className="w-full overflow-hidden xl:w-80 xl:flex-shrink-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Categories</h2>
            <Button size="sm" onClick={handleAddNew}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <div className="max-h-[50vh] overflow-y-auto xl:max-h-[calc(100vh-16rem)]">
              {tree.length > 0 ? (
                renderTree(tree)
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderTree className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-sm">No categories yet</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right Panel: Add/Edit Form */}
      <Card className="w-full xl:flex-1 xl:overflow-y-auto">
        <CardContent className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              {selectedCategoryId ? 'Edit Category' : 'Add New Category'}
            </h2>
            <p className="text-muted-foreground">
              {selectedCategoryId
                ? 'Update category details and settings'
                : 'Create a new category for your products'}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Category name"
                          {...field}
                        />
                      </FormControl>
                      {field.value && (
                        <p className="text-xs text-muted-foreground">
                          Slug:{" "}
                          <span className="font-mono">
                            {field.value
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, '-')
                              .replace(/(^-|-$)/g, '')}
                          </span>
                        </p>
                      )}
                      <FormMessage />
                    </div>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief category description"
                          maxLength={500}
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        {field.value?.length || 0}/500
                      </p>
                      <FormMessage />
                    </div>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parent"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <FormLabel>Parent Category</FormLabel>
                      <Select
                        value={field.value || 'none'}
                        onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="None (Top Level)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None (Top Level)</SelectItem>
                          {flatCategories
                            .filter((c) => c._id !== selectedCategoryId)
                            .map((cat) => (
                              <SelectItem key={cat._id} value={cat._id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Organize categories in a hierarchy
                      </p>
                      <FormMessage />
                    </div>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel className="text-base">Active</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Make this category visible in the store
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                  )}
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <FormLabel>Category Image</FormLabel>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  {imageUrl ? (
                    <div className="relative h-24 w-24 rounded-md overflow-hidden border">
                      <Image
                        src={imageUrl}
                        alt="Category"
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => {
                          form.setValue('imageUrl', null)
                          form.setValue('imagePublicId', null)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="h-24 w-24 flex flex-col items-center justify-center rounded-md border border-dashed cursor-pointer hover:bg-muted/50">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                  )}
                  <div className="text-sm text-muted-foreground">
                    <p>Upload a category image (max 5MB)</p>
                    <p>Recommended: 800x800px</p>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddNew}
                >
                  Clear
                </Button>
                <Button type="submit" disabled={uploadingImage}>
                  {selectedCategoryId ? 'Update Category' : 'Create Category'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
