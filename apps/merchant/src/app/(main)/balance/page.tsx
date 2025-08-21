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
  Edit
} from "lucide-react"
import { useState } from "react"
import BankAccountDialog from "@/components/balance/linkBankAccount"

// Define types
interface BankAccount {
  id: number
  type: string
  provider: string
  accountNumber: string
  fullAccountNumber: string
  accountName: string
  accountType?: string
  branchName?: string
  idNumber?: string
  status: "verified" | "pending" | "failed"
  isDefault: boolean
  icon: React.ComponentType<{ className?: string }>
}

interface BankAccountFormData {
  provider: string
  fullAccountNumber: string
  accountNumber: string
  accountName: string
  accountType: string
  branchName: string
  idNumber: string
  isDefault: boolean
}

// Mock data - เหลือแค่บัญชีธนาคาร
const initialAccounts: BankAccount[] = [
  {
    id: 1,
    type: "bank",
    provider: "Bangkok Bank",
    accountNumber: "****1234",
    fullAccountNumber: "1234567890",
    accountName: "Online Store Co., Ltd.",
    accountType: "savings",
    branchName: "Central World",
    idNumber: "1234567890123",
    status: "verified",
    isDefault: true,
    icon: Building2
  },
  {
    id: 2,
    type: "bank",
    provider: "Kasikorn Bank",
    accountNumber: "****5678",
    fullAccountNumber: "0987654321",
    accountName: "Online Store Co., Ltd.",
    accountType: "current",
    branchName: "Siam Paragon",
    idNumber: "1234567890123",
    status: "pending",
    isDefault: false,
    icon: Building2
  }
]

export default function AccountLinking() {
  const [showBankDialog, setShowBankDialog] = useState<boolean>(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  const [linkedAccounts, setLinkedAccounts] =
    useState<BankAccount[]>(initialAccounts)

  const handleRemoveAccount = (accountId: number): void => {
    setLinkedAccounts((prev) => prev.filter((acc) => acc.id !== accountId))
  }

  const handleSetDefault = (accountId: number): void => {
    setLinkedAccounts((prev) =>
      prev.map((acc) => ({
        ...acc,
        isDefault: acc.id === accountId
      }))
    )
  }

  const handleEditAccount = (account: BankAccount): void => {
    setEditingAccount(account)
    setShowBankDialog(true)
  }

  const handleSaveAccount = (accountData: BankAccountFormData): void => {
    if (editingAccount) {
      // Update existing account
      setLinkedAccounts((prev) =>
        prev.map((acc) =>
          acc.id === editingAccount.id
            ? {
                ...acc,
                provider: accountData.provider,
                fullAccountNumber: accountData.fullAccountNumber,
                accountNumber: accountData.accountNumber,
                accountName: accountData.accountName,
                accountType: accountData.accountType,
                branchName: accountData.branchName,
                idNumber: accountData.idNumber,
                isDefault: accountData.isDefault,
                status: "pending" as const // Reset status when edited
              }
            : acc
        )
      )
    } else {
      // Add new account
      const newAccount: BankAccount = {
        id: Date.now(),
        type: "bank",
        provider: accountData.provider,
        fullAccountNumber: accountData.fullAccountNumber,
        accountNumber: accountData.accountNumber,
        accountName: accountData.accountName,
        accountType: accountData.accountType,
        branchName: accountData.branchName,
        idNumber: accountData.idNumber,
        icon: Building2,
        status: "pending",
        isDefault: linkedAccounts.length === 0 || accountData.isDefault
      }
      setLinkedAccounts((prev) => [...prev, newAccount])
    }
    setEditingAccount(null)
    setShowBankDialog(false)
  }

  const handleDialogClose = (): void => {
    setEditingAccount(null)
    setShowBankDialog(false)
  }

  const getStatusBadge = (status: BankAccount["status"]) => {
    switch (status) {
      case "verified":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "failed":
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
                  linkedAccounts.filter((acc) => acc.status === "verified")
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
                {linkedAccounts.find((acc) => acc.isDefault)?.provider ||
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
                          <h3 className="font-medium">{account.provider}</h3>
                          {account.isDefault && (
                            <Badge variant="outline">Default</Badge>
                          )}
                          {getStatusBadge(account.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {account.accountName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {account.accountNumber}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!account.isDefault && account.status === "verified" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(account.id)}
                        >
                          Set as Default
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditAccount(account)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveAccount(account.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
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
