"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { ModeToggle } from "@/components/mode-toggle"
import Link from "next/link"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    businessType: "",
    description: "",
    addressNumber: "",
    addressBuilding: "",
    addressSubStreet: "",
    addressStreet: "",
    addressSubdistrict: "",
    addressDistrict: "",
    addressProvince: "",
    addressZip: ""
  })
  const [step, setStep] = useState(1)

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNext = () => setStep((s) => s + 1)
  const handleBack = () => setStep((s) => s - 1)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle registration logic here
    console.log("Registration data:", formData)
  }

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
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${step === 1 ? "bg-primary" : "bg-gray-400"}`}
              >
                1
              </div>
              <div className="h-1 w-8 bg-gray-300" />
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${step === 2 ? "bg-primary" : "bg-gray-400"}`}
              >
                2
              </div>
              <div className="h-1 w-8 bg-gray-300" />
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${step === 3 ? "bg-primary" : "bg-gray-400"}`}
              >
                3
              </div>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {step === 1 && "Business Info"}
              {step === 2 && "Business Address"}
              {step === 3 && "Confirmation"}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {step === 1 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name *</Label>
                      <Input
                        id="businessName"
                        value={formData.businessName}
                        onChange={(e) =>
                          handleChange("businessName", e.target.value)
                        }
                        placeholder="Your Business Name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ownerName">Owner Name *</Label>
                      <Input
                        id="ownerName"
                        value={formData.ownerName}
                        onChange={(e) =>
                          handleChange("ownerName", e.target.value)
                        }
                        placeholder="Full Name"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="business@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessType">Business Type *</Label>
                    <Select
                      onValueChange={(value) =>
                        handleChange("businessType", value)
                      }
                      value={formData.businessType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="wholesale">Wholesale</SelectItem>
                        <SelectItem value="services">Services</SelectItem>
                        <SelectItem value="manufacturing">
                          Manufacturing
                        </SelectItem>
                        <SelectItem value="food">Food & Beverage</SelectItem>
                        <SelectItem value="fashion">
                          Fashion & Apparel
                        </SelectItem>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Business Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        handleChange("description", e.target.value)
                      }
                      placeholder="Describe your business and what you sell..."
                      rows={3}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      asChild
                    >
                      <Link href="/">Back to Dashboard</Link>
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
                        handleChange("addressNumber", e.target.value)
                      }
                      placeholder="Address Number"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addressBuilding">Address Building</Label>
                    <Input
                      id="addressBuilding"
                      value={formData.addressBuilding}
                      onChange={(e) =>
                        handleChange("addressBuilding", e.target.value)
                      }
                      placeholder="Address Building"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addressSubStreet">Address SubStreet</Label>
                    <Input
                      id="addressSubStreet"
                      value={formData.addressSubStreet}
                      onChange={(e) =>
                        handleChange("addressSubStreet", e.target.value)
                      }
                      placeholder="Address SubStreet"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addressStreet">Street</Label>
                    <Input
                      id="addressStreet"
                      value={formData.addressStreet}
                      onChange={(e) =>
                        handleChange("addressStreet", e.target.value)
                      }
                      placeholder="Street"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addressSubdistrict">Subdistrict *</Label>
                    <Input
                      id="addressSubdistrict"
                      value={formData.addressSubdistrict}
                      onChange={(e) =>
                        handleChange("addressSubdistrict", e.target.value)
                      }
                      placeholder="Subdistrict"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addressDistrict">District *</Label>
                    <Input
                      id="addressDistrict"
                      value={formData.addressDistrict}
                      onChange={(e) =>
                        handleChange("addressDistrict", e.target.value)
                      }
                      placeholder="District"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addressProvince">Province *</Label>
                    <Input
                      id="addressProvince"
                      value={formData.addressProvince}
                      onChange={(e) =>
                        handleChange("addressProvince", e.target.value)
                      }
                      placeholder="Province"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addressZip">Zip Code *</Label>
                    <Input
                      id="addressZip"
                      value={formData.addressZip}
                      onChange={(e) =>
                        handleChange("addressZip", e.target.value)
                      }
                      placeholder="Zip Code"
                      required
                    />
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
