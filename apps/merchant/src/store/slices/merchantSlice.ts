import { createSlice } from '@reduxjs/toolkit'

type MerchantUiState = {
  isProfileAddressEditOpen: boolean
  isProfileAddressAddOpen: boolean
  isBankAccountDialogOpen: boolean
}

const initialState: MerchantUiState = {
  isProfileAddressEditOpen: false,
  isProfileAddressAddOpen: false,
  isBankAccountDialogOpen: false
}

const merchantSlice = createSlice({
  name: 'merchant',
  initialState,
  reducers: {
    openProfileAddressEdit(state) {
      state.isProfileAddressEditOpen = true
    },
    closeProfileAddressEdit(state) {
      state.isProfileAddressEditOpen = false
    },
    openProfileAddressAdd(state) {
      state.isProfileAddressAddOpen = true
    },
    closeProfileAddressAdd(state) {
      state.isProfileAddressAddOpen = false
    },
    openBankAccountDialog(state) {
      state.isBankAccountDialogOpen = true
    },
    closeBankAccountDialog(state) {
      state.isBankAccountDialogOpen = false
    }
  }
})

export const {
  openProfileAddressEdit,
  closeProfileAddressEdit,
  openProfileAddressAdd,
  closeProfileAddressAdd,
  openBankAccountDialog,
  closeBankAccountDialog
} = merchantSlice.actions

export default merchantSlice.reducer
