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
export interface ProductItem {
    id: number;
    productId: number
    sku: string;
    stock_quantity: number;
    price_minor: number;
    image_url?: string | undefined;
}
export interface Product {
  id: number
  uuid: string
  name: string
  description: string
  items: [
    ProductItem
  ]
  store: Store
  category: Category
}

export interface Store {
  id: number
  storeName: string
  logoUrl: string
  description: string
}
export interface Category {
  id: number
  name: string
}
export interface OrderProduct {
  id: number
  name: string
  description: string
  price: number
  stockQuantity: number
  store: Store
  category: Category
}
