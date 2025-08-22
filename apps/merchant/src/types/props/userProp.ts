export interface UserAuth {
  id: number
  email: string
  role: string
}
export enum AddressType {
  HOME = "HOME",
  OFFICE = "OFFICE"
}
export interface ProfileMerchantImage {
  id?: string
  url: string
  fileName: string
}
export interface AuthContextType {
  user: UserAuth | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

export interface RegisterData {
  storeName: string
  ownerName: string
  email: string
  phone: string
  businessType: string
  website: string
  description: string
  addressNumber: string
  addressStreet: string
  addressBuilding: string
  addressSubStreet: string
  addressSubdistrict: string
  addressDistrict: string
  addressProvince: string
  addressZip: string
}

export interface MerchantProfileFormValues {
  id: number
  role: string
  store: {
    id: number
    storeName: string
    email: string
    phone: string
    businessType: string
    website: string
    description: string
    profileImages: ProfileMerchantImage[]
    status: string
    addresses: {
      id: number
      ownerName: string
      address_number: string
      street: string
      building: string
      subStreet: string
      subdistrict: string
      district: string
      province: string
      addressType: AddressType
      postalCode: string
      isDefault: boolean
    }[]
    bankAccount: {
      id: string
      bankName: string
      accountNumber: string
      accountName: string
    }
  }
}
export interface MerchantProfileProps {
  merchant: MerchantProfileFormValues
}

export const defaultMerchant: MerchantProfileFormValues = {
  id: 0,
  role: "",
  store: {
    id: 0,
    storeName: "",
    email: "",
    phone: "",
    businessType: "",
    website: "",
    description: "",
    profileImages: [],
    status: "",
    addresses: [
      {
        id: 0,
        ownerName: "",
        address_number: "12",
        street: "12",
        building: "12",
        subStreet: "12",
        subdistrict: "12",
        district: "12",
        province: "12",
        postalCode: "12",
        addressType: AddressType.HOME,
        isDefault: true
      }
    ],
    bankAccount: {
      id: "",
      bankName: "",
      accountNumber: "",
      accountName: ""
    }
  }
}
