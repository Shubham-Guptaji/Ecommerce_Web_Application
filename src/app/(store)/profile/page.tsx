// File path: src/app/(store)/profile/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { useSelector } from 'react-redux'
import { useAppDispatch } from '@/hooks/useRedux'
import { RootState } from '@/store'
import { fetchProfile, updateProfile as updateProfileAction, changePassword as changePasswordAction, deleteAccount as deleteAccountAction, selectProfile, selectProfileLoading, selectProfileError } from '@/store/slices/profileSlice'
import { fetchAddresses, createAddress, updateAddress, deleteAddress, selectAllAddresses, selectAddressesLoading, selectAddressesError } from '@/store/slices/addressSlice'
import { fetchWishlist, selectWishlistItems, selectWishlistLoading, selectWishlistError } from '@/store/slices/wishlistSlice'
import { fetchOrders } from '@/store/slices/ordersSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
  FormItem,
} from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  User,
  MapPin,
  Heart,
  Settings,
  Camera,
  Save,
  Plus,
  X,
  Lock,
  Trash2,
  Package,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import axiosInstance from '@/lib/axios'
import ProductGrid from '@/components/product/product-grid'
import { Skeleton } from '@/components/shared/skeleton'
import { getAvatarUrl, type AvatarValue } from '@/lib/avatar'

const profileSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
})

