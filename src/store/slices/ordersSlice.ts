// src/store/slices/ordersSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../index'
import type { IOrder } from '@/models/Order'
import type { OrderStatus } from '@/types'
import { axiosInstance } from '@/lib/axios'

interface OrdersState {
  orders: IOrder[]
  order: IOrder | null
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: {
    status?: string
    paymentMethod?: string
    startDate?: string
    endDate?: string
  }
}

const initialState: OrdersState = {
  orders: [],
  order: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {},
}

// Fetch user orders
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (
    params: { page?: number; limit?: number; status?: string },
    { rejectWithValue }
  ) => {
    try {
      const queryParams = new URLSearchParams()
      if (params.page) queryParams.set('page', params.page.toString())
      if (params.limit) queryParams.set('limit', params.limit.toString())
      if (params.status) queryParams.set('status', params.status)

      const response = await axiosInstance.get(`/api/orders?${queryParams.toString()}`)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Fetch single order
export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/api/orders/${id}`)
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Create order (checkout)
export const createOrder = createAsyncThunk(
  'orders/create',
  async (
    orderData: {
      addressId: string
      deliveryMethod: 'standard' | 'express'
      notes?: string
      paymentMethod: 'razorpay' | 'cod'
      couponCode?: string
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post('/api/orders', orderData)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Cancel order (user)
export const cancelOrder = createAsyncThunk(
  'orders/cancel',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/api/orders/${id}/cancel`)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Return order (user) - request refund for delivered order
export const returnOrder = createAsyncThunk(
  'orders/return',
  async ({ id, reason }: { id: string; reason: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/api/orders/${id}/return`, { reason })
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Admin: Fetch all orders with filters
export const fetchAllOrders = createAsyncThunk(
  'orders/fetchAll',
  async (
    params: {
      page?: number
      limit?: number
      status?: string
      paymentMethod?: string
      startDate?: string
      endDate?: string
      search?: string
    },
    { rejectWithValue }
  ) => {
    try {
      const queryParams = new URLSearchParams()
      if (params.page) queryParams.set('page', params.page.toString())
      if (params.limit) queryParams.set('limit', params.limit.toString())
      if (params.status) queryParams.set('status', params.status)
      if (params.paymentMethod) queryParams.set('paymentMethod', params.paymentMethod)
      if (params.startDate) queryParams.set('startDate', params.startDate)
      if (params.endDate) queryParams.set('endDate', params.endDate)
      if (params.search) queryParams.set('search', params.search)

      const response = await axiosInstance.get(`/api/admin/orders?${queryParams.toString()}`)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Admin: Update order status
export const updateOrderStatus = createAsyncThunk(
  'orders/updateStatus',
  async (
    { id, status: newStatus, note }: { id: string; status: OrderStatus; note?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.put(`/api/admin/orders/${id}`, {
        status: newStatus,
        adminNote: note,
      })
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Admin: Process refund
export const refundOrder = createAsyncThunk(
  'orders/refund',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/api/payment/refund/${id}`)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearOrder: (state) => {
      state.order = null
    },
    setOrder: (state, action: PayloadAction<IOrder>) => {
      state.order = action.payload
    },
    setFilters: (state, action: PayloadAction<Partial<OrdersState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload }
      state.pagination.page = 1
    },
    clearFilters: (state) => {
      state.filters = {}
      state.pagination.page = 1
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user orders
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false
        state.orders = action.payload.data || []
        state.pagination = {
          ...state.pagination,
          total: action.payload.total || 0,
          totalPages: action.payload.pages || 0,
          page: action.payload.page || state.pagination.page,
          limit: action.payload.limit || state.pagination.limit,
        }
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Fetch single order
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.order = action.payload?.data || null
        state.error = null
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Create order
      .addCase(createOrder.fulfilled, (state, action) => {
        state.orders.unshift(action.payload.data)
        state.pagination.total += 1
        state.loading = false
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Cancel order - optimistic removal
      .addCase(cancelOrder.pending, (state, action) => {
        const id = action.meta.arg as string
        state.orders = state.orders.filter((o) => o._id.toString() !== id)
        if (state.order && state.order._id.toString() === id) {
          state.order = null
        }
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        // No need to update since we already removed; but if we wanted to keep with cancelled status, we could.
        // For simplicity, we already removed it, so nothing to do.
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        // Note: component will refetch to restore order on error
      })
      // Return order (refund)
      .addCase(returnOrder.fulfilled, (state, action) => {
        const { id } = action.meta.arg
        const returnedOrder = action.payload.data
        const index = state.orders.findIndex(
          (o) => o._id.toString() === id
        )
        if (index !== -1) {
          state.orders[index] = { ...state.orders[index], ...returnedOrder }
        }
        if (state.order && state.order._id.toString() === id) {
          state.order = { ...state.order, ...returnedOrder }
        }
      })
      // Admin: Fetch all orders
      .addCase(fetchAllOrders.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.loading = false
        state.orders = action.payload.data || []
        state.pagination = {
          ...state.pagination,
          total: action.payload.total || 0,
          totalPages: action.payload.pages || 0,
          page: action.payload.page || state.pagination.page,
          limit: action.payload.limit || state.pagination.limit,
        }
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Admin: Update order status
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const { id, status: newStatus } = action.meta.arg
        const index = state.orders.findIndex(
          (o) => o._id.toString() === id
        )
        if (index !== -1) {
          state.orders[index] = {
            ...state.orders[index],
            status: newStatus,
            statusHistory: [
              ...state.orders[index].statusHistory,
              {
                status: newStatus,
                timestamp: new Date(),
                note: action.payload?.note
              },
            ],
          }
        }
        if (state.order && state.order._id.toString() === id) {
          state.order = {
            ...state.order,
            status: newStatus,
            statusHistory: [
              ...state.order.statusHistory,
              {
                status: newStatus,
                timestamp: new Date(),
                note: action.payload?.note
              },
            ],
          }
        }
      })
      // Admin: Refund
      .addCase(refundOrder.fulfilled, (state, action) => {
        const id = action.meta.arg as string
        const index = state.orders.findIndex(
          (o) => o._id.toString() === id
        )
        if (index !== -1) {
          state.orders[index] = {
            ...state.orders[index],
            paymentInfo: {
              ...state.orders[index].paymentInfo,
              status: 'refunded',
            },
            status: 'refunded',
          }
        }
        if (state.order && state.order._id.toString() === id) {
          state.order = {
            ...state.order,
            paymentInfo: {
              ...state.order.paymentInfo,
              status: 'refunded',
            },
            status: 'refunded',
          }
        }
      })
  },
})

export const {
  clearOrder,
  setOrder,
  setFilters,
  clearFilters,
  setPage,
} = ordersSlice.actions

// Selectors
export const selectAllOrders = (state: RootState) => state.orders.orders
export const selectOrder = (state: RootState) => state.orders.order
export const selectOrdersLoading = (state: RootState) => state.orders.loading
export const selectOrdersError = (state: RootState) => state.orders.error
export const selectOrdersPagination = (state: RootState) => state.orders.pagination
export const selectOrdersFilters = (state: RootState) => state.orders.filters

export default ordersSlice.reducer
