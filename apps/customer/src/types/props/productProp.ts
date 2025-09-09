// export interface Product {
//   id: string
//   name: string
//   description: string
//   price: number
//   cost?: number
//   category: string
//   sku: string
//   stock: number
//   images: string[]
//   status: "active" | "inactive" | "out_of_stock"
//   createdAt: Date
//   updatedAt: Date
// }

export interface Product {
  id: number
  name: string
  description: string
  price: number
  stockQuantity: number
  store: {
    id: number
    storeName: string
    logoUrl: string
    description: string
  }
  category: {
    id: number
    name: string
  }
}

export interface OrderProduct {
  id: number
  name: string
  description: string
  price: number
  stockQuantity: number
  store: {
    id: number
    storeName: string
    logoUrl: string
    description: string
  }
  category: {
    id: number
    name: string
  }
  
}