const addressFormSchema = z.object({
  label: z.enum(['Home', 'Work', 'Other']),
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().min(10, 'Phone number is required'),
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().min(6, 'Valid pincode is required'),
  country: z.string().min(1, 'Country is required').default('India'),
  isDefault: z.boolean().default(false),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type ProfileForm = z.infer<typeof profileSchema>
type ChangePasswordForm = z.infer<typeof changePasswordSchema>

export default function ProfilePage() {
  const { data: session } = useSession()
  const dispatch = useAppDispatch()
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'wishlist' | 'account'>('profile')
  const [isAddingAddress, setIsAddingAddress] = useState(false)
  const [editingAddress, setEditingAddress] = useState<any>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Notification preferences state
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)

  // Redux state
  const profile = useSelector(selectProfile)
  const profileLoading = useSelector(selectProfileLoading)
  const profileError = useSelector(selectProfileError)

  const addresses = useSelector(selectAllAddresses)
  const addressesLoading = useSelector(selectAddressesLoading)
  const addressesError = useSelector(selectAddressesError)

  const wishlistItems = useSelector(selectWishlistItems)
  const wishlistLoading = useSelector(selectWishlistLoading)
  const wishlistError = useSelector(selectWishlistError)
  const profileData = profile as
    | (typeof profile & {
        phone?: string
        avatar?: AvatarValue
        createdAt?: string | Date
      })
    | null

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', phone: '' },
  })

  // Reset form when profile loads
  useEffect(() => {
    if (profileData) {
      profileForm.reset({
        name: profileData.name,
        phone: profileData.phone || '',
      })
    }
  }, [profileData, profileForm])

  const addressForm = useForm<z.infer<typeof addressFormSchema>>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      label: 'Home',
      fullName: '',
      phone: '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
      isDefault: false,
    },
  })

  const passwordForm = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  // Orders stats for Account tab - from Redux orders state (if available)
  const ordersFromRedux = useSelector((state: RootState) => state.orders.orders)
  const ordersLoading = useSelector((state: RootState) => state.orders.loading)

  // Fetch orders for stats when account tab is active
  useEffect(() => {
    if (session?.user && activeTab === 'account') {
      // Use existing fetchOrders thunk to get all orders (no status filter)
      // We'll limit to a large number to get all orders for stats
      dispatch(fetchOrders({ page: 1, limit: 1000 }))
    }
  }, [session, activeTab, dispatch])

  // Compute stats from Redux orders (which may be from current filter, but we fetched all)
  // Use ordersFromRedux which will contain the fetched orders
  const totalOrders = ordersFromRedux.length
  const totalSpent = ordersFromRedux.reduce((sum, order) => sum + order.pricing.total, 0)

  useEffect(() => {
    if (session?.user) {
      dispatch(fetchProfile())
      dispatch(fetchAddresses())
    }
  }, [session, dispatch])

  useEffect(() => {
    if (activeTab === 'wishlist' && session?.user) {
      dispatch(fetchWishlist())
    }
  }, [activeTab, session, dispatch])

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview)
      }
    }
  }, [avatarPreview])

  const handleProfileSubmit = async (data: ProfileForm) => {
    try {
      const result = await dispatch(updateProfileAction(data)).unwrap()
      toast({ title: 'Success', description: 'Profile updated successfully' })
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const previewUrl = URL.createObjectURL(file)
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarPreview(previewUrl)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'avatars')
    try {
      const uploadResponse = await axiosInstance.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const result = uploadResponse.data
      if (!result.success) throw new Error(result.message)
      // Use Redux action to update profile with new avatar
      await dispatch(
        updateProfileAction({
          avatar: {
            url: result.data.url,
            publicId: result.data.publicId,
          },
        })
      ).unwrap()
      toast({ title: 'Success', description: 'Avatar updated successfully' })
      setAvatarPreview(null)
      URL.revokeObjectURL(previewUrl)
    } catch (error: any) {
      setAvatarPreview(null)
      URL.revokeObjectURL(previewUrl)
      toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' })
    }
  }

  const handleChangePassword = async (data: ChangePasswordForm) => {
    try {
      await dispatch(changePasswordAction({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })).unwrap()
      toast({ title: 'Success', description: 'Password changed successfully' })
      passwordForm.reset()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return
    try {
      await dispatch(deleteAddress(addressId)).unwrap()
      toast({ title: 'Success', description: 'Address deleted' })
    } catch (error: any) {
      // Refetch to restore addresses if deletion failed
      dispatch(fetchAddresses())
      toast({ title: 'Error', description: error.message || 'Failed to delete address', variant: 'destructive' })
    }
  }

  const openAddAddressForm = () => {
    setIsAddingAddress(true)
    setEditingAddress(null)
    addressForm.reset({
      label: 'Home',
      fullName: '',
      phone: '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
      isDefault: false,
    })
  }

  const openEditAddressForm = (address: any) => {
    setIsAddingAddress(true)
    setEditingAddress(address)
    addressForm.reset({
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      country: address.country,
      isDefault: address.isDefault || false,
    })
  }

  const closeAddressForm = () => {
    setIsAddingAddress(false)
    setEditingAddress(null)
    addressForm.reset()
  }

  const handleAddressSubmit = async (data: z.infer<typeof addressFormSchema>) => {
    try {
      if (editingAddress) {
        await dispatch(updateAddress({ id: editingAddress._id, data: data as any })).unwrap()
        toast({ title: 'Success', description: 'Address updated' })
      } else {
        await dispatch(createAddress(data as any)).unwrap()
        toast({ title: 'Success', description: 'Address added' })
      }
      closeAddressForm()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return
    try {
      await dispatch(deleteAccountAction()).unwrap()
      await signOut({ redirect: false })
      toast({ title: 'Account Deleted', description: 'Your account has been deleted. Redirecting...' })
      setTimeout(() => (window.location.href = '/'), 1500)
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  if (profileLoading && !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2"><Skeleton className="h-96" /></div>
          <div><Skeleton className="h-64" /></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Account</h1>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid grid-cols-4 w-full max-w-3xl mb-8">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="addresses" className="gap-2">
            <MapPin className="h-4 w-4" />
            Addresses
          </TabsTrigger>
          <TabsTrigger value="wishlist" className="gap-2">
            <Heart className="h-4 w-4" />
            Wishlist
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            <Settings className="h-4 w-4" />
            Account
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="space-y-6">
            {/* Profile Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
                    <div className="flex items-center gap-6">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={avatarPreview || getAvatarUrl(profileData?.avatar)} />
                        <AvatarFallback>{profileData?.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <label htmlFor="avatar-upload" className="cursor-pointer">
                          <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted transition-colors">
                            <Camera className="h-4 w-4" />
                            <span>Change Avatar</span>
                          </div>
                          <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarUpload}
                          />
                        </label>
                        <p className="text-xs text-muted-foreground mt-2">JPG, PNG or GIF. Max 5MB.</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input type="tel" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <FormLabel>Email</FormLabel>
                      <p className="text-muted-foreground">{profileData?.email}</p>
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>
                    <Button type="submit" className="gap-2">
                      <Save className="h-4 w-4" />
                      Save Changes
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Change Password Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>Update your password</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(handleChangePassword)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter current password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter new password" {...field} />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm new password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="gap-2">
                      <Lock className="h-4 w-4" />
                      Change Password
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Delete Account */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
                <CardDescription>
                  {session?.user?.role === 'admin'
                    ? 'Admin accounts cannot delete themselves'
                    : 'Permanently delete your account and data'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {session?.user?.role === 'admin'
                    ? 'For safety, admin accounts must be removed by another admin or through a controlled maintenance workflow.'
                    : 'Once you delete your account, there is no going back. Your orders will remain in our system for record-keeping, but your personal information will be anonymized.'}
                </p>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={session?.user?.role === 'admin'}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Addresses Tab */}
        <TabsContent value="addresses">
          {isAddingAddress && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                  <Button type="button" variant="ghost" size="icon" onClick={closeAddressForm}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...addressForm}>
                  <form onSubmit={addressForm.handleSubmit(handleAddressSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={addressForm.control}
                        name="label"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Label</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select label" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Home">Home</SelectItem>
                                <SelectItem value="Work">Work</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addressForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="John Doe" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addressForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="9876543210" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addressForm.control}
                        name="line1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Line 1</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="House/Flat No, Street" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addressForm.control}
                        name="line2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Line 2 (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Landmark, Area" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addressForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Mumbai" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addressForm.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Maharashtra" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addressForm.control}
                        name="pincode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pincode</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="400001" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addressForm.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="India" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={addressForm.control}
                      name="isDefault"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 rounded-md border p-3">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4"
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">Set as default address</FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2">
                      <Button type="submit">
                        {editingAddress ? 'Update Address' : 'Save Address'}
                      </Button>
                      <Button type="button" variant="outline" onClick={closeAddressForm}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {!isAddingAddress &&
              addresses.map((address) => (
                <Card key={address._id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{address.label}</CardTitle>
                      {address.isDefault && <Badge variant="secondary">Default</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p className="font-semibold">{address.fullName}</p>
                      <p>{address.phone}</p>
                      <p>{address.line1}</p>
                      {address.line2 && <p>{address.line2}</p>}
                      <p>
                        {address.city}, {address.state} {address.pincode}
                      </p>
                      <p>{address.country}</p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => openEditAddressForm(address)}>Edit</Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAddress(address._id)}
                        className="text-red-600"
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

            {!isAddingAddress && (
              <Card className="border-dashed cursor-pointer hover:bg-muted/50 transition-colors" onClick={openAddAddressForm}>
                <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="font-medium mb-2">Add New Address</p>
                  <p className="text-sm text-muted-foreground mb-4">Save your delivery addresses for faster checkout</p>
                  <Button>Add Address</Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Wishlist Tab */}
        <TabsContent value="wishlist">
          <Card>
            <CardHeader>
              <CardTitle>My Wishlist</CardTitle>
              <CardDescription>Products you&apos;ve saved for later</CardDescription>
            </CardHeader>
            <CardContent>
              {wishlistLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="border rounded-lg p-4 space-y-3">
                      <div className="aspect-square bg-muted rounded" />
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : wishlistItems.length > 0 ? (
                <ProductGrid products={wishlistItems} columns={4} />
              ) : (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Your wishlist is empty</p>
                  <Button variant="outline" asChild className="mt-4">
                    <Link href="/products">Browse Products</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your account details and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-muted-foreground">{profileData?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Member Since</p>
                    <p className="text-muted-foreground">{profileData?.createdAt ? formatDate(profileData.createdAt) : 'N/A'}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Orders Placed</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{totalOrders}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Total Spent</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{formatCurrency(totalSpent)}</p>
                    </CardContent>
                  </Card>
                </div>
                <Separator />
                {/* <div>
                  <p className="font-medium mb-4">Notification Preferences</p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-muted-foreground">Receive order updates and promotions</p>
                      </div>
                      <Switch
                        id="email-notif"
                        checked={emailNotifications}
                        onCheckedChange={setEmailNotifications}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">SMS Alerts</p>
                        <p className="text-sm text-muted-foreground">Get notified via SMS</p>
                      </div>
                      <Switch
                        id="sms-alert"
                        checked={smsNotifications}
                        onCheckedChange={setSmsNotifications}
                      />
                    </div>
                  </div>
                </div> */}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
