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
import { MerchantHeader } from '@/components/dashboard-header'
import { User, Building, Save, Edit, CheckCircle } from 'lucide-react'
import {
  fetchMerchantProfileRequester,
  updateMerchantAddressRequester,
  updateMerchantProfileRequester
} from '@/utils/requestUtils/requestProfileUtils'
import {
  defaultMerchant,
  MerchantProfileFormValues,
  MerchantProfileProps,
  ProfileMerchantImage,
  MerchantAddressForm,
  AddressType
} from '@/types/props/userProp'
import { ProfileLogoUpload } from '@/components/profile/profileUpload'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/utils/tailwindUtils'

function normalizeImages(
  imgs: MerchantProfileFormValues['store']['profileImages']
): ProfileMerchantImage[] {
  if (!imgs) return []
  return Array.isArray(imgs) ? imgs : [imgs]
}

export default function ProfilePage() {
  const [profileData, setProfileData] =
    useState<MerchantProfileFormValues>(defaultMerchant)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // dialog state
  const [editOpen, setEditOpen] = useState(false)
  const [editingAddress, setEditingAddress] =
    useState<MerchantAddressForm | null>(null)

  // states สำหรับ Add Address
  const [addOpen, setAddOpen] = useState(false)
  const [draftNewAddress, setDraftNewAddress] =
    useState<MerchantAddressForm | null>(null)

  // useEffect for fetch merchant detail
  useEffect(() => {
    void handleFetchMerchantProfile()
  }, [])
  const emptyAddress = (): MerchantAddressForm => ({
    // id: undefined, // ใหม่ยังไม่มี id
    ownerName: '',
    phone: '',
    address_number: '',
    subStreet: '',
    street: '',
    building: '',
    subdistrict: '',
    district: '',
    province: '',
    postalCode: '',
    addressType: AddressType.HOME,
    country: 'Thailand',
    isDefault: profileData.store.addresses.length === 0 // อันแรกให้ default
  })
  const openAddDialog = () => {
    // อันแรกให้ default = true ตามเดิม
    const base = emptyAddress()
    setDraftNewAddress(base)
    setAddOpen(true)
  }

  // เมื่อกด Save ใน Add Dialog
  const submitAddAddress = () => {
    if (!draftNewAddress) return
    setProfileData((prev) => {
      const list = [...prev.store.addresses]

      // ถ้าติ๊กเป็น default ให้เคลียร์ default อื่นก่อน
      const nextList = draftNewAddress.isDefault
        ? list.map((a) => ({ ...a, isDefault: false }))
        : list

      // ถ้าเป็นแอดเดรสแรกและยังไม่มี default -> บังคับ true
      const isFirst = nextList.length === 0
      const newAddr: MerchantAddressForm = {
        ...draftNewAddress,
        id: undefined,
        isDefault: draftNewAddress.isDefault || isFirst
      }

      nextList.push(newAddr)
      return {
        ...prev,
        store: { ...prev.store, addresses: nextList }
      }
    })
    setAddOpen(false)
    setDraftNewAddress(null)
  }

  const addAddress = () => {
    setProfileData((prev) => ({
      ...prev,
      store: {
        ...prev.store,
        addresses: [...prev.store.addresses, emptyAddress()]
      }
    }))
  }

  const removeAddressByIndex = (index: number) => {
    setProfileData((prev) => {
      const list = [...prev.store.addresses]
      const removed = list.splice(index, 1)

      // ถ้าลบอันที่เป็น default ออกไป ให้ตั้ง default ใหม่เป็น index 0 ถ้ามีเหลือ
      if (removed[0]?.isDefault && list.length > 0) {
        list[0] = { ...list[0], isDefault: true }
        for (let i = 1; i < list.length; i++)
          list[i] = { ...list[i], isDefault: false }
      }
      return { ...prev, store: { ...prev.store, addresses: list } }
    })
  }

  const handleFetchMerchantProfile = async () => {
    try {
      setIsLoading(true)
      const currentProfile = await fetchMerchantProfileRequester()
      if (!currentProfile?.store || !currentProfile?.store.addresses) {
        setProfileData(defaultMerchant)
      } else {
        setProfileData(currentProfile)
      }
    } catch (error) {
      console.error('Error fetching merchant profile:', error)
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

  const handleAddressChange = (
    index: number,
    field: keyof MerchantAddressForm,
    value: string | boolean
  ) => {
    const updated = [...profileData.store.addresses]
    updated[index] = { ...updated[index], [field]: value as never }
    setProfileData((prev) => ({
      ...prev,
      store: { ...prev.store, addresses: updated }
    }))
  }

  const setDefaultAddressByIndex = (index: number) => {
    const updated = profileData.store.addresses.map((a, i) => ({
      ...a,
      isDefault: i === index
    }))
    setProfileData((prev) => ({
      ...prev,
      store: { ...prev.store, addresses: updated }
    }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      const imgList = normalizeImages(profileData.store.profileImages)

      const imageFiles: File[] = []
      if (imgList.length > 0 && imgList[0].url?.startsWith?.('blob:')) {
        try {
          const response = await fetch(imgList[0].url)
          const blob = await response.blob()
          const file = new File([blob], imgList[0].fileName, {
            type: blob.type
          })
          imageFiles.push(file)
        } catch (error) {
          console.error('Error converting blob to file:', error)
        }
      }

      const result = await updateMerchantProfileRequester(
        profileData,
        imageFiles
      )
      if (result) {
        if (imgList.length > 0 && imgList[0].url?.startsWith?.('blob:')) {
          URL.revokeObjectURL(imgList[0].url)
        }
        await handleFetchMerchantProfile()
        alert('Profile updated successfully!')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Error saving profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const openEditDialog = (addr: MerchantAddressForm) => {
    setEditingAddress(addr)
    setEditOpen(true)
  }
  const submitEditAddress = async () => {
    if (!editingAddress) return

    // Guard: ensure we have an id to update
    if (editingAddress.id == null) {
      // handle this case: either create new address or show an error
      alert('Cannot update address: missing id.')
      return
    }

    try {
      await updateMerchantAddressRequester(editingAddress.id, editingAddress)
      setEditOpen(false)
      await handleFetchMerchantProfile()
    } catch (e) {
      console.error(e)
      alert('Update address failed')
    }
  }

  const metrics = profileData.store.metrics

  return (
    <div>
      <MerchantHeader
        title="Profile"
        description="Manage your merchant account and business settings"
      >
        <Button onClick={handleSave} disabled={isSaving || isLoading}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
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
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Business Name</Label>
                  <Input
                    id="storeName"
                    value={profileData.store.storeName}
                    onChange={(e) =>
                      handleStoreChange('storeName', e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerName">Owner Name</Label>
                  <Input
                    id="ownerName"
                    value={profileData.store.addresses[0]?.ownerName || ''}
                    onChange={(e) =>
                      handleAddressChange(0, 'ownerName', e.target.value)
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
                    onChange={(e) => handleStoreChange('email', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profileData.store.phone}
                    onChange={(e) => handleStoreChange('phone', e.target.value)}
                  />
                </div>
              </div>

              {/* Address list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-4">
                  <Label>Merchant Addresses</Label>
                  <Button variant="outline" onClick={openAddDialog}>
                    + Add Address
                  </Button>
                </div>

                <RadioGroup
                  value={String(
                    profileData.store.addresses.findIndex((a) => a.isDefault) ??
                      0
                  )}
                  onValueChange={(val) => setDefaultAddressByIndex(Number(val))}
                >
                  <div className="space-y-3">
                    {profileData.store.addresses.map((addr, idx) => (
                      <div
                        key={addr.id ?? idx}
                        className={cn(
                          'border rounded-lg p-3 flex items-start gap-3',
                          addr.isDefault && 'border-primary'
                        )}
                      >
                        <RadioGroupItem value={String(idx)} className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {addr.addressType} {addr.isDefault && '(Default)'}
                            </span>
                            {addr.isDefault && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {addr.address_number}{' '}
                            {addr.subStreet && `, ${addr.subStreet}`}{' '}
                            {addr.street && `, ${addr.street}`}{' '}
                            {addr.building && `, ${addr.building}`} ,{' '}
                            {addr.subdistrict}, {addr.district}, {addr.province}{' '}
                            {addr.postalCode}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(addr)}
                        >
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeAddressByIndex(idx)}
                          disabled={profileData.store.addresses.length <= 1}
                          title={
                            profileData.store.addresses.length <= 1
                              ? 'Must keep at least one address'
                              : 'Delete'
                          }
                        >
                          Delete
                        </Button>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  Choose default and click &quot;Save Changes&quot; merchant
                  data
                </p>
              </div>

              {/* Quick edit first address */}
              <Card>
                <CardContent className="space-y-4">
                  <div className="space-y-4 py-4">
                    <Label htmlFor="address">Quick Edit First Address</Label>
                    <div className="grid grid-cols-4 md:grid-cols-4 grid-rows-2 gap-4">
                      <div className="space-y-2">
                        <Label className="!text-xs" htmlFor="addressNumber">
                          Address Number
                        </Label>
                        <Input
                          id="addressNumber"
                          value={
                            profileData.store.addresses[0]?.address_number || ''
                          }
                          onChange={(e) =>
                            handleAddressChange(
                              0,
                              'address_number',
                              e.target.value
                            )
                          }
                          placeholder="Address number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="!text-xs" htmlFor="addressSubStreet">
                          Address SubStreet
                        </Label>
                        <Input
                          id="addressSubStreet"
                          value={
                            profileData.store.addresses[0]?.subStreet || ''
                          }
                          onChange={(e) =>
                            handleAddressChange(0, 'subStreet', e.target.value)
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
                          value={profileData.store.addresses[0]?.street || ''}
                          onChange={(e) =>
                            handleAddressChange(0, 'street', e.target.value)
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
                          value={profileData.store.addresses[0]?.building || ''}
                          onChange={(e) =>
                            handleAddressChange(0, 'building', e.target.value)
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
                          value={
                            profileData.store.addresses[0]?.subdistrict || ''
                          }
                          onChange={(e) =>
                            handleAddressChange(
                              0,
                              'subdistrict',
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
                          value={profileData.store.addresses[0]?.district || ''}
                          onChange={(e) =>
                            handleAddressChange(0, 'district', e.target.value)
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
                          value={profileData.store.addresses[0]?.province || ''}
                          onChange={(e) =>
                            handleAddressChange(0, 'province', e.target.value)
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
                          value={
                            profileData.store.addresses[0]?.postalCode || ''
                          }
                          onChange={(e) =>
                            handleAddressChange(0, 'postalCode', e.target.value)
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
                  <Label htmlFor="businessType">Merchant Type</Label>
                  <Select
                    value={profileData.store.businessType}
                    onValueChange={(value) =>
                      handleStoreChange('businessType', value)
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
                      handleStoreChange('website', e.target.value)
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
                    handleStoreChange('description', e.target.value)
                  }
                  rows={3}
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
                  images={profileData.store.profileImages}
                  onImagesChange={handleImagesChange}
                  maxImages={1}
                />
              )}

              <div className="space-y-2 pt-4">
                <div className="flex justify-between">
                  <span className="text-sm">Member Since</span>
                  <span className="text-sm font-medium">
                    {metrics?.memberSince
                      ? new Date(metrics.memberSince).toLocaleDateString()
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Products</span>
                  <span className="text-sm font-medium">
                    {metrics?.totalProducts ?? 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Orders</span>
                  <span className="text-sm font-medium">
                    {metrics?.totalOrders ?? 0}
                  </span>
                </div>
                {/* <div className="flex justify-between">
                  <span className="text-sm">Rating</span>
                  <span className="text-sm font-medium">
                    {metrics?.rating ? `${metrics.rating.toFixed(1)}/5` : "-"}
                  </span>
                </div> */}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Address Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Address</DialogTitle>
          </DialogHeader>
          {editingAddress && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Owner Name</Label>
                  <Input
                    value={editingAddress.ownerName}
                    onChange={(e) =>
                      setEditingAddress({
                        ...editingAddress,
                        ownerName: e.target.value
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={editingAddress.phone}
                    onChange={(e) =>
                      setEditingAddress({
                        ...editingAddress,
                        phone: e.target.value
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Address Number</Label>
                  <Input
                    value={editingAddress.address_number}
                    onChange={(e) =>
                      setEditingAddress({
                        ...editingAddress,
                        address_number: e.target.value
                      })
                    }
                  />
                </div>
                <div>
                  <Label>SubStreet</Label>
                  <Input
                    value={editingAddress.subStreet}
                    onChange={(e) =>
                      setEditingAddress({
                        ...editingAddress,
                        subStreet: e.target.value
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Street</Label>
                  <Input
                    value={editingAddress.street}
                    onChange={(e) =>
                      setEditingAddress({
                        ...editingAddress,
                        street: e.target.value
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Building</Label>
                  <Input
                    value={editingAddress.building}
                    onChange={(e) =>
                      setEditingAddress({
                        ...editingAddress,
                        building: e.target.value
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Subdistrict</Label>
                  <Input
                    value={editingAddress.subdistrict}
                    onChange={(e) =>
                      setEditingAddress({
                        ...editingAddress,
                        subdistrict: e.target.value
                      })
                    }
                  />
                </div>
                <div>
                  <Label>District</Label>
                  <Input
                    value={editingAddress.district}
                    onChange={(e) =>
                      setEditingAddress({
                        ...editingAddress,
                        district: e.target.value
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Province</Label>
                  <Input
                    value={editingAddress.province}
                    onChange={(e) =>
                      setEditingAddress({
                        ...editingAddress,
                        province: e.target.value
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Postal Code</Label>
                  <Input
                    value={editingAddress.postalCode}
                    onChange={(e) =>
                      setEditingAddress({
                        ...editingAddress,
                        postalCode: e.target.value
                      })
                    }
                  />
                </div>
                <div className="flex items-end">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingAddress.isDefault}
                      onChange={(e) =>
                        setEditingAddress({
                          ...editingAddress,
                          isDefault: e.target.checked
                        })
                      }
                    />
                    <Label>Set as default</Label>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitEditAddress}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Add Address Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Address</DialogTitle>
          </DialogHeader>

          {draftNewAddress && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Owner Name</Label>
                  <Input
                    value={draftNewAddress.ownerName}
                    onChange={(e) =>
                      setDraftNewAddress({
                        ...draftNewAddress,
                        ownerName: e.target.value
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={draftNewAddress.phone}
                    onChange={(e) =>
                      setDraftNewAddress({
                        ...draftNewAddress,
                        phone: e.target.value
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Address Number</Label>
                  <Input
                    value={draftNewAddress.address_number}
                    onChange={(e) =>
                      setDraftNewAddress({
                        ...draftNewAddress,
                        address_number: e.target.value
                      })
                    }
                  />
                </div>
                <div>
                  <Label>SubStreet</Label>
                  <Input
                    value={draftNewAddress.subStreet}
                    onChange={(e) =>
                      setDraftNewAddress({
                        ...draftNewAddress,
                        subStreet: e.target.value
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Street</Label>
                  <Input
                    value={draftNewAddress.street}
                    onChange={(e) =>
                      setDraftNewAddress({
                        ...draftNewAddress,
                        street: e.target.value
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Building</Label>
                  <Input
                    value={draftNewAddress.building}
                    onChange={(e) =>
                      setDraftNewAddress({
                        ...draftNewAddress,
                        building: e.target.value
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Subdistrict</Label>
                  <Input
                    value={draftNewAddress.subdistrict}
                    onChange={(e) =>
                      setDraftNewAddress({
                        ...draftNewAddress,
                        subdistrict: e.target.value
                      })
                    }
                  />
                </div>
                <div>
                  <Label>District</Label>
                  <Input
                    value={draftNewAddress.district}
                    onChange={(e) =>
                      setDraftNewAddress({
                        ...draftNewAddress,
                        district: e.target.value
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Province</Label>
                  <Input
                    value={draftNewAddress.province}
                    onChange={(e) =>
                      setDraftNewAddress({
                        ...draftNewAddress,
                        province: e.target.value
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Postal Code</Label>
                  <Input
                    value={draftNewAddress.postalCode}
                    onChange={(e) =>
                      setDraftNewAddress({
                        ...draftNewAddress,
                        postalCode: e.target.value
                      })
                    }
                  />
                </div>

                <div className="flex items-end">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={draftNewAddress.isDefault}
                      onChange={(e) =>
                        setDraftNewAddress({
                          ...draftNewAddress,
                          isDefault: e.target.checked
                        })
                      }
                    />
                    <Label>Set as default</Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitAddAddress}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
