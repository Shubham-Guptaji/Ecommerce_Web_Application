// src/store/slices/productsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../index'
import type { IProduct } from '@/models/Product'
import { axiosInstance } from '@/lib/axios'

interface ProductsState {
  products: IProduct[]
  product: IProduct | null
  featured: IProduct[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: {
    category?: string
    minPrice?: number
    maxPrice?: number
    sortBy?: string
    search?: string
  }
}

const initialState: ProductsState = {
  products: [],
  product: null,
  featured: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  filters: {},
}

// Fetch all products with filters
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (
    params: {
      page?: number
      limit?: number
      category?: string
      minPrice?: number
      maxPrice?: number
      sortBy?: string
      search?: string
    },
    { rejectWithValue }
  ) => {
    try {
      const queryParams = new URLSearchParams()
      if (params.page) queryParams.set('page', params.page.toString())
      if (params.limit) queryParams.set('limit', params.limit.toString())
      if (params.category) queryParams.set('category', params.category)
      if (params.minPrice) queryParams.set('minPrice', params.minPrice.toString())
      if (params.maxPrice) queryParams.set('maxPrice', params.maxPrice.toString())
      if (params.sortBy) queryParams.set('sortBy', params.sortBy)
      if (params.search) queryParams.set('search', params.search)

      const response = await axiosInstance.get(`/api/products?${queryParams.toString()}`)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Fetch single product by slug
export const fetchProductBySlug = createAsyncThunk(
  'products/fetchProductBySlug',
  async (slug: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/api/products/by-slug/${slug}`)
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null
      }
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Fetch featured products
export const fetchFeaturedProducts = createAsyncThunk(
  'products/fetchFeatured',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/api/products?featured=true&limit=20')
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Create product (admin)
export const createProduct = createAsyncThunk(
  'products/create',
  async (productData: any, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/api/products', productData)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Update product (admin)
export const updateProduct = createAsyncThunk(
  'products/update',
  async (
    { id, productData }: { id: string; productData: any },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.put(`/api/products/${id}`, productData)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Delete product (admin)
export const deleteProduct = createAsyncThunk(
  'products/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/api/products/${id}`)
      return id
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearProduct: (state) => {
      state.product = null
    },
    setFilters: (state, action: PayloadAction<Partial<ProductsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload }
      state.pagination.page = 1 // Reset to first page when filters change
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
      // Fetch products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false
        state.products = action.payload.data || []
        state.pagination = {
          ...state.pagination,
          total: action.payload.total || 0,
          totalPages: action.payload.pages || 0,
          page: action.payload.page || state.pagination.page,
          limit: action.payload.limit || state.pagination.limit,
        }
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // Fetch single product
      .addCase(fetchProductBySlug.fulfilled, (state, action) => {
        state.product = action.payload?.data?.product || null
        state.error = null
      })
      .addCase(fetchProductBySlug.rejected, (state, action) => {
        state.error = action.payload as string
      })
      // Fetch featured
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.featured = action.payload.data || []
      })
      // Create product
      .addCase(createProduct.fulfilled, (state) => {
        // Refetch products to include new one
        state.loading = false
      })
      // Update product
      .addCase(updateProduct.fulfilled, (state, action) => {
        const updatedProduct = action.payload.data?.product || action.payload.data
        if (updatedProduct) {
          const index = state.products.findIndex(
            (p) => p._id.toString() === updatedProduct._id.toString()
          )
          if (index !== -1) {
            state.products[index] = updatedProduct
          }
          if (state.product?._id.toString() === updatedProduct._id.toString()) {
            state.product = updatedProduct
          }
        }
      })
      // Delete product
      .addCase(deleteProduct.fulfilled, (state, action) => {
        const id = action.payload as string
        state.products = state.products.filter(
          (p) => p._id.toString() !== id
        )
        if (state.product?._id.toString() === id) {
          state.product = null
        }
      })
  },
})

export const {
  clearProduct,
  setFilters,
  clearFilters,
  setPage,
} = productsSlice.actions

// Selectors
export const selectAllProducts = (state: RootState) => state.products.products
export const selectProduct = (state: RootState) => state.products.product
export const selectFeaturedProducts = (state: RootState) => state.products.featured
export const selectProductsLoading = (state: RootState) => state.products.loading
export const selectProductsError = (state: RootState) => state.products.error
export const selectProductsPagination = (state: RootState) => state.products.pagination
export const selectProductsFilters = (state: RootState) => state.products.filters

export default productsSlice.reducer
