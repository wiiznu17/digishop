export interface FormRegister {
  firstName: string
  middleName: string
  lastName: string
  email: string
  password: string
  recipientName: string
  phone: string
  address_number: string
  building: string
  subStreet: string
  street: string
  subdistrict: string
  district: string
  country: string
  province: string
  postalCode: string
  isDefault: boolean
  addressType: string
}
export interface Profile {
  id: number
  email: string
  password: string
  firstName: string
  middleName: string
  lastName: string
  role: 'CUSTOMER' | 'MERCHANT'
  // phone: string;
  createdAt?: string
  updatedAt?: string //
}

export interface FormLogin {
  id: number
  email: string
  role: string
}

export interface AuthContextType {
  user: FormLogin | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}
