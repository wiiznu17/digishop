"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MerchantHeader } from "@/components/dashboard-header"
import {
  Building2,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  AlertCircle,
  Edit,
  Loader2
} from "lucide-react"
import { useState, useEffect } from "react"
import BankAccountDialog from "@/components/balance/linkBankAccount"
import { useToast } from "@/hooks/use-toast"
import {
  getBankAccountsRequester,
  createBankAccountRequester,
  updateBankAccountRequester,
  deleteBankAccountRequester,
  setDefaultBankAccountRequester,
  type BankAccount,
  type CreateBankAccountRequest
} from "../../../utils/requestUtils/requestBankUtils"

interface BankAccountFormData {
  bankName: string
  confirmAccountNumber: string
  accountHolderName: string
  isDefault: boolean
}

export default function AccountLinking() {
  const { toast } = useToast()
  const [showBankDialog, setShowBankDialog] = useState<boolean>(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  const [linkedAccounts, setLinkedAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [actionLoading, setActionLoading] = useState<boolean>(false)

  // Load bank accounts on component mount
  useEffect(() => {
    loadBankAccounts()
  }, [])

  const loadBankAccounts = async (): Promise<void> => {
    setLoading(true)
    try {
      const accounts = await getBankAccountsRequester()
      if (accounts) {
        console.log("loading bank accounts: ", accounts)
        setLinkedAccounts(accounts)
      } else {
        console.error("Error loading bank accounts")
        toast({
          title: "Error",
          description: "Failed to load bank accounts",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error loading bank accounts:", error)
      toast({
        title: "Error",
        description: "Failed to load bank accounts",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveAccount = async (accountId: number): Promise<void> => {
    if (!confirm("Are you sure you want to remove this bank account?")) {
      return
    }

    setActionLoading(true)
    try {
      const success = await deleteBankAccountRequester(accountId)
      if (success) {
        setLinkedAccounts((prev) => prev.filter((acc) => acc.id !== accountId))
        toast({
          title: "Success",
          description: "Bank account removed successfully"
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to remove bank account",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error removing bank account:", error)
      toast({
        title: "Error",
        description: "Failed to remove bank account",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleSetDefault = async (accountId: number): Promise<void> => {
    setActionLoading(true)
    try {
      const success = await setDefaultBankAccountRequester(accountId)
      if (success) {
        setLinkedAccounts((prev) =>
          prev.map((acc) => ({
            ...acc,
            isDefault: acc.id === accountId
          }))
        )
        toast({
          title: "Success",
          description: "Default bank account updated successfully"
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to set default bank account",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error setting default bank account:", error)
      toast({
        title: "Error",
        description: "Failed to set default bank account",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditAccount = (account: BankAccount): void => {
    setEditingAccount(account)
    setShowBankDialog(true)
  }

  const handleSaveAccount = async (
    accountData: BankAccountFormData
  ): Promise<void> => {
    setActionLoading(true)
    try {
      const requestData: CreateBankAccountRequest = {
        bankName: accountData.bankName,
        accountNumber: accountData.confirmAccountNumber,
        accountHolderName: accountData.accountHolderName,
        isDefault: accountData.isDefault
      }

      if (editingAccount) {
        // Update existing account
        const updatedAccount = await updateBankAccountRequester({
          ...requestData,
          id: editingAccount.id
        })

        if (updatedAccount) {
          setLinkedAccounts((prev) =>
            prev.map((acc) =>
              acc.id === editingAccount.id ? updatedAccount : acc
            )
          )
          toast({
            title: "Success",
            description: "Bank account updated successfully"
          })
        } else {
          toast({
            title: "Error",
            description: "Failed to update bank account",
            variant: "destructive"
          })
          return
        }
      } else {
        // Create new account
        const newAccount = await createBankAccountRequester(requestData)

        if (newAccount) {
          setLinkedAccounts((prev) => [...prev, newAccount])
          toast({
            title: "Success",
            description: "Bank account added successfully"
          })
        } else {
          toast({
            title: "Error",
            description: "Failed to add bank account",
            variant: "destructive"
          })
          return
        }
      }

      setEditingAccount(null)
      setShowBankDialog(false)
    } catch (error) {
      console.error("Error saving bank account:", error)
      toast({
        title: "Error",
        description: "Failed to save bank account",
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDialogClose = (): void => {
    setEditingAccount(null)
    setShowBankDialog(false)
  }

  const getStatusBadge = (status: BankAccount["status"]) => {
    switch (status) {
      case "VERIFIED":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        )
      case "PENDING":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "FAILED":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading bank accounts...</span>
      </div>
    )
  }

  return (
    <div>
      <MerchantHeader
        title="Bank Account Management"
        description="Manage your bank accounts for receiving payments"
      />

      <div className="flex flex-1 flex-col gap-6 p-4">
        {/* Account summary */}
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Bank Accounts
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{linkedAccounts.length}</div>
              <p className="text-xs text-muted-foreground">
                Connected bank accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Verified Accounts
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  linkedAccounts.filter((acc) => acc.status === "VERIFIED")
                    .length
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Ready to receive funds
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Default Account
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {linkedAccounts.find((acc) => acc.isDefault)?.bankName ||
                  "Not set"}
              </div>
              <p className="text-xs text-muted-foreground">
                Main account for receiving funds
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Connected bank accounts list */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Bank Accounts</CardTitle>
              <CardDescription>
                Manage your bank accounts for receiving payments
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowBankDialog(true)}
              className="flex items-center gap-2"
              disabled={actionLoading}
            >
              <Plus className="h-4 w-4" />
              Add Bank Account
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {linkedAccounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">
                    No bank accounts added
                  </h3>
                  <p className="text-sm mb-4">
                    Add your first bank account to start receiving payments
                  </p>
                  <Button
                    onClick={() => setShowBankDialog(true)}
                    className="flex items-center gap-2 mx-auto"
                    disabled={actionLoading}
                  >
                    <Plus className="h-4 w-4" />
                    Add Bank Account
                  </Button>
                </div>
              ) : (
                linkedAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{account.bankName}</h3>
                          {account.isDefault && (
                            <Badge variant="outline">Default</Badge>
                          )}
                          {getStatusBadge(account.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {account.accountHolderName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {account.accountNumber}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!account.isDefault && account.status === "VERIFIED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(account.id)}
                          disabled={actionLoading}
                        >
                          {actionLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Set as Default"
                          )}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditAccount(account)}
                        className="text-blue-600 hover:text-blue-700"
                        disabled={actionLoading}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveAccount(account.id)}
                        className="text-red-600 hover:text-red-700"
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bank account info */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Bank-level security encryption</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Account verification takes 1-2 business days</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Full account numbers are encrypted and secure</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Support for all major Thai banks</span>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <span>
                  Editing account details will require re-verification
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bank Account Dialog */}
      <BankAccountDialog
        open={showBankDialog}
        onOpenChange={handleDialogClose}
        editingAccount={editingAccount}
        onSave={handleSaveAccount}
      />
    </div>
  )
}
