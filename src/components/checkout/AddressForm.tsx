// src/components/checkout/AddressForm.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { Loader2, Plus } from 'lucide-react'
import { axiosInstance } from '@/lib/axios'

// Indian states list
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Puducherry',
  'Jammu & Kashmir', 'Ladakh'
]

const addressSchema = z.object({
  label: z.enum(['Home', 'Work', 'Other']),
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
  line1: z.string().min(5, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  country: z.string().default('India'),
  isDefault: z.boolean().default(false),
})

type AddressFormData = z.infer<typeof addressSchema>

interface AddressFormProps {
  onSubmit: (data: AddressFormData) => void
  onCancel?: () => void
  initialData?: Partial<AddressFormData> & { _id?: string }
  isLoading?: boolean
}

export default function AddressForm({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false
}: AddressFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: initialData?.label || 'Home',
      fullName: initialData?.fullName || '',
      phone: initialData?.phone || '',
      line1: initialData?.line1 || '',
      line2: initialData?.line2 || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      pincode: initialData?.pincode || '',
      country: initialData?.country || 'India',
      isDefault: initialData?.isDefault ?? false,
    },
  })

  const handleSubmit = async (data: AddressFormData) => {
    setIsSubmitting(true)
    try {
      const payload = {
        label: data.label,
        fullName: data.fullName,
        phone: data.phone,
        line1: data.line1,
        line2: data.line2,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        country: data.country,
        isDefault: data.isDefault,
      }

      let response
      if (initialData?._id) {
        // Edit existing address
        response = await axiosInstance.put(`/api/user/addresses/${initialData._id}`, payload)
      } else {
        // Create new address
        response = await axiosInstance.post('/api/user/addresses', payload)
      }

      if (response.data.success) {
        toast({
          title: initialData?._id ? 'Address updated' : 'Address saved',
          description: initialData?._id
            ? 'Your address has been updated.'
            : 'Your address has been saved to your profile.',
        })
        // Return saved/updated address with _id
        onSubmit(response.data.data)
        form.reset()
        onCancel?.()
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || error.message || 'Failed to save address',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center gap-2 mb-4">
        <Plus className="h-5 w-5" />
        <h3 className="font-medium">Add New Address</h3>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              {...form.register('fullName')}
              placeholder="John Doe"
              disabled={isLoading || isSubmitting}
            />
            {form.formState.errors.fullName && (
              <p className="text-sm text-red-500">{form.formState.errors.fullName.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              {...form.register('phone')}
              placeholder="9876543210"
              disabled={isLoading || isSubmitting}
            />
            {form.formState.errors.phone && (
              <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
            )}
          </div>
        </div>

        {/* Address Line 1 */}
        <div className="space-y-2">
          <Label htmlFor="line1">Address Line 1 *</Label>
          <Input
            id="line1"
            {...form.register('line1')}
            placeholder="House/Flat No., Building, Street"
            disabled={isLoading || isSubmitting}
          />
          {form.formState.errors.line1 && (
            <p className="text-sm text-red-500">{form.formState.errors.line1.message}</p>
          )}
        </div>

        {/* Address Line 2 */}
        <div className="space-y-2">
          <Label htmlFor="line2">Address Line 2</Label>
          <Input
            id="line2"
            {...form.register('line2')}
            placeholder="Landmark, Area (optional)"
            disabled={isLoading || isSubmitting}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* City */}
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              {...form.register('city')}
              placeholder="Mumbai"
              disabled={isLoading || isSubmitting}
            />
            {form.formState.errors.city && (
              <p className="text-sm text-red-500">{form.formState.errors.city.message}</p>
            )}
          </div>

          {/* State */}
          <div className="space-y-2">
            <Label htmlFor="state">State *</Label>
            <select
              id="state"
              {...form.register('state')}
              className="w-full h-10 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading || isSubmitting}
            >
              <option value="">Select State</option>
              {INDIAN_STATES.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            {form.formState.errors.state && (
              <p className="text-sm text-red-500">{form.formState.errors.state.message}</p>
            )}
          </div>

          {/* Pincode */}
          <div className="space-y-2">
            <Label htmlFor="pincode">Pincode *</Label>
            <Input
              id="pincode"
              {...form.register('pincode')}
              placeholder="400001"
              maxLength={6}
              disabled={isLoading || isSubmitting}
            />
            {form.formState.errors.pincode && (
              <p className="text-sm text-red-500">{form.formState.errors.pincode.message}</p>
            )}
          </div>
        </div>

        {/* Label */}
        <div className="space-y-2">
          <Label>Address Label</Label>
          <div className="flex gap-4">
            {(['Home', 'Work', 'Other'] as const).map((label) => (
              <label key={label} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="label"
                  value={label}
                  checked={form.watch('label') === label}
                  onChange={() => form.setValue('label', label)}
                  disabled={isLoading || isSubmitting}
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Set as default checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isDefault"
            {...form.register('isDefault')}
            className="rounded border-gray-300"
            disabled={isLoading || isSubmitting}
          />
          <Label htmlFor="isDefault" className="text-sm font-normal">
            Save to profile
          </Label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            onClick={form.handleSubmit(handleSubmit)}
            disabled={isLoading || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Address'
            )}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading || isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}