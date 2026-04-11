// src/store/slices/profileSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../index'
import type { IUser } from '@/models/User'
import { axiosInstance } from '@/lib/axios'
import type { AvatarValue } from '@/lib/avatar'

interface ProfileState {
  profile: (IUser & { defaultAddress?: any; addresses?: any[] }) | null
  loading: boolean
  error: string | null
}

const initialState: ProfileState = {
  profile: null,
  loading: false,
  error: null,
}

// Fetch current user profile
export const fetchProfile = createAsyncThunk(
  'profile/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/api/user/profile')
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Update profile (name, phone, avatar)
export const updateProfile = createAsyncThunk(
  'profile/update',
  async (data: { name?: string; phone?: string; avatar?: AvatarValue }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put('/api/user/profile', data)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Change password
export const changePassword = createAsyncThunk(
  'profile/changePassword',
  async (credentials: { currentPassword: string; newPassword: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put('/api/user/password', credentials)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Delete account
export const deleteAccount = createAsyncThunk(
  'profile/deleteAccount',
  async (_, { rejectWithValue }) => {
    try {
      await axiosInstance.delete('/api/user/account')
      return { success: true }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfile: (state) => {
      state.profile = null
    },
    setProfile: (state, action: PayloadAction<IUser & { defaultAddress?: any; addresses?: any[] }>) => {
      state.profile = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false
        state.profile = action.payload.data
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile = { ...state.profile, ...action.payload.data }
        }
      })
      .addCase(changePassword.fulfilled, (state) => {
        // Password changed, no profile data to update
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        state.profile = null
      })
  },
})

export const { clearProfile, setProfile } = profileSlice.actions

// Selectors
export const selectProfile = (state: RootState) => state.profile.profile
export const selectProfileLoading = (state: RootState) => state.profile.loading
export const selectProfileError = (state: RootState) => state.profile.error

export default profileSlice.reducer
