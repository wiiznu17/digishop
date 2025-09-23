
export interface ProductItem {
    id: number;
    productId: number
    sku: string;
    stockQuantity: number;
    priceMinor: number;
    imageUrl?: string | undefined;
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
