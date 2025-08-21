import axios from "@/lib/axios"

// Types
export interface BankAccount {
  id: number
  bankName: string
  accountNumber: string
  confirmAccountNumber: string
  accountHolderName: string
  status: "VERIFIED" | "PENDING" | "FAILED"
  isDefault: boolean
}

export interface CreateBankAccountRequest {
  bankName: string
  accountNumber: string
  accountHolderName: string
  isDefault: boolean
}

export interface UpdateBankAccountRequest extends CreateBankAccountRequest {
  id: number
}

// Get all bank accounts
export async function getBankAccountsRequester(): Promise<
  BankAccount[] | null
> {
  try {
    const res = await axios.get("/api/merchant/bank-accounts/bank-list", {
      withCredentials: true
    })

    console.log("Fetched bank accounts:", res.data)
    return res.data
  } catch (error) {
    console.error("Error fetching bank accounts:", error)
    return null
  }
}

// Create new bank account
export async function createBankAccountRequester(
  accountData: CreateBankAccountRequest
): Promise<BankAccount | null> {
  console.log("Creating bank account:", accountData)

  try {
    const res = await axios.post(
      "/api/merchant/bank-accounts/create",
      accountData,
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )

    console.log("Created bank account:", res.data)
    return res.data
  } catch (error) {
    console.error("Error creating bank account:", error)
    return null
  }
}

// Update bank account
export async function updateBankAccountRequester(
  accountData: UpdateBankAccountRequest
): Promise<BankAccount | null> {
  console.log("Updating bank account:", accountData)

  try {
    const res = await axios.put(
      `/api/merchant/bank-accounts/${accountData.id}`,
      accountData,
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )

    console.log("Updated bank account:", res.data)
    return res.data
  } catch (error) {
    console.error("Error updating bank account:", error)
    return null
  }
}

// Delete bank account
export async function deleteBankAccountRequester(
  accountId: number
): Promise<boolean> {
  console.log("Deleting bank account:", accountId)

  try {
    await axios.delete(`/api/merchant/bank-accounts/${accountId}`, {
      withCredentials: true
    })

    console.log("Deleted bank account successfully")
    return true
  } catch (error) {
    console.error("Error deleting bank account:", error)
    return false
  }
}

// Set default bank account
export async function setDefaultBankAccountRequester(
  accountId: number
): Promise<boolean> {
  console.log("Setting default bank account:", accountId)

  try {
    await axios.patch(
      `/api/merchant/bank-accounts/${accountId}/set-default`,
      {},
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )

    console.log("Set default bank account successfully")
    return true
  } catch (error) {
    console.error("Error setting default bank account:", error)
    return false
  }
}
