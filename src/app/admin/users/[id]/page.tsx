// src/app/admin/users/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/shared/skeleton'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { getAvatarUrl, type AvatarValue } from '@/lib/avatar'
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Package,
  ShoppingBag,
  UserCheck,
  UserX,
  Edit,
  Trash2,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface UserDetail {
  _id: string
  name: string
  email: string
  avatar?: AvatarValue
  role: 'user' | 'admin'
  isEmailVerified: boolean
  createdAt: string
  addresses: Array<{
    _id: string
    label: string
    fullName: string
    phone: string
    line1: string
    line2?: string
    city: string
    state: string
    pincode: string
    country: string
    isDefault: boolean
  }>
  orders: Array<{
    _id: string
    orderNumber: string
    status: string
    total: number
    createdAt: string
    items: Array<{
      name: string
      quantity: number
      price: number
    }>
  }>
  totalSpent: number
  orderCount: number
  isActive: boolean
}

export default function AdminUserDetailPage() {
  const { data: session } = useSession()
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const isCurrentAdmin = session?.user?.id === user?._id
  const userId = params?.id

   
   
   
  useEffect(() => {
    if (!userId) {
      return
    }

    if (!session || session.user?.role !== 'admin') {
      router.push('/sign-in')
      return
    }

    const fetchUserDetail = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/admin/users/${userId}`)
        const result = await response.json()

        if (result.success) {
          setUser(result.data)
        } else {
          toast({
            title: 'Error',
            description: result.message || 'Failed to load user details',
            variant: 'destructive',
          })
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
        toast({
          title: 'Error',
          description: 'Failed to load user details',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUserDetail()
  }, [session, router, userId])

  const handleRoleChange = async (newRole: string) => {
    if (!user) return
    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/users/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: `User role updated to ${newRole}`,
        })
        setUser({ ...user, role: newRole as 'user' | 'admin' })
      } else {
        throw new Error('Failed to update')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleStatusChange = async (isActive: boolean) => {
    if (!user) return
    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/users/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: `User ${isActive ? 'activated' : 'deactivated'}`,
        })
        setUser({ ...user, isActive })
      } else {
        throw new Error('Failed to update')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!user) return
    if (isCurrentAdmin) {
      toast({
        title: 'Action blocked',
        description: 'Admins cannot delete their own account.',
        variant: 'destructive',
      })
      return
    }

    if (!confirm('Are you sure you want to delete this user? This action cannot be undone and will anonymize their order history.')) {
      return
    }
    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/users/${user._id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'User deleted successfully',
        })
        router.push('/admin/users')
      } else {
        throw new Error('Failed to delete')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Skeleton className="h-64" />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">User not found</p>
        <Button asChild className="mt-4">
          <Link href="/admin/users">Back to Users</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Button variant="outline" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Link>
        </Button>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap lg:w-auto lg:justify-end">
          <Button
            variant="outline"
            onClick={() => handleRoleChange(user.role === 'admin' ? 'user' : 'admin')}
            disabled={updating}
            className="w-full sm:w-auto"
          >
            <UserCheck className="mr-2 h-4 w-4" />
            {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
          </Button>
          <Button
            variant={user.isActive ? 'destructive' : 'default'}
            onClick={() => handleStatusChange(!user.isActive)}
            disabled={updating}
            className="w-full sm:w-auto"
          >
            {user.isActive ? (
              <>
                <UserX className="mr-2 h-4 w-4" />
                Deactivate
              </>
            ) : (
              <>
                <UserCheck className="mr-2 h-4 w-4" />
                Activate
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteUser}
            disabled={updating || isCurrentAdmin}
            className="w-full sm:w-auto"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isCurrentAdmin ? 'Cannot Delete Yourself' : 'Delete'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={getAvatarUrl(user.avatar)} />
                  <AvatarFallback className="text-2xl">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl">{user.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Badge className={user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                  {user.role}
                </Badge>
                {user.isEmailVerified ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                    Unverified
                  </Badge>
                )}
                <Badge variant={user.isActive ? 'default' : 'secondary'}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Joined {formatDate(user.createdAt)}
                  </span>
                </div>
                {user.addresses?.[0] && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">
                      {user.addresses[0].line1}, {user.addresses[0].city}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{user.orderCount}</p>
                  <p className="text-xs text-muted-foreground">Orders</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(user.totalSpent)}</p>
                  <p className="text-xs text-muted-foreground">Total Spent</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Addresses */}
          {user.addresses && user.addresses.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Addresses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.addresses.map((address) => (
                  <div key={address._id} className="text-sm space-y-1 p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{address.label}</span>
                      {address.isDefault && (
                        <Badge variant="outline" className="text-xs">Default</Badge>
                      )}
                    </div>
                    <p>{address.fullName}</p>
                    <p>{address.line1}</p>
                    {address.line2 && <p>{address.line2}</p>}
                    <p>{address.city}, {address.state} {address.pincode}</p>
                    <p>{address.country}</p>
                    <p className="text-muted-foreground">{address.phone}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Orders */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              {user.orders && user.orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.orders.map((order) => (
                        <TableRow key={order._id}>
                          <TableCell className="font-medium">{order.orderNumber}</TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</span>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(order.total)}</TableCell>
                          <TableCell>
                            <Badge variant={
                              order.status === 'delivered' ? 'default' :
                              order.status === 'cancelled' || order.status === 'refunded' ? 'destructive' :
                              'secondary'
                            }>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/admin/orders/${order._id}`}>
                                View
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No orders yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
