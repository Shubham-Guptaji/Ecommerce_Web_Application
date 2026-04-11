// src/app/admin/coupons/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux'
import type { ICoupon } from '@/models/Coupon'
import {
  selectAllCoupons,
  selectCouponsLoading,
  selectCouponsError,
  fetchCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '@/store/slices/couponsSlice'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Plus,
  Edit,
  Trash2,
  Ticket,
  MoreVertical,
  Copy,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Form, FormField, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/shared/skeleton'

const couponSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  type: z.enum(['flat', 'percentage']),
  value: z.number().positive('Value must be positive'),
  minOrderValue: z.number().min(0),
  maxDiscount: z.number().positive().optional().nullable(),
  usageLimit: z.number().int().positive(),
  expiresAt: z.string().refine((val) => new Date(val) > new Date(), {
    message: 'Expiry date must be in the future',
  }),
  isActive: z.boolean().default(true),
})

type CouponForm = z.infer<typeof couponSchema>

export default function AdminCouponsPage() {
  const dispatch = useAppDispatch()
  const coupons = useAppSelector(selectAllCoupons)
  const loading = useAppSelector(selectCouponsLoading)
  const error = useAppSelector(selectCouponsError)

  const [editingCoupon, setEditingCoupon] = useState<ICoupon | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const form = useForm<CouponForm>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: '',
      type: 'percentage',
      value: 10,
      minOrderValue: 0,
      maxDiscount: null,
      usageLimit: 100,
      expiresAt: '',
      isActive: true,
    },
  })

  useEffect(() => {
    dispatch(fetchCoupons())
  }, [dispatch])

  const onSubmit = async (data: CouponForm) => {
    try {
      const payload = {
        ...data,
        expiresAt: new Date(data.expiresAt).toISOString(),
      }

      if (editingCoupon) {
        await dispatch(
          updateCoupon({
            id: editingCoupon._id,
            couponData: payload as any,
          })
        ).unwrap()
        toast({
          title: 'Success',
          description: 'Coupon updated',
        })
      } else {
        await dispatch(createCoupon(payload as any)).unwrap()
        toast({
          title: 'Success',
          description: 'Coupon created',
        })
      }

      setIsDialogOpen(false)
      form.reset()
      setEditingCoupon(null)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleEdit = (coupon: any) => {
    setEditingCoupon(coupon)
    form.reset({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrderValue: coupon.minOrderValue,
      maxDiscount: coupon.maxDiscount || null,
      usageLimit: coupon.usageLimit,
      expiresAt: new Date(coupon.expiresAt).toISOString().slice(0, 16), // for datetime-local
      isActive: coupon.isActive,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (couponId: string) => {
    if (!confirm('Delete this coupon?')) return

    try {
      await dispatch(deleteCoupon(couponId)).unwrap()
      toast({
        title: 'Success',
        description: 'Coupon deleted',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete coupon',
        variant: 'destructive',
      })
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({
      title: 'Copied!',
      description: `Coupon code ${code} copied to clipboard`,
    })
  }

  const resetForm = () => {
    form.reset()
    setEditingCoupon(null)
    setIsDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Coupons</h1>
          <p className="text-muted-foreground">Create and manage discount coupons</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingCoupon(null); form.reset(); setIsDialogOpen(true) }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Coupon
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Add Coupon'}</DialogTitle>
              <DialogDescription>
                {editingCoupon ? 'Update the coupon details below.' : 'Fill in the details to create a new coupon.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <FormLabel>Code *</FormLabel>
                      <FormControl>
                        <Input placeholder="SAVE20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </div>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <div className="space-y-2">
                        <FormLabel>Type</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="flat">Flat Amount</SelectItem>
                            <SelectItem value="percentage">Percentage</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </div>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <div className="space-y-2">
                        <FormLabel>Value *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step={field.name === 'value' ? '0.01' : '1'}
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minOrderValue"
                    render={({ field }) => (
                      <div className="space-y-2">
                        <FormLabel>Min Order Value</FormLabel>
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
                    name="maxDiscount"
                    render={({ field }) => (
                      <div className="space-y-2">
                        <FormLabel>Max Discount (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="No limit"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="usageLimit"
                    render={({ field }) => (
                      <div className="space-y-2">
                        <FormLabel>Usage Limit *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </div>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expiresAt"
                    render={({ field }) => (
                      <div className="space-y-2">
                        <FormLabel>Expires At *</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </div>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <FormLabel className="cursor-pointer">Active</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </div>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingCoupon ? 'Update' : 'Create'}</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Coupons ({coupons.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-8">{error}</div>
          ) : coupons.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Min Order</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-bold bg-muted px-2 py-1 rounded text-sm">
                          {coupon.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopyCode(coupon.code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{coupon.type}</TableCell>
                    <TableCell className="font-semibold">
                      {coupon.type === 'flat' ? (
                        <>₹{coupon.value}</>
                      ) : (
                        <>{coupon.value}%</>
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(coupon.minOrderValue)}</TableCell>
                    <TableCell>
                      {coupon.usedCount} / {coupon.usageLimit}
                    </TableCell>
                    <TableCell>{formatDate(coupon.expiresAt)}</TableCell>
                    <TableCell>
                      <Badge className={coupon.isActive ? 'bg-green-100' : 'bg-gray-100'}>
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(coupon)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(coupon._id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Ticket className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No coupons</h3>
              <p className="text-muted-foreground mb-4">Create your first coupon</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Coupon
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
