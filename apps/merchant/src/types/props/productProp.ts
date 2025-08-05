export enum ProductStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  OUT_OF_STOCK = "OUT_OF_STOCK"
}
export interface ProductImage {
  id?: string
  url: string
  fileName: string
  isMain?: boolean // ระบุว่าเป็นรูปหลักหรือไม่
}
// product is array
export interface Product {
  id?: string
  name: string
  description: string
  price: string
  cost?: number
  categoryId: string
  // sku: string
  stockQuantity: string
  // images: string[]
  status: ProductStatus
  images?: ProductImage[]
  createdAt?: Date
  updatedAt?: Date
}

export const defaultProduct: Product = {
  id: "",
  name: "",
  description: "",
  price: "",
  cost: 0,
  categoryId: "",
  stockQuantity: "",
  status: ProductStatus.ACTIVE,
  images: [],
  createdAt: new Date(),
  updatedAt: new Date()
}
