export interface UserAuth {
  id: number
  email: string
  role: string
}

export type StoreStatus = 'PENDING' | 'BANNED' | 'APPROVED'

export enum AddressType {
  HOME = 'HOME',
  OFFICE = 'OFFICE'
}
export interface ProfileMerchantImage {
  id?: string
  url: string
  fileName: string
}

export interface AuthContextType {
  user: UserAuth | null
  login: (email: string, password: string) => Promise<boolean>
  googleLogin: (idToken: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  storeStatus: StoreStatus | null
}

export interface RegisterData {
  storeName: string
  ownerName: string
  email: string
  phone: string
  businessType: string
  website?: string
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

export interface MerchantAddressForm {
  id?: number
  ownerName: string
  phone: string
  address_number: string
  street: string
  building: string
  subStreet: string
  subdistrict: string
  district: string
  province: string
  country?: string
  addressType: AddressType
  postalCode: string
  isDefault: boolean
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
    profileImages: ProfileMerchantImage[] | ProfileMerchantImage | null
    status: string
    addresses: MerchantAddressForm[]
    bankAccount: {
      id: string
      bankName: string
      accountNumber: string
      accountName: string
    }
    metrics?: {
      memberSince: string // ISO string
      totalProducts: number
      totalOrders: number
      rating: number | null
    }
  }
}
export interface MerchantProfileProps {
  merchant: MerchantProfileFormValues
}

export const defaultMerchant: MerchantProfileFormValues = {
  id: 0,
  role: '',
  store: {
    id: 0,
    storeName: '',
    email: '',
    phone: '',
    businessType: '',
    website: '',
    description: '',
    profileImages: [],
    status: '',
    addresses: [
      {
        id: 0,
        ownerName: '',
        address_number: '',
        street: '',
        building: '',
        subStreet: '',
        subdistrict: '',
        district: '',
        province: '',
        postalCode: '',
        addressType: AddressType.HOME,
        isDefault: true,
        phone: ''
      }
    ],
    bankAccount: {
      id: '',
      bankName: '',
      accountNumber: '',
      accountName: ''
    },
    metrics: {
      memberSince: '',
      totalProducts: 0,
      totalOrders: 0,
      rating: null
    }
  }
}
