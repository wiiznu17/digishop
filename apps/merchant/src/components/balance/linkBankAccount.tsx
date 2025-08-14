"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Building2, Lock, User, AlertCircle, FileText } from "lucide-react"
import { useState } from "react"

interface BankAccountDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
}

export function BankAccountDialog({
  open,
  onOpenChange,
  trigger
}: BankAccountDialogProps) {
  const [formData, setFormData] = useState({
    bankName: "",
    accountNumber: "",
    confirmAccountNumber: "",
    accountHolderName: "",
    accountType: "",
    branchName: "",
    idNumber: "",
    setAsDefault: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const banks = [
    "Bangkok Bank",
    "Kasikornbank",
    "SCB (Siam Commercial Bank)",
    "Krungthai Bank",
    "TMBThanachart Bank",
    "Krungsri",
    "GSB",
    "GHB",
    "UOB",
    "Citibank"
  ]

  const accountTypes = [
    { value: "savings", label: "Savings Account" },
    { value: "current", label: "Current Account" },
    { value: "fixed", label: "Fixed Deposit Account" }
  ]

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.bankName) {
      newErrors.bankName = "Please select a bank"
    }

    if (!formData.accountNumber) {
      newErrors.accountNumber = "Please enter your account number"
    } else if (
      formData.accountNumber.length < 10 ||
      formData.accountNumber.length > 15
    ) {
      newErrors.accountNumber = "Account number is invalid"
    }

    if (!formData.confirmAccountNumber) {
      newErrors.confirmAccountNumber = "Please confirm your account number"
    } else if (formData.accountNumber !== formData.confirmAccountNumber) {
      newErrors.confirmAccountNumber = "Account numbers do not match"
    }

    if (!formData.accountHolderName.trim()) {
      newErrors.accountHolderName = "Please enter the account holder's name"
    }

    if (!formData.accountType) {
      newErrors.accountType = "Please select an account type"
    }

    if (!formData.branchName.trim()) {
      newErrors.branchName = "Please enter the branch name"
    }

    if (!formData.idNumber.trim()) {
      newErrors.idNumber = "Please enter your ID or company registration number"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      console.log("Linking bank account:", formData)

      // Reset form and close dialog
      setFormData({
        bankName: "",
        accountNumber: "",
        confirmAccountNumber: "",
        accountHolderName: "",
        accountType: "",
        branchName: "",
        idNumber: "",
        setAsDefault: false
      })
      setErrors({})
      onOpenChange?.(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
                onValueChange={(value) => {
                  setFormData({ ...formData, bankName: value })
                  if (errors.bankName) {
                    setErrors({ ...errors, bankName: "" })
                  }
                }}
              >
                <SelectTrigger
                  className={errors.bankName ? "border-red-500" : ""}
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

            {/* Account Type */}
            <div className="space-y-2">
              <Label htmlFor="account-type">Account Type</Label>
              <Select
                value={formData.accountType}
                onValueChange={(value) => {
                  setFormData({ ...formData, accountType: value })
                  if (errors.accountType) {
                    setErrors({ ...errors, accountType: "" })
                  }
                }}
              >
                <SelectTrigger
                  className={errors.accountType ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  {accountTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.accountType && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.accountType}
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
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "")
                  setFormData({ ...formData, accountNumber: value })
                  if (errors.accountNumber) {
                    setErrors({ ...errors, accountNumber: "" })
                  }
                }}
                maxLength={15}
                className={errors.accountNumber ? "border-red-500" : ""}
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
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "")
                  setFormData({ ...formData, confirmAccountNumber: value })
                  if (errors.confirmAccountNumber) {
                    setErrors({ ...errors, confirmAccountNumber: "" })
                  }
                }}
                maxLength={15}
                className={errors.confirmAccountNumber ? "border-red-500" : ""}
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
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    accountHolderName: e.target.value
                  })
                  if (errors.accountHolderName) {
                    setErrors({ ...errors, accountHolderName: "" })
                  }
                }}
                className={errors.accountHolderName ? "border-red-500" : ""}
              />
              {errors.accountHolderName && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.accountHolderName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch-name">Branch Name</Label>
              <Input
                id="branch-name"
                placeholder="Enter the branch where the account was opened"
                value={formData.branchName}
                onChange={(e) => {
                  setFormData({ ...formData, branchName: e.target.value })
                  if (errors.branchName) {
                    setErrors({ ...errors, branchName: "" })
                  }
                }}
                className={errors.branchName ? "border-red-500" : ""}
              />
              {errors.branchName && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.branchName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="id-number">
                ID / Company Registration Number
              </Label>
              <Input
                id="id-number"
                placeholder="Enter 13-digit ID or company registration number"
                value={formData.idNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "")
                  setFormData({ ...formData, idNumber: value })
                  if (errors.idNumber) {
                    setErrors({ ...errors, idNumber: "" })
                  }
                }}
                className={errors.idNumber ? "border-red-500" : ""}
              />
              {errors.idNumber && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.idNumber}
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
                  setFormData({ ...formData, setAsDefault: checked as boolean })
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

          {/* Document Requirements */}
          <div className="flex items-start gap-2 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <FileText className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">
                Documents that may be required for verification
              </p>
              <ul className="space-y-1 text-xs">
                <li>• Copy of bank book first page</li>
                <li>• Copy of ID card or company registration certificate</li>
                <li>• Additional documents as required by the bank</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Link Account
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default BankAccountDialog
