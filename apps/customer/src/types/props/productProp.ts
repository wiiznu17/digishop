
export interface ProductItem {
    id: number;
    productId: number
    sku: string;
    stockQuantity: number;
    priceMinor: number;
    imageUrl?: string | undefined;
    configuration: 
}
export interface Configurations {
  id: number
  uuid: string
  productItemId: number
  variationOptionId: number
  variationOption: {
    id: number
    variationId: number
    value: string
    sortOrder: number
    variation: Variations
  }
}
export interface ProductImages {
  id: number
  uuid: string
  productId: number
  url: string
  blobName: string
  fileName: string
  isMain: boolean
  sortOrder: number
}
export interface Product {
  id: number
  uuid: string
  name: string
  description: string
  images: ProductImages[]
  items: [
    ProductItem
  ]
  store: Store
  category: Category
}

export interface Choices {
  id: number
  variations: Variations[]
}

export interface Variations {
  id: number
  uuid: string
  productId: number
  name: string
  options: Options[]
}
export interface Options {
  id: number
  variationId: number
  value: string
  sortOrder: number
}

export interface StoreProduct {
  id: number
  storeName: string
  logoUrl: string
  description: string
  products: Product[]
}

export interface Store {
  id: number
  uuid: string
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
