"use client"

import { useEffect, useState } from "react"
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
import { MerchantHeader } from "@/components/dashboard-header"
import {
  User,
  Building,
  CreditCard,
  Bell,
  Shield,
  Save,
  Upload
} from "lucide-react"
import {
  fetchMerchantProfileRequester,
  updateMerchantProfileRequester
} from "@/utils/requestUtils/requestProfileUtils"
import {
  defaultMerchant,
  MerchantProfileFormValues,
  MerchantProfileProps,
  ProfileMerchantImage
} from "@/types/props/userProp"
import { ProfileLogoUpload } from "@/components/profile/profileUpload"

export default function ProfilePage({ merchant }: MerchantProfileProps) {
  const [profileData, setProfileData] = useState<MerchantProfileFormValues>(
    merchant ?? defaultMerchant
  )
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // useEffect for fetch merchant detail
  useEffect(() => {
    handleFetchMerchantProfile()
  }, [])

  const handleFetchMerchantProfile = async () => {
    try {
      setIsLoading(true)
      const currentProfile = await fetchMerchantProfileRequester()
      console.log("Fetched merchant profile:", currentProfile)

      if (!currentProfile?.store || !currentProfile?.store.addresses) {
        console.warn("Invalid merchant profile, using default")
        setProfileData(defaultMerchant)
        return
      } else {
        setProfileData(currentProfile)
      }
    } catch (error) {
      console.error("Error fetching merchant profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImagesChange = (images: ProfileMerchantImage[]) => {
    setProfileData((prev) => ({
      ...prev,
      store: {
        ...prev.store,
        profileImages: images
      }
    }))
  }

  const handleStoreChange = (field: string, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      store: {
        ...prev.store,
        [field]: value
      }
    }))
  }

  const handleAddressChange = (index: number, field: string, value: string) => {
    const updatedAddresses = [...profileData.store.addresses]
    updatedAddresses[index] = {
      ...updatedAddresses[index],
      [field]: value
    }
    setProfileData((prev) => ({
      ...prev,
      store: {
        ...prev.store,
        addresses: updatedAddresses
      }
    }))
  }

  const handleChange = (field: string, value: string | boolean) => {
    setProfileData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      // Convert blob URLs to actual files for new images (เหมือน ProductDialog)
      const imageFiles: File[] = []

      if (
        profileData.store.profileImages &&
        profileData.store.profileImages.length > 0
      ) {
        const image = profileData.store.profileImages[0] // เอารูปเดียว
        // Only process new images (blob URLs)
        if (image.url.startsWith("blob:")) {
          try {
            const response = await fetch(image.url)
            const blob = await response.blob()
            const file = new File([blob], image.fileName, { type: blob.type })
            imageFiles.push(file)
          } catch (error) {
            console.error("Error converting blob to file:", error)
          }
        }
      }

      console.log("Profile data to save:", profileData)
      console.log("Images to upload:", imageFiles.length)

      // เรียกใช้ updateMerchantProfileRequester แบบแยกกัน
      const result = await updateMerchantProfileRequester(
        profileData,
        imageFiles
      )

      if (result) {
        // Clean up blob URLs after successful save
        profileData.store.profileImages?.forEach((image) => {
          if (image.url.startsWith("blob:")) {
            URL.revokeObjectURL(image.url)
          }
        })

        // รีเฟรชข้อมูลใหม่จากเซิร์ฟเวอร์
        await handleFetchMerchantProfile()

        console.log("Profile updated successfully")
        alert("Profile updated successfully!")
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      alert("Error saving profile. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <MerchantHeader
        title="Profile"
        description="Manage your merchant account and business settings"
      >
        <Button onClick={handleSave} disabled={isSaving || isLoading}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </MerchantHeader>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="grid gap-4 md:grid-cols-3">
          {/* Business Information */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Business Information
              </CardTitle>
              <CardDescription>
                Update your business details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Business Name</Label>
                  <Input
                    id="storeName"
                    value={profileData.store.storeName}
                    onChange={(e) =>
                      handleStoreChange("storeName", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerName">Owner Name</Label>
                  <Input
                    id="ownerName"
                    value={profileData.store.addresses[0]?.ownerName}
                    onChange={(e) =>
                      handleAddressChange(0, "ownerName", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.store.email}
                    onChange={(e) => handleStoreChange("email", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profileData.store.phone}
                    onChange={(e) => handleStoreChange("phone", e.target.value)}
                  />
                </div>
              </div>
              <Card>
                <CardContent className="space-y-4">
                  <div className="space-y-4 py-4">
                    <Label htmlFor="address">Business Address</Label>
                    <div className="grid grid-cols-4 md:grid-cols-4 grid-rows-2 gap-4">
                      <div className="space-y-2">
                        <Label className="!text-xs" htmlFor="addressNumber">
                          Address Number
                        </Label>
                        <Input
                          id="addressNumber"
                          value={profileData.store.addresses[0]?.address_number}
                          onChange={(e) =>
                            handleAddressChange(
                              0,
                              "addressNumber",
                              e.target.value
                            )
                          }
                          placeholder="Address number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="!text-xs" htmlFor="addressNumber">
                          Address SubStreet
                        </Label>
                        <Input
                          id="addressSubStreet"
                          value={profileData.store.addresses[0]?.subStreet}
                          onChange={(e) =>
                            handleAddressChange(
                              0,
                              "addressSubStreet",
                              e.target.value
                            )
                          }
                          placeholder="Address SubStreet"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="!text-xs" htmlFor="addressStreet">
                          Address Street
                        </Label>
                        <Input
                          id="addressStreet"
                          value={profileData.store.addresses[0]?.street}
                          onChange={(e) =>
                            handleAddressChange(
                              0,
                              "addressStreet",
                              e.target.value
                            )
                          }
                          placeholder="Address Street"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="!text-xs" htmlFor="addressBuilding">
                          Address Building
                        </Label>
                        <Input
                          id="addressBuilding"
                          value={profileData.store.addresses[0]?.building}
                          onChange={(e) =>
                            handleAddressChange(
                              0,
                              "addressBuilding",
                              e.target.value
                            )
                          }
                          placeholder="Address Building"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          className="!text-xs"
                          htmlFor="addressSubdistrict"
                        >
                          Address Subdistrict
                        </Label>
                        <Input
                          id="addressSubdistrict"
                          value={profileData.store.addresses[0]?.subdistrict}
                          onChange={(e) =>
                            handleAddressChange(
                              0,
                              "addressSubdistrict",
                              e.target.value
                            )
                          }
                          placeholder="Address Subdistrict"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="!text-xs" htmlFor="addressDistrict">
                          Address District
                        </Label>
                        <Input
                          id="addressDistrict"
                          value={profileData.store.addresses[0]?.district}
                          onChange={(e) =>
                            handleAddressChange(
                              0,
                              "addressDistrict",
                              e.target.value
                            )
                          }
                          placeholder="Address District"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="!text-xs" htmlFor="addressProvince">
                          Address Province
                        </Label>
                        <Input
                          id="addressProvince"
                          value={profileData.store.addresses[0]?.province}
                          onChange={(e) =>
                            handleAddressChange(
                              0,
                              "addressProvince",
                              e.target.value
                            )
                          }
                          placeholder="Address Province"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="!text-xs" htmlFor="addressZip">
                          Address Zip
                        </Label>
                        <Input
                          id="addressZip"
                          value={profileData.store.addresses[0]?.postalCode}
                          onChange={(e) =>
                            handleAddressChange(0, "addressZip", e.target.value)
                          }
                          placeholder="Address Zip"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type</Label>
                  <Select
                    value={profileData.store.businessType}
                    onValueChange={(value) =>
                      handleStoreChange("businessType", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Fashion">Fashion</SelectItem>
                      <SelectItem value="Retail">Retail</SelectItem>
                      <SelectItem value="Food & Beverage">
                        Food & Beverage
                      </SelectItem>
                      <SelectItem value="Home & Garden">
                        Home & Garden
                      </SelectItem>
                      <SelectItem value="Books">Books</SelectItem>
                      <SelectItem value="Sports">Sports</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={profileData.store.website}
                    onChange={(e) =>
                      handleStoreChange("website", e.target.value)
                    }
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  value={profileData.store.description}
                  onChange={(e) =>
                    handleStoreChange("description", e.target.value)
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID Number</Label>
                <Input
                  id="taxId"
                  value={"profileData.taxId"}
                  onChange={(e) => handleStoreChange("taxId", e.target.value)}
                  placeholder="xxx-xx-xxxx"
                />
              </div>
            </CardContent>
          </Card>

          {/* Profile Picture & Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Picture
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isLoading && (
                <ProfileLogoUpload
                  images={profileData.store.profileImages || []}
                  onImagesChange={handleImagesChange}
                  maxImages={1}
                />
              )}

              <div className="space-y-2 pt-4">
                <div className="flex justify-between">
                  <span className="text-sm">Member Since</span>
                  <span className="text-sm font-medium">Jan 2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Products</span>
                  <span className="text-sm font-medium">245</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Orders</span>
                  <span className="text-sm font-medium">1,234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Rating</span>
                  <span className="text-sm font-medium">4.8/5</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
