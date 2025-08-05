export interface UserAuth {
  id: number
  email: string
  role: string
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
    description: string
    logoUrl: string
    status: string
    addresses: {
      id: number
      ownerName: string
    }[]
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
    description: "",
    logoUrl: "",
    status: "",
    addresses: [
      {
        id: 0,
        ownerName: ""
      }
    ]
  }
}
