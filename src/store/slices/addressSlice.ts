// src/store/slices/addressSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../index'
import type { IAddress } from '@/models/Address'
import { axiosInstance } from '@/lib/axios'

interface AddressesState {
  addresses: IAddress[]
  loading: boolean
  error: string | null
}

const initialState: AddressesState = {
  addresses: [],
  loading: false,
  error: null,
}

// Fetch all addresses for current user
export const fetchAddresses = createAsyncThunk(
  'addresses/fetchAddresses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/api/user/addresses')
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Create address
export const createAddress = createAsyncThunk(
  'addresses/create',
  async (addressData: Omit<IAddress, '_id' | 'user' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/api/user/addresses', addressData)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Update address
export const updateAddress = createAsyncThunk(
  'addresses/update',
  async ({ id, data }: { id: string; data: Partial<IAddress> }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/api/user/addresses/${id}`, data)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Delete address
export const deleteAddress = createAsyncThunk(
  'addresses/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/api/user/addresses/${id}`)
      return { id }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

const addressesSlice = createSlice({
  name: 'addresses',
  initialState,
  reducers: {
    clearAddresses: (state) => {
      state.addresses = []
    },
    setAddresses: (state, action: PayloadAction<IAddress[]>) => {
      state.addresses = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAddresses.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.loading = false
        state.addresses = action.payload.data || []
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(createAddress.fulfilled, (state, action) => {
        state.addresses.push(action.payload.data)
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        const index = state.addresses.findIndex(
          (a) => a._id.toString() === action.meta.arg.id
        )
        if (index !== -1) {
          state.addresses[index] = action.payload.data
        }
      })
      .addCase(deleteAddress.pending, (state, action) => {
        const id = action.meta.arg as string
        state.addresses = state.addresses.filter(
          (a) => a._id.toString() !== id
        )
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        // Already removed in pending, nothing to do
      })
      .addCase(deleteAddress.rejected, (state, action) => {
        // No state changes; component will refetch on error
      })
  },
})

export const { clearAddresses, setAddresses } = addressesSlice.actions

// Selectors
export const selectAllAddresses = (state: RootState) => state.addresses.addresses
export const selectAddressesLoading = (state: RootState) => state.addresses.loading
export const selectAddressesError = (state: RootState) => state.addresses.error

export default addressesSlice.reducer
