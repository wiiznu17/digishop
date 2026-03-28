import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ProductFilterState } from '@/components/product/productFilters'

export type ProductsUiState = {
  draftFilters: ProductFilterState
  appliedFilters: ProductFilterState
  page: number
  pageSize: number
  quickViewProductUuid: string | null
  quickViewOpen: boolean
  selectMode: boolean
  selectedUuids: string[]
  bulkStatusChoice: string
}

export const defaultProductFilters: ProductFilterState = {
  q: '',
  categoryUuid: undefined,
  status: undefined,
  reqStatus: undefined,
  stock: 'all',
  sortBy: 'createdAt',
  sortDir: 'desc'
}

const initialState: ProductsUiState = {
  draftFilters: { ...defaultProductFilters },
  appliedFilters: { ...defaultProductFilters },
  page: 1,
  pageSize: 20,
  quickViewProductUuid: null,
  quickViewOpen: false,
  selectMode: false,
  selectedUuids: [],
  bulkStatusChoice: 'ACTIVE'
}

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setProductsDraftFilters(
      state,
      action: PayloadAction<Partial<ProductFilterState>>
    ) {
      state.draftFilters = {
        ...state.draftFilters,
        ...action.payload
      }
    },
    applyProductsDraftFilters(state) {
      state.appliedFilters = { ...state.draftFilters }
      state.page = 1
    },
    setProductsStateFromUrl(
      state,
      action: PayloadAction<{
        filters: ProductFilterState
        page: number
        pageSize: number
      }>
    ) {
      state.draftFilters = { ...action.payload.filters }
      state.appliedFilters = { ...action.payload.filters }
      state.page = action.payload.page
      state.pageSize = action.payload.pageSize
    },
    resetProductsFilters(state) {
      state.draftFilters = { ...defaultProductFilters }
      state.appliedFilters = { ...defaultProductFilters }
      state.page = 1
    },
    setProductsPage(state, action: PayloadAction<number>) {
      state.page = action.payload
    },
    setProductsPageSize(state, action: PayloadAction<number>) {
      state.pageSize = action.payload
      state.page = 1
    },
    openQuickView(state, action: PayloadAction<string>) {
      state.quickViewProductUuid = action.payload
      state.quickViewOpen = true
    },
    closeQuickView(state) {
      state.quickViewOpen = false
      state.quickViewProductUuid = null
    },
    setProductsSelectMode(state, action: PayloadAction<boolean>) {
      state.selectMode = action.payload
      if (!action.payload) {
        state.selectedUuids = []
      }
    },
    toggleSelectedProduct(
      state,
      action: PayloadAction<{ uuid: string; checked: boolean }>
    ) {
      const next = new Set(state.selectedUuids)
      if (action.payload.checked) next.add(action.payload.uuid)
      else next.delete(action.payload.uuid)
      state.selectedUuids = Array.from(next)
    },
    toggleSelectAllProductsOnPage(
      state,
      action: PayloadAction<{ uuids: string[]; checked: boolean }>
    ) {
      const next = new Set(state.selectedUuids)
      if (action.payload.checked) {
        action.payload.uuids.forEach((uuid) => next.add(uuid))
      } else {
        action.payload.uuids.forEach((uuid) => next.delete(uuid))
      }
      state.selectedUuids = Array.from(next)
    },
    clearSelectedProducts(state) {
      state.selectedUuids = []
    },
    setBulkStatusChoice(state, action: PayloadAction<string>) {
      state.bulkStatusChoice = action.payload
    },
    removeProductsFromSelection(state, action: PayloadAction<string[]>) {
      const removeSet = new Set(action.payload)
      state.selectedUuids = state.selectedUuids.filter(
        (uuid) => !removeSet.has(uuid)
      )
    }
  }
})

export const {
  setProductsDraftFilters,
  applyProductsDraftFilters,
  setProductsStateFromUrl,
  resetProductsFilters,
  setProductsPage,
  setProductsPageSize,
  openQuickView,
  closeQuickView,
  setProductsSelectMode,
  toggleSelectedProduct,
  toggleSelectAllProductsOnPage,
  clearSelectedProducts,
  setBulkStatusChoice,
  removeProductsFromSelection
} = productsSlice.actions

export default productsSlice.reducer
