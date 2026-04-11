// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit'
import cartReducer from './slices/cartSlice'
import authReducer from './slices/authSlice'
import productsReducer from './slices/productsSlice'
import ordersReducer from './slices/ordersSlice'
import categoriesReducer from './slices/categoriesSlice'
import couponsReducer from './slices/couponsSlice'
import wishlistReducer from './slices/wishlistSlice'
import addressesReducer from './slices/addressSlice'
import profileReducer from './slices/profileSlice'
import { useAppDispatch, useAppSelector } from '../hooks/useRedux'

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    auth: authReducer,
    products: productsReducer,
    orders: ordersReducer,
    categories: categoriesReducer,
    coupons: couponsReducer,
    wishlist: wishlistReducer,
    addresses: addressesReducer,
    profile: profileReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['cart/setCartOpen'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export { useAppDispatch, useAppSelector }
