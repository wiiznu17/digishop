export interface UserAuth {
  id: number
  email: string
  role: string
}
export interface User {
  id: string
  email: string
  businessName: string
  firstName: string
  lastName: string
  phone?: string
  businessAddress?: string
  businessLogo?: string
  businessType?: string
  createdAt: Date
}

export interface AuthContextType {
  user: UserAuth | null
  login: (email: string, password: string) => Promise<boolean>
  register: (userData: RegisterData) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

export interface RegisterData {
  businessName: string
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
  password: string
  confirmPassword: string
}
