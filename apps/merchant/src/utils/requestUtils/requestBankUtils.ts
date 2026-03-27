import axios from '@/lib/axios'

// Types
export interface BankAccount {
  id: number
  bankName: string
  accountNumber: string
  accountHolderName: string
  status: 'VERIFIED' | 'PENDING' | 'FAILED'
  isDefault: boolean
}

export interface CreateBankAccountRequest {
  bankName: string
  accountNumber: string
  accountHolderName: string
  isDefault: boolean
}

// Get all bank accounts
export async function getBankAccountsRequester(): Promise<
  BankAccount[] | null
> {
  try {
    const res = await axios.get('/api/merchant/bank-accounts/bank-list', {
      withCredentials: true
    })
    return res.data
  } catch (error) {
    console.log('Error to GET bank account: ', error)
    return null
  }
}

// Create new bank account
export async function createBankAccountRequester(
  accountData: CreateBankAccountRequest
): Promise<BankAccount | null> {
  try {
    const res = await axios.post(
      '/api/merchant/bank-accounts/create',
      accountData,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    return res.data
  } catch (error) {
    console.log('Error to POST create new bank account: ', error)
    return null
  }
}

// Delete bank account
export async function deleteBankAccountRequester(
  accountId: number
): Promise<boolean> {
  console.log('account id: ', accountId)
  try {
    await axios.delete(`/api/merchant/bank-accounts/${accountId}`, {
      withCredentials: true
    })
    return true
  } catch (error) {
    console.log('Error to DELETE bank account: ', error)
    return false
  }
}

// Set default bank account
export async function setDefaultBankAccountRequester(
  accountId: number
): Promise<boolean> {
  try {
    await axios.patch(
      `/api/merchant/bank-accounts/set-default/${accountId}`,
      {},
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    return true
  } catch (error) {
    console.log('Error to set default account: ', error)
    return false
  }
}
