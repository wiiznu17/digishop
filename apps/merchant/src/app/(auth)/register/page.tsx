'use client'

import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { ModeToggle } from '@/components/mode-toggle'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { createMerchant } from '@/utils/requestUtils/requestAuthUtils'
import { useConfirm } from '@/providers/ConfirmProvider'

type FormData = {
  storeName: string
  ownerName: string
  email: string
  phone: string
  businessType: string
  description: string
  addressNumber: string
  addressBuilding: string
  addressSubStreet: string
  addressStreet: string
  addressSubdistrict: string
  addressDistrict: string
  addressProvince: string
  addressZip: string
}

export default function RegisterPage() {
  const DIGISHOP_URL =
    process.env.NEXT_PUBLIC_DIGISHOP_URL ?? 'http://localhost:3000'

  const [formData, setFormData] = useState<FormData>({
    storeName: '',
    ownerName: '',
    email: '',
    phone: '',
    businessType: '',
    description: '',
    addressNumber: '',
    addressBuilding: '',
    addressSubStreet: '',
    addressStreet: '',
    addressSubdistrict: '',
    addressDistrict: '',
    addressProvince: '',
    addressZip: ''
  })

  const { logout, user, isLoading } = useAuth()
  const router = useRouter()
  const { confirm } = useConfirm()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login')
      } else if (user.role === 'MERCHANT') {
        router.push('/orders')
      }
    }
  }, [user, isLoading, router])

  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // ช่องที่ต้องกรอกเฉพาะที่มี *
  const REQUIRED_BY_STEP: Record<number, (keyof FormData)[]> = {
    1: ['storeName', 'ownerName', 'email', 'phone', 'businessType'],
    2: [
      'addressNumber',
      'addressSubdistrict',
      'addressDistrict',
      'addressProvince',
      'addressZip'
    ]
  }

  const isEmpty = (v?: string) => !v || v.trim() === ''
  const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // เคลียร์ error ของช่องนั้นๆ เมื่อผู้ใช้เริ่มพิมพ์
    setErrors((prev) => {
      if (!prev[field]) return prev
      const clone = { ...prev }
      delete clone[field]
      return clone
    })
  }

  function collectErrorsForStep(stepNum: number) {
    const nextErrors: Record<string, string> = {}

    for (const key of REQUIRED_BY_STEP[stepNum] ?? []) {
      const val = formData[key]
      if (isEmpty(val)) nextErrors[key] = 'This field is required'
    }

    if (
      stepNum === 1 &&
      !nextErrors.email &&
      !isEmpty(formData.email) &&
      !isEmail(formData.email)
    ) {
      nextErrors.email = 'Invalid email format'
    }

    return nextErrors
  }

  function collectAllErrors() {
    return {
      ...collectErrorsForStep(1),
      ...collectErrorsForStep(2)
    }
  }

  function focusFirstErrorFromMap(errMap: Record<string, string>) {
    const firstKey = Object.keys(errMap)[0]
    if (firstKey) {
      const el = document.getElementById(firstKey)
      if (el) el.focus()
    }
  }

  const handleNext = () => {
    const stepErrors = collectErrorsForStep(step)
    if (Object.keys(stepErrors).length === 0) {
      setStep((s) => s + 1)
    } else {
      setErrors((prev) => ({ ...prev, ...stepErrors }))
      focusFirstErrorFromMap(stepErrors)
    }
  }

  const handleBack = () => setStep((s) => s - 1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // เช็คทุกสเต็ปก่อนยิง API
    const allErrors = collectAllErrors()
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors)
      // ถ้ามี error ใน step1 ให้เด้งกลับไป step1 ไม่งั้นไป step2
      const fieldsStep1 = new Set(REQUIRED_BY_STEP[1])
      const firstErrorKey = Object.keys(allErrors)[0]
      if (firstErrorKey && fieldsStep1.has(firstErrorKey as keyof FormData)) {
        setStep(1)
      } else {
        setStep(2)
      }
      focusFirstErrorFromMap(allErrors)
      return
    }

    const payload = { ...formData, userId: user?.id }
    try {
      await createMerchant(payload)
      router.push('/')
    } catch (error) {
      console.error('Error creating merchant:', error)
      alert('Failed to create merchant account. Please try again later.')
    }
  }

  // helper สำหรับคลาส error
  const errorClass = (key: keyof FormData) =>
    errors[key] ? 'border-red-500 focus-visible:ring-red-500' : ''

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Merchant Registration</CardTitle>
            <CardDescription>
              Create your merchant account to start selling
            </CardDescription>
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${step === 1 ? 'bg-primary' : 'bg-gray-400'}`}
              >
                1
              </div>
              <div className="h-1 w-8 bg-gray-300" />
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${step === 2 ? 'bg-primary' : 'bg-gray-400'}`}
              >
                2
              </div>
              <div className="h-1 w-8 bg-gray-300" />
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${step === 3 ? 'bg-primary' : 'bg-gray-400'}`}
              >
                3
              </div>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {step === 1 && 'Business Info'}
              {step === 2 && 'Business Address'}
              {step === 3 && 'Confirmation'}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 1 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="storeName">Merchant Name *</Label>
                      <Input
                        id="storeName"
                        value={formData.storeName}
                        onChange={(e) =>
                          handleChange('storeName', e.target.value)
                        }
                        placeholder="Your Merchant Name"
                        aria-invalid={!!errors.storeName}
                        className={errorClass('storeName')}
                      />
                      {errors.storeName && (
                        <p className="text-sm text-red-600">
                          {errors.storeName}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ownerName">Owner Name *</Label>
                      <Input
                        id="ownerName"
                        value={formData.ownerName}
                        onChange={(e) =>
                          handleChange('ownerName', e.target.value)
                        }
                        placeholder="Full Name"
                        aria-invalid={!!errors.ownerName}
                        className={errorClass('ownerName')}
                      />
                      {errors.ownerName && (
                        <p className="text-sm text-red-600">
                          {errors.ownerName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="digio@thailand.com"
                        aria-invalid={!!errors.email}
                        className={errorClass('email')}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="+66 8X-XXX-XXXX"
                        aria-invalid={!!errors.phone}
                        className={errorClass('phone')}
                      />
                      {errors.phone && (
                        <p className="text-sm text-red-600">{errors.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessType">Merchant Type *</Label>
                    <div
                      className={
                        errors.businessType
                          ? 'rounded-md border border-red-500 p-0.5'
                          : ''
                      }
                    >
                      <Select
                        onValueChange={(value) =>
                          handleChange('businessType', value)
                        }
                        value={formData.businessType}
                      >
                        <SelectTrigger
                          id="businessType"
                          aria-invalid={!!errors.businessType}
                        >
                          <SelectValue placeholder="Select merchant type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="food">Food & Beverage</SelectItem>
                          <SelectItem value="fashion">
                            Fashion & Apparel
                          </SelectItem>
                          <SelectItem value="electronics">
                            Electronics
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {errors.businessType && (
                      <p className="text-sm text-red-600">
                        {errors.businessType}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Business Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        handleChange('description', e.target.value)
                      }
                      placeholder="Describe your business and what you sell..."
                      rows={3}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      disabled={isLoading}
                      onClick={async () => {
                        const confirmed = await confirm({
                          title: 'Log out?',
                          description:
                            'You will leave merchant registration and be signed out.',
                          confirmText: 'Log out',
                          cancelText: 'Continue registration',
                          variant: 'destructive'
                        })
                        if (!confirmed) return

                        await logout()
                        router.push('/login')
                      }}
                    >
                      Logout
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      asChild
                    >
                      <a href={DIGISHOP_URL}>Back to Digishop</a>
                    </Button>
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={handleNext}
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="addressNumber">Address Number *</Label>
                    <Input
                      id="addressNumber"
                      value={formData.addressNumber}
                      onChange={(e) =>
                        handleChange('addressNumber', e.target.value)
                      }
                      placeholder="Address Number"
                      aria-invalid={!!errors.addressNumber}
                      className={errorClass('addressNumber')}
                    />
                    {errors.addressNumber && (
                      <p className="text-sm text-red-600">
                        {errors.addressNumber}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressBuilding">Address Building</Label>
                    <Input
                      id="addressBuilding"
                      value={formData.addressBuilding}
                      onChange={(e) =>
                        handleChange('addressBuilding', e.target.value)
                      }
                      placeholder="Address Building"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressSubStreet">Address SubStreet</Label>
                    <Input
                      id="addressSubStreet"
                      value={formData.addressSubStreet}
                      onChange={(e) =>
                        handleChange('addressSubStreet', e.target.value)
                      }
                      placeholder="Address SubStreet"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressStreet">Street</Label>
                    <Input
                      id="addressStreet"
                      value={formData.addressStreet}
                      onChange={(e) =>
                        handleChange('addressStreet', e.target.value)
                      }
                      placeholder="Street"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressSubdistrict">Subdistrict *</Label>
                    <Input
                      id="addressSubdistrict"
                      value={formData.addressSubdistrict}
                      onChange={(e) =>
                        handleChange('addressSubdistrict', e.target.value)
                      }
                      placeholder="Subdistrict"
                      aria-invalid={!!errors.addressSubdistrict}
                      className={errorClass('addressSubdistrict')}
                    />
                    {errors.addressSubdistrict && (
                      <p className="text-sm text-red-600">
                        {errors.addressSubdistrict}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressDistrict">District *</Label>
                    <Input
                      id="addressDistrict"
                      value={formData.addressDistrict}
                      onChange={(e) =>
                        handleChange('addressDistrict', e.target.value)
                      }
                      placeholder="District"
                      aria-invalid={!!errors.addressDistrict}
                      className={errorClass('addressDistrict')}
                    />
                    {errors.addressDistrict && (
                      <p className="text-sm text-red-600">
                        {errors.addressDistrict}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressProvince">Province *</Label>
                    <Input
                      id="addressProvince"
                      value={formData.addressProvince}
                      onChange={(e) =>
                        handleChange('addressProvince', e.target.value)
                      }
                      placeholder="Province"
                      aria-invalid={!!errors.addressProvince}
                      className={errorClass('addressProvince')}
                    />
                    {errors.addressProvince && (
                      <p className="text-sm text-red-600">
                        {errors.addressProvince}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressZip">Zip Code *</Label>
                    <Input
                      id="addressZip"
                      value={formData.addressZip}
                      onChange={(e) =>
                        handleChange('addressZip', e.target.value)
                      }
                      placeholder="Zip Code"
                      inputMode="numeric"
                      pattern="\d*"
                      aria-invalid={!!errors.addressZip}
                      className={errorClass('addressZip')}
                    />
                    {errors.addressZip && (
                      <p className="text-sm text-red-600">
                        {errors.addressZip}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      type="button"
                      className="flex-1"
                      variant="outline"
                      onClick={handleBack}
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      className="flex-1"
                      variant="default"
                      onClick={handleNext}
                    >
                      Next
                    </Button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="space-y-4 text-center">
                    <div className="text-lg font-semibold mb-2">
                      Confirm Submission
                    </div>
                    <div className="text-muted-foreground mb-4">
                      Please review your information before creating your
                      merchant account.
                      <br />
                      Are you sure you want to submit?
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      type="button"
                      className="flex-1"
                      variant="outline"
                      onClick={handleBack}
                    >
                      Back
                    </Button>
                    <Button type="submit" className="flex-1">
                      Create Merchant Account
                    </Button>
                  </div>
                </>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
