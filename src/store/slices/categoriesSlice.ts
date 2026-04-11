// src/store/slices/categoriesSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { RootState } from '../index'
import type { ICategory } from '@/models/Category'
import { axiosInstance } from '@/lib/axios'

interface CategoriesState {
  categories: ICategory[]
  loading: boolean
  error: string | null
}

const initialState: CategoriesState = {
  categories: [],
  loading: false,
  error: null,
}

// Fetch all categories (admin)
export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/api/admin/categories')
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Create category (admin)
export const createCategory = createAsyncThunk(
  'categories/create',
  async (categoryData: any, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/api/admin/categories', categoryData)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Update category (admin)
export const updateCategory = createAsyncThunk(
  'categories/update',
  async (
    { id, categoryData }: { id: string; categoryData: any },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.put(`/api/admin/categories/${id}`, categoryData)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Delete category (admin)
export const deleteCategory = createAsyncThunk(
  'categories/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/api/admin/categories/${id}`)
      return id
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    clearCategories: (state) => {
      state.categories = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false
        state.categories = action.payload.data?.flat || []
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        const category = action.payload.data
        if (category) {
          state.categories.push(category)
        }
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        const updatedCategory = action.payload.data
        if (updatedCategory) {
          const index = state.categories.findIndex(
            (c) => c._id.toString() === updatedCategory._id.toString()
          )
          if (index !== -1) {
            state.categories[index] = updatedCategory
          }
        }
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        const id = action.payload as string
        state.categories = state.categories.filter(
          (c) => c._id.toString() !== id
        )
      })
  },
})

export const { clearCategories } = categoriesSlice.actions

// Selectors
export const selectAllCategories = (state: RootState) => state.categories.categories
export const selectCategoriesLoading = (state: RootState) => state.categories.loading
export const selectCategoriesError = (state: RootState) => state.categories.error

export default categoriesSlice.reducer
