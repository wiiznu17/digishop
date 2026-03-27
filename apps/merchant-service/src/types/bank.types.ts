export type AddBankAccountPayload = {
  accountHolderName: string
  accountNumber: string
  bankName: string
  isDefault?: boolean
}

export type GetBankAccountListInput = {
  userSub?: number | string
  storeId?: number
}

export type AddBankAccountInput = {
  userSub?: number | string
  storeId?: number
  payload: AddBankAccountPayload
}

export type SetDefaultBankAccountInput = {
  accountId: string
  userSub?: number | string
  storeId?: number
}

export type DeleteBankAccountInput = {
  bankAccountId: string
  userSub?: number | string
  storeId?: number
}
