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
import {
  CreditCard,
  Lock,
  Calendar,
  User,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'

interface CardLinkingDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
}

export function CardLinkingDialog({
  open,
  onOpenChange,
  trigger
}: CardLinkingDialogProps) {
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    billingAddress: '',
    city: '',
    postalCode: '',
    country: 'TH',
    saveCard: false,
    setAsDefault: false
  })

  const [showCVV, setShowCVV] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // ตรวจสอบประเภทของบัตร
  const getCardType = (number: string) => {
    const cleaned = number.replace(/\s+/g, '')
    if (cleaned.match(/^4/)) return 'visa'
    if (cleaned.match(/^5[1-5]/)) return 'mastercard'
    if (cleaned.match(/^3[47]/)) return 'amex'
    if (cleaned.match(/^35(2[89]|[3-8][0-9])/)) return 'jcb'
    return null
  }

  // Format เลขบัตร
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = cleaned.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(' ')
    } else {
      return cleaned
    }
  }

  // ตรวจสอบความถูกต้องของฟอร์ม
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // ตรวจสอบเลขบัตร
    const cleanCardNumber = formData.cardNumber.replace(/\s+/g, '')
    if (!cleanCardNumber) {
      newErrors.cardNumber = 'Please enter card number'
    } else if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
      newErrors.cardNumber = 'Invalid card number length'
    }

    // ตรวจสอบชื่อผู้ถือบัตร
    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = 'Please enter cardholder name'
    }

    // ตรวจสอบวันหมดอายุ
    if (!formData.expiryMonth) {
      newErrors.expiryMonth = 'Please select expiry month'
    }
    if (!formData.expiryYear) {
      newErrors.expiryYear = 'Please select expiry year'
    }

    // ตรวจสอบ CVV
    if (!formData.cvv) {
      newErrors.cvv = 'Please enter CVV'
    } else if (formData.cvv.length < 3 || formData.cvv.length > 4) {
      newErrors.cvv = 'Invalid CVV'
    }

    // ตรวจสอบที่อยู่
    if (!formData.billingAddress.trim()) {
      newErrors.billingAddress = 'Please enter billing address'
    }
    if (!formData.city.trim()) {
      newErrors.city = 'Please enter city'
    }
    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'Please enter postal code'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      // ส่งข้อมูลไปยัง API
      console.log('Linking card:', formData)

      // รีเซ็ตฟอร์มและปิด Dialog
      setFormData({
        cardNumber: '',
        cardholderName: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
        billingAddress: '',
        city: '',
        postalCode: '',
        country: 'TH',
        saveCard: false,
        setAsDefault: false
      })
      setErrors({})
      onOpenChange?.(false)
    }
  }

  const cardType = getCardType(formData.cardNumber)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 20 }, (_, i) => currentYear + i)
  const months = [
    { value: '01', label: '01 - January' },
    { value: '02', label: '02 - February' },
    { value: '03', label: '03 - March' },
    { value: '04', label: '04 - April' },
    { value: '05', label: '05 - May' },
    { value: '06', label: '06 - June' },
    { value: '07', label: '07 - July' },
    { value: '08', label: '08 - August' },
    { value: '09', label: '09 - September' },
    { value: '10', label: '10 - October' },
    { value: '11', label: '11 - November' },
    { value: '12', label: '12 - December' }
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Link Credit/Debit Card
          </DialogTitle>
          <DialogDescription>
            Add a new payment card to your account. Your information is secure
            and encrypted.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CreditCard className="h-4 w-4" />
              Card Information
            </div>

            {/* Card Number */}
            <div className="space-y-2">
              <Label htmlFor="card-number">Card Number</Label>
              <div className="relative">
                <Input
                  id="card-number"
                  placeholder="1234 5678 9012 3456"
                  value={formData.cardNumber}
                  onChange={(e) => {
                    const formatted = formatCardNumber(e.target.value)
                    setFormData({ ...formData, cardNumber: formatted })
                    // Clear error when user starts typing
                    if (errors.cardNumber) {
                      setErrors({ ...errors, cardNumber: '' })
                    }
                  }}
                  maxLength={19}
                  className={errors.cardNumber ? 'border-red-500' : ''}
                />
                {cardType && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Badge variant="outline" className="text-xs">
                      {cardType.toUpperCase()}
                    </Badge>
                  </div>
                )}
              </div>
              {errors.cardNumber && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.cardNumber}
                </p>
              )}
            </div>

            {/* Cardholder Name */}
            <div className="space-y-2">
              <Label htmlFor="cardholder-name">Cardholder Name</Label>
              <Input
                id="cardholder-name"
                placeholder="John Doe"
                value={formData.cardholderName}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    cardholderName: e.target.value.toUpperCase()
                  })
                  if (errors.cardholderName) {
                    setErrors({ ...errors, cardholderName: '' })
                  }
                }}
                className={errors.cardholderName ? 'border-red-500' : ''}
              />
              {errors.cardholderName && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.cardholderName}
                </p>
              )}
            </div>

            {/* Expiry Date and CVV */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry-month">Expiry Month</Label>
                <Select
                  value={formData.expiryMonth}
                  onValueChange={(value) => {
                    setFormData({ ...formData, expiryMonth: value })
                    if (errors.expiryMonth) {
                      setErrors({ ...errors, expiryMonth: '' })
                    }
                  }}
                >
                  <SelectTrigger
                    className={errors.expiryMonth ? 'border-red-500' : ''}
                  >
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.expiryMonth && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Required
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry-year">Expiry Year</Label>
                <Select
                  value={formData.expiryYear}
                  onValueChange={(value) => {
                    setFormData({ ...formData, expiryYear: value })
                    if (errors.expiryYear) {
                      setErrors({ ...errors, expiryYear: '' })
                    }
                  }}
                >
                  <SelectTrigger
                    className={errors.expiryYear ? 'border-red-500' : ''}
                  >
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.expiryYear && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Required
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <div className="relative">
                  <Input
                    id="cvv"
                    type={showCVV ? 'text' : 'password'}
                    placeholder="123"
                    value={formData.cvv}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '')
                      setFormData({ ...formData, cvv: value })
                      if (errors.cvv) {
                        setErrors({ ...errors, cvv: '' })
                      }
                    }}
                    maxLength={4}
                    className={errors.cvv ? 'border-red-500' : ''}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCVV(!showCVV)}
                  >
                    {showCVV ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.cvv && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.cvv}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Billing Address Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4" />
              Billing Address
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing-address">Address</Label>
              <Input
                id="billing-address"
                placeholder="123/45 Main Street"
                value={formData.billingAddress}
                onChange={(e) => {
                  setFormData({ ...formData, billingAddress: e.target.value })
                  if (errors.billingAddress) {
                    setErrors({ ...errors, billingAddress: '' })
                  }
                }}
                className={errors.billingAddress ? 'border-red-500' : ''}
              />
              {errors.billingAddress && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.billingAddress}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Bangkok"
                  value={formData.city}
                  onChange={(e) => {
                    setFormData({ ...formData, city: e.target.value })
                    if (errors.city) {
                      setErrors({ ...errors, city: '' })
                    }
                  }}
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.city}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal-code">Postal Code</Label>
                <Input
                  id="postal-code"
                  placeholder="10110"
                  value={formData.postalCode}
                  onChange={(e) => {
                    setFormData({ ...formData, postalCode: e.target.value })
                    if (errors.postalCode) {
                      setErrors({ ...errors, postalCode: '' })
                    }
                  }}
                  className={errors.postalCode ? 'border-red-500' : ''}
                />
                {errors.postalCode && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.postalCode}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select
                value={formData.country}
                onValueChange={(value) =>
                  setFormData({ ...formData, country: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TH">Thailand</SelectItem>
                  <SelectItem value="SG">Singapore</SelectItem>
                  <SelectItem value="MY">Malaysia</SelectItem>
                  <SelectItem value="ID">Indonesia</SelectItem>
                  <SelectItem value="VN">Vietnam</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="save-card"
                checked={formData.saveCard}
                onCheckedChange={(checked: boolean) =>
                  setFormData({ ...formData, saveCard: checked as boolean })
                }
              />
              <Label htmlFor="save-card" className="text-sm">
                Save this card for future payments
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="set-default"
                checked={formData.setAsDefault}
                onCheckedChange={(checked: boolean) =>
                  setFormData({ ...formData, setAsDefault: checked as boolean })
                }
              />
              <Label htmlFor="set-default" className="text-sm">
                Set as default payment method
              </Label>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Lock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Your payment information is secure</p>
              <p>We use bank-level encryption to protect your card details.</p>
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
              <CreditCard className="h-4 w-4" />
              Link Card
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CardLinkingDialog
