// src/store/slices/cartSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../index'
import type { CartItem } from '@/types'
import { axiosInstance } from '@/lib/axios'

interface CartState {
  items: CartItem[]
  coupon: { code: string; discount: number } | null
  loading: boolean
  error: string | null
  // UI state (retained for backward compatibility)
  isOpen?: boolean
  userId?: string
}

const initialState: CartState = {
  items: [],
  coupon: null,
  loading: false,
  error: null,
  isOpen: false,
  userId: undefined,
}

// Async thunk for syncing cart to server
export const syncCart = createAsyncThunk(
  'cart/syncCart',
  async (_, { getState }) => {
    const state = getState() as RootState
    const { items, coupon, userId } = state.cart
    // Only sync if authenticated
    if (!userId && !state.auth.user?.id) return

    if (items.length === 0) {
      const response = await axiosInstance.delete('/api/cart')
      return response.data
    }

    const response = await axiosInstance.post('/api/cart', { items, coupon })
    return response.data
  }
)

// Async thunk for fetching user's cart from server
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/api/cart')
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setUserId: (state, action: PayloadAction<string | undefined>) => {
      state.userId = action.payload
    },
    addItem: (state, action: PayloadAction<CartItem>) => {
      const item = action.payload
      const existingItem = state.items.find(
        (i) => i.product.toString() === item.product.toString()
      )

      if (existingItem) {
        existingItem.quantity += item.quantity
      } else {
        // Don't include addedAt in client state to avoid non-serializable Date
        const { addedAt, ...itemWithoutAddedAt } = item
        state.items.push(itemWithoutAddedAt)
      }

      state.isOpen = true
    },
    removeItem: (state, action: PayloadAction<string>) => {
      const productId = action.payload
      state.items = state.items.filter(
        (item) => item.product.toString() !== productId
      )
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ productId: string; quantity: number }>
    ) => {
      const { productId, quantity } = action.payload
      if (quantity <= 0) {
        state.items = state.items.filter(
          (item) => item.product.toString() !== productId
        )
        return
      }

      const item = state.items.find(
        (item) => item.product.toString() === productId
      )
      if (item) {
        item.quantity = quantity
      }
    },
    clearCart: (state) => {
      state.items = []
      state.coupon = null
    },
    toggleCart: (state) => {
      state.isOpen = !state.isOpen
    },
    openCart: (state) => {
      state.isOpen = true
    },
    closeCart: (state) => {
      state.isOpen = false
    },
    setCartOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload
    },
    // Hydration from server (for logged-in users)
    hydrateCart: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload
    },
    applyCoupon: (state, action: PayloadAction<{ code: string; discount: number }>) => {
      state.coupon = action.payload
    },
    removeCoupon: (state) => {
      state.coupon = null
    },
    // Backward compatibility: accept old payload shape
    setCoupon: (state, action: PayloadAction<{ code?: string; discount?: number }>) => {
      if (action.payload.code && action.payload.discount !== undefined) {
        state.coupon = { code: action.payload.code, discount: action.payload.discount }
      } else {
        state.coupon = null
      }
    },
    clearCoupon: (state) => {
      state.coupon = null
    },
  },
  extraReducers: (builder) => {
    builder
      // syncCart
      .addCase(syncCart.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(syncCart.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(syncCart.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to sync cart'
      })
      // fetchCart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.data?.items || []
        if (action.payload.data?.coupon) {
          state.coupon = action.payload.data.coupon
        } else {
          state.coupon = null
        }
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string || action.error.message || 'Failed to fetch cart'
      })
  },
})

export const {
  setUserId,
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
  toggleCart,
  openCart,
  closeCart,
  setCartOpen,
  hydrateCart,
  applyCoupon,
  removeCoupon,
  setCoupon,
  clearCoupon,
} = cartSlice.actions

// Selectors
export const selectCartItems = (state: RootState) => state.cart.items
export const selectCartIsOpen = (state: RootState) => state.cart.isOpen
export const selectCartUserId = (state: RootState) => state.cart.userId
export const selectCartSubtotal = (state: RootState) =>
  state.cart.items.reduce((total, item) => {
    const price = item.discountedPrice || item.price
    return total + price * item.quantity
  }, 0)
export const selectCartItemCount = (state: RootState) =>
  state.cart.items.reduce((count, item) => count + item.quantity, 0)
// Alias for spec
export const selectCartCount = selectCartItemCount

export const selectCartCoupon = (state: RootState) => state.cart.coupon
export const selectCartCouponCode = (state: RootState) => state.cart.coupon?.code || null
export const selectCartCouponDiscount = (state: RootState) => state.cart.coupon?.discount || 0

export const selectCartTotal = (state: RootState) => {
  const subtotal = selectCartSubtotal(state)
  const coupon = selectCartCoupon(state)
  return coupon ? subtotal - coupon.discount : subtotal
}

export default cartSlice.reducer
