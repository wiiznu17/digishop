export interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
}
