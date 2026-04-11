// src/store/slices/wishlistSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../index'
import type { IProduct } from '@/models/Product'
import { axiosInstance } from '@/lib/axios'

interface WishlistState {
  items: IProduct[]
  loading: boolean
  error: string | null
}

const initialState: WishlistState = {
  items: [],
  loading: false,
  error: null,
}

// Fetch user wishlist
export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/api/user/wishlist')
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Toggle wishlist item
export const toggleWishlistItem = createAsyncThunk(
  'wishlist/toggle',
  async (productId: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/api/user/wishlist/${productId}`)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    clearWishlist: (state) => {
      state.items = []
    },
    // For optimistic updates from API response
    setWishlistItems: (state, action: PayloadAction<IProduct[]>) => {
      state.items = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false
        const items = action.payload.data?.wishlist || []
        // Deduplicate by _id to ensure React keys are unique
        state.items = items.filter((item: any, index: number, self: any[]) =>
          index === self.findIndex((p: any) => p._id.toString() === item._id.toString())
        )
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(toggleWishlistItem.fulfilled, (state, action) => {
        const { product, isInWishlist } = action.payload.data
        if (isInWishlist) {
          // Add product to wishlist
          if (!state.items.find((p) => p._id.toString() === product._id.toString())) {
            state.items.push(product)
          }
        } else {
          // Remove product from wishlist
          state.items = state.items.filter(
            (p) => p._id.toString() !== product._id.toString()
          )
        }
      })
      .addCase(toggleWishlistItem.rejected, (state, action) => {
        state.error = action.payload as string
      })
  },
})

export const { clearWishlist, setWishlistItems } = wishlistSlice.actions

// Selectors
export const selectWishlistItems = (state: RootState) => state.wishlist.items
export const selectWishlistLoading = (state: RootState) => state.wishlist.loading
export const selectWishlistError = (state: RootState) => state.wishlist.error

export const selectIsWishlisted = (state: RootState, productId: string) => {
  return state.wishlist.items.some((product) => product._id.toString() === productId)
}

export default wishlistSlice.reducer
