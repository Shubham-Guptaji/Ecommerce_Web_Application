// src/store/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../index'
import { signIn, signOut, getSession } from 'next-auth/react'
import { axiosInstance } from '@/lib/axios'

interface User {
  id: string
  name?: string | null
  email?: string | null
  role?: string
  isEmailVerified?: boolean
  avatar?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
}

// Login thunk (using NextAuth credentials)
export const login = createAsyncThunk(
  'auth/login',
  async (
    credentials: { email: string; password: string; callbackUrl?: string },
    { rejectWithValue }
  ) => {
    try {
      const result = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      })

      if (result?.error) {
        return rejectWithValue(result.error)
      }

      // Get session to retrieve user data
      const session = await getSession()
      if (!session?.user) {
        return rejectWithValue('Failed to get session after sign in')
      }

      // Map NextAuth user to our User shape
      const user = {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        isEmailVerified: session.user.isEmailVerified,
        avatar: session.user.image ?? undefined,
      }

      return { user }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed')
    }
  }
)

// Logout thunk
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await signOut({ redirect: false })
    } catch (error: any) {
      return rejectWithValue(error.message || 'Logout failed')
    }
  }
)

// Update profile thunk
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (
    data: { name?: string; email?: string; phone?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.put('/api/user/profile', data)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Update failed')
    }
  }
)

// Change password thunk
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (
    data: { currentPassword: string; newPassword: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.put('/api/user/password', data)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Password change failed')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      state.isAuthenticated = !!action.payload
    },
    clearAuth: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.error = null
    },
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        if (action.payload?.user) {
          state.user = action.payload.user
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        state.isAuthenticated = false
        state.user = null
      })
      // Logout
      .addCase(logout.pending, (state) => {
        state.loading = true
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false
        state.user = null
        state.token = null
        state.isAuthenticated = false
      })
      .addCase(logout.rejected, (state) => {
        state.loading = false
      })
      // Update profile
      .addCase(updateProfile.fulfilled, (state, action) => {
        if (action.payload?.data?.user) {
          state.user = { ...state.user, ...action.payload.data.user }
        }
      })
      // Change password - just clear loading on success
      .addCase(changePassword.fulfilled, (state) => {
        // No state change needed, success handled by component
      })
  },
})

export const { setUser, clearAuth, setAuthError } = authSlice.actions

// Selectors
export const selectCurrentUser = (state: RootState) => state.auth.user
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated
export const selectAuthLoading = (state: RootState) => state.auth.loading
export const selectAuthError = (state: RootState) => state.auth.error

export default authSlice.reducer
