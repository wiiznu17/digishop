import { configureStore } from '@reduxjs/toolkit'
import appReducer from '@/store/slices/appSlice'
import merchantReducer from '@/store/slices/merchantSlice'
import ordersReducer from '@/store/slices/ordersSlice'
import productsReducer from '@/store/slices/productsSlice'

export const store = configureStore({
  reducer: {
    app: appReducer,
    merchant: merchantReducer,
    orders: ordersReducer,
    products: productsReducer
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
