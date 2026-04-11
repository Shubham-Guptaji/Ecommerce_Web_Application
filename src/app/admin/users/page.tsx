// src/app/admin/users/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/shared/skeleton'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { getAvatarUrl } from '@/lib/avatar'
import {
  Search,
  MoreVertical,
  Eye,
  UserCheck,
  UserX,
  Mail,
  Trash2,
} from 'lucide-react'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnFiltersState,
  SortingState,
} from '@tanstack/react-table'

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-800',
  user: 'bg-blue-100 text-blue-800',
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  suspended: 'bg-red-100 text-red-800',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [verifiedFilter, setVerifiedFilter] = useState('all')
  const [sorting, setSorting] = useState<SortingState>([])

  const fetchUsers = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', (pageIndex + 1).toString())
    params.set('limit', pageSize.toString())
    if (search) params.set('search', search)
    if (roleFilter && roleFilter !== 'all') params.set('role', roleFilter)
    if (verifiedFilter && verifiedFilter !== 'all') params.set('isEmailVerified', verifiedFilter)

    if (sorting.length > 0) {
      const { id, desc } = sorting[0]
      params.set('sortBy', id === 'name' ? 'name' : id === 'email' ? 'email' : 'createdAt')
      params.set('sortOrder', desc ? 'desc' : 'asc')
    }

    fetch(`/api/admin/users?${params.toString()}`)
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setUsers(result.data)
          setTotal(result.total || result.data.length)
        }
      })
      .catch(error => {
        console.error('Failed to fetch users:', error)
        toast({
          title: 'Error',
          description: 'Failed to load users',
          variant: 'destructive',
        })
      })
      .finally(() => {
        setLoading(false)
      })
  }, [pageIndex, pageSize, search, roleFilter, verifiedFilter, sorting])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: `User role updated to ${newRole}`,
        })
        fetchUsers()
      } else {
        throw new Error('Failed to update')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      })
    }
  }

  const handleStatusChange = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: `User ${isActive ? 'activated' : 'deactivated'}`,
        })
        fetchUsers()
      } else {
        throw new Error('Failed to update')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Delete this user? This will anonymize their data but keep their orders. This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'User deleted (data anonymized)',
        })
        fetchUsers()
      } else {
        throw new Error('Failed to delete user')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPageIndex(0); }}
                className="pl-10"
              />
            </div>

            <Select value={roleFilter} onValueChange={(value) => { setRoleFilter(value); setPageIndex(0); }}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>

            <Select value={verifiedFilter} onValueChange={(value) => { setVerifiedFilter(value); setPageIndex(0); }}>
              <SelectTrigger>
                <SelectValue placeholder="Email verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Verified</SelectItem>
                <SelectItem value="false">Not Verified</SelectItem>
              </SelectContent>
            </Select>

            {(search || roleFilter !== 'all' || verifiedFilter !== 'all') && (
              <Button variant="outline" onClick={() => { setSearch(''); setRoleFilter('all'); setVerifiedFilter('all'); setPageIndex(0); }}>
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : users.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Spent</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={getAvatarUrl(user.avatar)} />
                            <AvatarFallback>
                              {user.name?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              ID: {user._id.substring(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{user.email}</TableCell>
                      <TableCell>
                        <Badge className={roleColors[user.role] || 'bg-gray-100'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.isEmailVerified ? (
                          <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                      </TableCell>
                      <TableCell>{user.orderCount || 0}</TableCell>
                      <TableCell>{formatCurrency(user.totalSpent || 0)}</TableCell>
                      <TableCell className="text-sm">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            statusColors[user.isActive ? 'active' : 'inactive'] ||
                            'bg-gray-100'
                          }
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
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
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/users/${user._id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(user._id, user.role === 'admin' ? 'user' : 'admin')}>
                              <UserCheck className="mr-2 h-4 w-4" />
                              {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(user._id, !user.isActive)}>
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
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteUser(user._id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
