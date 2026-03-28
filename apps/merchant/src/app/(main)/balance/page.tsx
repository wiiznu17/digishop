'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MerchantHeader } from '@/components/dashboard-header'
import {
  Building2,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { useState } from 'react'
import BankAccountDialog from '@/components/balance/linkBankAccount'
import { type BankAccount } from '../../../utils/requestUtils/requestBankUtils'
import { useBankAccountsQuery } from '@/hooks/queries/useMerchantQueries'
import {
  useCreateBankAccountMutation,
  useDeleteBankAccountMutation,
  useSetDefaultBankAccountMutation
} from '@/hooks/mutations/useMerchantMutations'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  closeBankAccountDialog,
  openBankAccountDialog
} from '@/store/slices/merchantSlice'

interface BankAccountFormData {
  bankName: string
  confirmAccountNumber: string
  accountHolderName: string
  isDefault: boolean
}

// mask
function maskAccountNumber(accountNumber: string) {
  if (!accountNumber) return accountNumber
  if (accountNumber.length <= 6) return accountNumber
  return accountNumber.slice(0, 2) + 'xxxxxx' + accountNumber.slice(-4)
}

export default function AccountLinking() {
  const dispatch = useAppDispatch()
  const showBankDialog = useAppSelector(
    (state) => state.merchant.isBankAccountDialogOpen
  )
  const {
    data: linkedAccounts = [],
    isLoading: loading,
    isFetching
  } = useBankAccountsQuery()
  const createBankAccountMutation = useCreateBankAccountMutation()
  const deleteBankAccountMutation = useDeleteBankAccountMutation()
  const setDefaultBankAccountMutation = useSetDefaultBankAccountMutation()
  const [removingAccountId, setRemovingAccountId] = useState<number | null>(
    null
  )
  const [defaultingAccountId, setDefaultingAccountId] = useState<number | null>(
    null
  )

  const handleSaveBankAccount = async (accountData: BankAccountFormData) => {
    try {
      await createBankAccountMutation.mutateAsync({
        bankName: accountData.bankName,
        accountNumber: accountData.confirmAccountNumber,
        accountHolderName: accountData.accountHolderName,
        isDefault: accountData.isDefault
      })
      dispatch(closeBankAccountDialog())
    } catch (error) {
      console.error('Error adding bank account:', error)
    }
  }

  const handleRemoveAccount = async (accountId: number) => {
    if (!confirm('Are you sure you want to remove this bank account?')) {
      return
    }
    setRemovingAccountId(accountId)
    try {
      await deleteBankAccountMutation.mutateAsync(accountId)
    } catch (error) {
      console.log('Error to remove bank account: ', error)
    } finally {
      setRemovingAccountId(null)
    }
  }

  const handleSetDefault = async (accountId: number) => {
    setDefaultingAccountId(accountId)
    try {
      await setDefaultBankAccountMutation.mutateAsync(accountId)
    } catch (error) {
      console.log('Error to set default for this bank account: ', error)
    } finally {
      setDefaultingAccountId(null)
    }
  }

  const getStatusBadge = (status: BankAccount['status']) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        )
      case 'PENDING':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case 'FAILED':
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
        {/* สรุปข้อมูลบัญชี */}
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
                  linkedAccounts.filter((acc) => acc.status === 'VERIFIED')
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
                  'Not set'}
              </div>
              <p className="text-xs text-muted-foreground">
                Main account for receiving funds
              </p>
            </CardContent>
          </Card>
        </div>

        {/* รายการบัญชี */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Bank Accounts</CardTitle>
              <CardDescription>
                Manage your bank accounts for receiving payments
              </CardDescription>
            </div>
            <Button
              onClick={() => dispatch(openBankAccountDialog())}
              className="flex items-center gap-2"
              disabled={isFetching}
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
                    onClick={() => dispatch(openBankAccountDialog())}
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
                          {maskAccountNumber(account.accountNumber)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!account.isDefault && account.status === 'VERIFIED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(account.id)}
                          disabled={defaultingAccountId === account.id}
                        >
                          {defaultingAccountId === account.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Set as Default'
                          )}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveAccount(account.id)}
                        className="text-red-600 hover:text-red-700"
                        disabled={removingAccountId === account.id}
                      >
                        {removingAccountId === account.id ? (
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

        {/* ข้อมูลความปลอดภัย */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              {/* <div className="flex items-start gap-2">
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
              </div> */}
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                <span>Support for all major Thai banks</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Dialog เพิ่มบัญชี */}
      <BankAccountDialog
        open={showBankDialog}
        onOpenChange={(open) =>
          dispatch(open ? openBankAccountDialog() : closeBankAccountDialog())
        }
        onSave={handleSaveBankAccount}
        saving={createBankAccountMutation.isPending}
      />
    </div>
  )
}
