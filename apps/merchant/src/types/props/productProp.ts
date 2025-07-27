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
  status: "active" | "inactive" | "out_of_stock"
  createdAt: Date
  updatedAt: Date
}
