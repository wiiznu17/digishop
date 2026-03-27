'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Building2, Lock, User, AlertCircle, Plus, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

interface BankAccountFormData {
  bankName: string
  confirmAccountNumber: string
  accountHolderName: string
  isDefault: boolean
}

interface BankAccountDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  onSave?: (data: BankAccountFormData) => void
  saving?: boolean
}

export function BankAccountDialog({
  open,
  onOpenChange,
  trigger,
  onSave,
  saving = false
}: BankAccountDialogProps) {
  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    accountHolderName: '',
    setAsDefault: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const banks = [
    'Bangkok Bank',
    'Kasikornbank',
    'SCB (Siam Commercial Bank)',
    'Krungthai Bank',
    'TMBThanachart Bank',
    'Krungsri',
    'GSB',
    'GHB',
    'UOB',
    'Citibank'
  ] as const

  // Reset form when dialog open/close
  useEffect(() => {
    setFormData({
      bankName: '',
      accountNumber: '',
      confirmAccountNumber: '',
      accountHolderName: '',
      setAsDefault: false
    })
    setErrors({})
  }, [open])

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.bankName) {
      newErrors.bankName = 'Please select a bank'
    }
    if (!formData.accountNumber) {
      newErrors.accountNumber = 'Please enter your account number'
    } else if (
      formData.accountNumber.length < 10 ||
      formData.accountNumber.length > 15
    ) {
      newErrors.accountNumber = 'Account number is invalid'
    }
    if (!formData.confirmAccountNumber) {
      newErrors.confirmAccountNumber = 'Please confirm your account number'
    } else if (formData.accountNumber !== formData.confirmAccountNumber) {
      newErrors.confirmAccountNumber = 'Account numbers do not match'
    }
    if (!formData.accountHolderName.trim()) {
      newErrors.accountHolderName = "Please enter the account holder's name"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    if (validateForm()) {
      const accountData: BankAccountFormData = {
        bankName: formData.bankName,
        confirmAccountNumber: formData.confirmAccountNumber,
        accountHolderName: formData.accountHolderName,
        isDefault: formData.setAsDefault
      }
      if (onSave) {
        onSave(accountData)
      }
      // onOpenChange?.(false)
      setFormData({
        bankName: '',
        accountNumber: '',
        confirmAccountNumber: '',
        accountHolderName: '',
        setAsDefault: false
      })
      setErrors({})
    }
  }

  const handleCancel = (): void => {
    setErrors({})
    onOpenChange?.(false)
  }

  const handleInputChange = (field: string, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleNumberInputChange = (field: string, value: string): void => {
    const numericValue = value.replace(/[^0-9]/g, '')
    handleInputChange(field, numericValue)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Link Bank Account
          </DialogTitle>
          <DialogDescription>
            Add a bank account to receive payments from sales. Your information
            is protected with bank-level security.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bank Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Building2 className="h-4 w-4" />
              Bank Information
            </div>
            {/* Bank Selection */}
            <div className="space-y-2">
              <Label htmlFor="bank-name">Bank</Label>
              <Select
                value={formData.bankName}
                onValueChange={(value) => handleInputChange('bankName', value)}
              >
                <SelectTrigger
                  className={errors.bankName ? 'border-red-500' : ''}
                >
                  <SelectValue placeholder="Select a bank" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank} value={bank}>
                      {bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.bankName && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.bankName}
                </p>
              )}
            </div>
            {/* Account Number */}
            <div className="space-y-2">
              <Label htmlFor="account-number">Account Number</Label>
              <Input
                id="account-number"
                placeholder="Enter account number (10-15 digits)"
                value={formData.accountNumber}
                onChange={(e) =>
                  handleNumberInputChange('accountNumber', e.target.value)
                }
                maxLength={15}
                className={errors.accountNumber ? 'border-red-500' : ''}
              />
              {errors.accountNumber && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.accountNumber}
                </p>
              )}
            </div>
            {/* Confirm Account Number */}
            <div className="space-y-2">
              <Label htmlFor="confirm-account-number">
                Confirm Account Number
              </Label>
              <Input
                id="confirm-account-number"
                placeholder="Enter account number again"
                value={formData.confirmAccountNumber}
                onChange={(e) =>
                  handleNumberInputChange(
                    'confirmAccountNumber',
                    e.target.value
                  )
                }
                maxLength={15}
                className={errors.confirmAccountNumber ? 'border-red-500' : ''}
              />
              {errors.confirmAccountNumber && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.confirmAccountNumber}
                </p>
              )}
            </div>
          </div>
          {/* Account Holder Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4" />
              Account Holder Information
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-holder-name">Account Holder Name</Label>
              <Input
                id="account-holder-name"
                placeholder="Enter account holder name (as in bank book)"
                value={formData.accountHolderName}
                onChange={(e) =>
                  handleInputChange('accountHolderName', e.target.value)
                }
                className={errors.accountHolderName ? 'border-red-500' : ''}
              />
              {errors.accountHolderName && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.accountHolderName}
                </p>
              )}
            </div>
          </div>
          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="set-default"
                checked={formData.setAsDefault}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    setAsDefault: checked as boolean
                  }))
                }
              />
              <Label htmlFor="set-default" className="text-sm">
                Set as default account to receive payments
              </Label>
            </div>
          </div>
          {/* Security Notice */}
          <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Lock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Data Security</p>
              <ul className="space-y-1 text-xs">
                <li>
                  • Your bank account information is encrypted with bank-level
                  security
                </li>
                <li>
                  • Full account numbers are not stored; only the last 4 digits
                  are shown
                </li>
                <li>• Account verification may take 1-2 business days</li>
              </ul>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex items-center gap-2"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {saving ? 'Linking...' : 'Link Account'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default BankAccountDialog
