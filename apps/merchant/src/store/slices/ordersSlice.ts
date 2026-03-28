import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { OrdersFiltersValue } from '@/components/order/orders-filters'

export type OrdersUiState = {
  draftFilters: OrdersFiltersValue
  appliedFilters: OrdersFiltersValue
  page: number
  pageSize: number
  selectedOrderId: string | null
  isDetailOpen: boolean
}

export const defaultOrdersFilters: OrdersFiltersValue = {
  q: '',
  statuses: [],
  sortBy: 'createdAt',
  sortDir: 'DESC',
  hasTracking: ''
}

const initialState: OrdersUiState = {
  draftFilters: { ...defaultOrdersFilters },
  appliedFilters: { ...defaultOrdersFilters },
  page: 1,
  pageSize: 20,
  selectedOrderId: null,
  isDetailOpen: false
}

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setOrdersDraftFilters(
      state,
      action: PayloadAction<Partial<OrdersFiltersValue>>
    ) {
      state.draftFilters = {
        ...state.draftFilters,
        ...action.payload
      }
    },
    applyOrdersDraftFilters(state) {
      state.appliedFilters = { ...state.draftFilters }
      state.page = 1
    },
    applyOrdersFilters(state, action: PayloadAction<OrdersFiltersValue>) {
      state.draftFilters = { ...action.payload }
      state.appliedFilters = { ...action.payload }
      state.page = 1
    },
    resetOrdersFilters(state) {
      state.draftFilters = { ...defaultOrdersFilters }
      state.appliedFilters = { ...defaultOrdersFilters }
      state.page = 1
    },
    setOrdersPage(state, action: PayloadAction<number>) {
      state.page = action.payload
    },
    setOrdersPageSize(state, action: PayloadAction<number>) {
      state.pageSize = action.payload
      state.page = 1
    },
    openOrderDetail(state, action: PayloadAction<string>) {
      state.selectedOrderId = action.payload
      state.isDetailOpen = true
    },
    closeOrderDetail(state) {
      state.selectedOrderId = null
      state.isDetailOpen = false
    }
  }
})

export const {
  setOrdersDraftFilters,
  applyOrdersDraftFilters,
  applyOrdersFilters,
  resetOrdersFilters,
  setOrdersPage,
  setOrdersPageSize,
  openOrderDetail,
  closeOrderDetail
} = ordersSlice.actions

export default ordersSlice.reducer
