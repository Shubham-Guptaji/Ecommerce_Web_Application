// src/store/slices/couponsSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { RootState } from '../index'
import type { ICoupon } from '@/models/Coupon'
import { axiosInstance } from '@/lib/axios'

interface CouponsState {
  coupons: ICoupon[]
  appliedCoupon: ICoupon | null
  loading: boolean
  error: string | null
}

type CouponPayload = {
  code: string
  type: 'flat' | 'percentage'
  value: number
  minOrderValue: number
  maxDiscount?: number | null
  usageLimit: number
  expiresAt: string
  isActive: boolean
}

const initialState: CouponsState = {
  coupons: [],
  appliedCoupon: null,
  loading: false,
  error: null,
}

// Fetch all coupons (admin)
export const fetchCoupons = createAsyncThunk(
  'coupons/fetchCoupons',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/api/admin/coupons')
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Create coupon (admin)
export const createCoupon = createAsyncThunk(
  'coupons/create',
  async (couponData: CouponPayload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/api/admin/coupons', couponData)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Update coupon (admin)
export const updateCoupon = createAsyncThunk(
  'coupons/update',
  async (
    { id, couponData }: { id: string; couponData: CouponPayload },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.put(`/api/admin/coupons/${id}`, couponData)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Delete coupon (admin)
export const deleteCoupon = createAsyncThunk(
  'coupons/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/api/admin/coupons/${id}`)
      return id
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Validate and apply coupon
export const validateCoupon = createAsyncThunk(
  'coupons/validate',
  async (
    { code, orderTotal }: { code: string; orderTotal: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post('/api/coupons/validate', {
        code,
        orderTotal,
      })
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Invalid coupon code')
    }
  }
)

// Remove applied coupon
export const removeAppliedCoupon = createAsyncThunk(
  'coupons/removeApplied',
  async () => {
    return true // Just for state management
  }
)

const couponsSlice = createSlice({
  name: 'coupons',
  initialState,
  reducers: {
    setAppliedCoupon: (state, action) => {
      state.appliedCoupon = action.payload
    },
    clearAppliedCoupon: (state) => {
      state.appliedCoupon = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCoupons.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.loading = false
        state.coupons = action.payload.data || []
      })
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(createCoupon.fulfilled, (state, action) => {
        const coupon = action.payload.data
        if (coupon) {
          state.coupons.push(coupon)
        }
      })
      .addCase(updateCoupon.fulfilled, (state, action) => {
        const updatedCoupon = action.payload.data
        if (updatedCoupon) {
          const index = state.coupons.findIndex(
            (c) => c._id.toString() === updatedCoupon._id.toString()
          )
          if (index !== -1) {
            state.coupons[index] = updatedCoupon
          }
        }
      })
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        const id = action.payload as string
        state.coupons = state.coupons.filter((c) => c._id.toString() !== id)
      })
      .addCase(validateCoupon.fulfilled, (state, action) => {
        state.appliedCoupon = action.payload.data?.coupon || null
      })
      .addCase(validateCoupon.rejected, (state, action) => {
        state.error = action.payload as string
      })
      .addCase(removeAppliedCoupon.fulfilled, (state) => {
        state.appliedCoupon = null
      })
  },
})

export const { setAppliedCoupon, clearAppliedCoupon } = couponsSlice.actions

// Selectors
export const selectAllCoupons = (state: RootState) => state.coupons.coupons
export const selectAppliedCoupon = (state: RootState) => state.coupons.appliedCoupon
export const selectCouponsLoading = (state: RootState) => state.coupons.loading
export const selectCouponsError = (state: RootState) => state.coupons.error

export default couponsSlice.reducer
