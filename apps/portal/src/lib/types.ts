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

export interface Product {
  id: string
  name: string
  description: string
  price: number
  cost?: number
  category: string
  sku: string
  stock: number
  images: string[]
  status: 'active' | 'inactive' | 'out_of_stock'
  createdAt: Date
  updatedAt: Date
}

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

export interface OrderItem {
  id: string
  productId: string
  product: Product
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface Order {
  id: string
  orderNumber: string
  customerId: string
  customer: Customer
  items: OrderItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  status:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  shippingAddress: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  revenueGrowth: number
  ordersGrowth: number
  productsGrowth: number
  customersGrowth: number
}

export interface RevenueData {
  date: string
  revenue: number
  orders: number
}

export interface CategoryData {
  category: string
  revenue: number
  orders: number
}

export interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  register: (userData: RegisterData) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

export interface RegisterData {
  email: string
  password: string
  businessName: string
  firstName: string
  lastName: string
  phone?: string
  businessType?: string
}
