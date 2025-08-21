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
import {
  Building2,
  Lock,
  User,
  AlertCircle,
  FileText,
  Edit
} from "lucide-react"
import { useState, useEffect } from "react"

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

interface BankAccountDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  editingAccount?: BankAccount | null
  onSave?: (data: BankAccountFormData) => void
}

export function BankAccountDialog({
  open,
  onOpenChange,
  trigger,
  editingAccount,
  onSave
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
  const isEditing = !!editingAccount

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
  ] as const

  const accountTypes = [
    { value: "savings", label: "Savings Account" },
    { value: "current", label: "Current Account" },
    { value: "fixed", label: "Fixed Deposit Account" }
  ] as const

  // Reset form when dialog opens/closes or editing account changes
  useEffect(() => {
    if (editingAccount) {
      setFormData({
        bankName: editingAccount.provider || "",
        accountNumber: editingAccount.fullAccountNumber || "",
        confirmAccountNumber: editingAccount.fullAccountNumber || "",
        accountHolderName: editingAccount.accountName || "",
        accountType: editingAccount.accountType || "savings",
        branchName: editingAccount.branchName || "",
        idNumber: editingAccount.idNumber || "",
        setAsDefault: editingAccount.isDefault || false
      })
    } else {
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
    }
    setErrors({})
  }, [editingAccount, open])

  // Validate form
  const validateForm = (): boolean => {
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault()

    if (validateForm()) {
      const accountData: BankAccountFormData = {
        provider: formData.bankName,
        fullAccountNumber: formData.accountNumber,
        accountNumber: `****${formData.accountNumber.slice(-4)}`,
        accountName: formData.accountHolderName,
        accountType: formData.accountType,
        branchName: formData.branchName,
        idNumber: formData.idNumber,
        isDefault: formData.setAsDefault
      }

      if (onSave) {
        onSave(accountData)
      } else {
        console.log("Saving bank account:", accountData)
        onOpenChange?.(false)
      }

      // Reset form
      if (!isEditing) {
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
      }
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
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleNumberInputChange = (field: string, value: string): void => {
    const numericValue = value.replace(/[^0-9]/g, "")
    handleInputChange(field, numericValue)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <Edit className="h-5 w-5" />
            ) : (
              <Building2 className="h-5 w-5" />
            )}
            {isEditing ? "Edit Bank Account" : "Link Bank Account"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your bank account information. Changes will require re-verification."
              : "Add a bank account to receive payments from sales. Your information is protected with bank-level security."}
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
                onValueChange={(value) => handleInputChange("bankName", value)}
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
                onValueChange={(value) =>
                  handleInputChange("accountType", value)
                }
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
                onChange={(e) =>
                  handleNumberInputChange("accountNumber", e.target.value)
                }
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
                onChange={(e) =>
                  handleNumberInputChange(
                    "confirmAccountNumber",
                    e.target.value
                  )
                }
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
                onChange={(e) =>
                  handleInputChange("accountHolderName", e.target.value)
                }
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
                onChange={(e) =>
                  handleInputChange("branchName", e.target.value)
                }
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
                onChange={(e) =>
                  handleNumberInputChange("idNumber", e.target.value)
                }
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
                {isEditing && (
                  <li className="text-amber-700 font-medium">
                    • Changes will require re-verification of your account
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Document Requirements */}
          <div className="flex items-start gap-2 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <FileText className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">
                Documents that may be required for {isEditing ? "re-" : ""}
                verification
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
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" className="flex items-center gap-2">
              {isEditing ? (
                <Edit className="h-4 w-4" />
              ) : (
                <Building2 className="h-4 w-4" />
              )}
              {isEditing ? "Update Account" : "Link Account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default BankAccountDialog
