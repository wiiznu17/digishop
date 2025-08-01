export enum ProductStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  OUT_OF_STOCK = "OUT_OF_STOCK"
}

// product is array
export interface Product {
  id?: string
  name: string
  description: string
  price: string
  cost?: number
  categoryId: number
  // sku: string
  stockQuantity: number
  // images: string[]
  status: ProductStatus
  createdAt?: Date
  updatedAt?: Date
}

export const defaultProduct: Product = {
  id: "",
  name: "",
  description: "",
  price: "",
  cost: 0,
  categoryId: 0,
  stockQuantity: 0,
  status: ProductStatus.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date()
}
