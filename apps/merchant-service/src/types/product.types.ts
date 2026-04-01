import type {
  Category,
  Product,
  ProductConfiguration,
  ProductImage,
  ProductItem,
  ProductItemImage,
  Variation,
  VariationOption
} from '@digishop/db'

export type ReviewFootprint = {
  name: string
  description: string | null
  categoryId: number | null
  images: { uuids: string[]; mainUuid: string | null }
  variations: { name: string; options: string[] }[]
  items: { sku: string; comboKey: string }[]
}

export type DS_ImageInput = {
  uuid?: string
  uploadKey?: string
  fileName?: string
  isMain?: boolean
  sortOrder: number
}

export type DS_VariationOption = {
  uuid?: string
  clientId?: string
  value: string
  sortOrder: number
}

export type DS_Variation = {
  uuid?: string
  clientId?: string
  name: string
  options: DS_VariationOption[]
}

export type DS_ItemImage = {
  uuid?: string
  uploadKey?: string
  remove?: boolean
}

export type DS_Item = {
  uuid?: string
  clientKey?: string
  sku?: string
  priceMinor: number
  stockQuantity?: number
  stockDelta?: number
  isEnable: boolean
  optionRefs: string[]
  image?: DS_ItemImage | null
}

export type DS_Payload = {
  ifMatchUpdatedAt?: string | null
  product: {
    name: string
    description?: string | null
    status: string
    categoryUuid?: string | null
  }
  images: { product: DS_ImageInput[] }
  variations: DS_Variation[]
  items: DS_Item[]
}

export type ProductWithRelations = Product & {
  images?: ProductImage[]
  variations?: (Variation & { options?: VariationOption[] })[]
  items?: (ProductItem & {
    configurations?: ProductConfiguration[]
    productItemImage?: ProductItemImage | null
  })[]
  category?: Category
}

export type ProductListQuery = {
  q?: string
  categoryUuid?: string
  status?: string
  reqStatus?: string
  sortBy?: string
  sortDir?: string
  inStock?: string
  page: number
  pageSize: number
}

export type DesiredStateFiles = {
  productImages?: Express.Multer.File[]
  itemImages?: Express.Multer.File[]
}

export type ApplyDesiredStateInput = {
  storeId: number
  mode: 'create' | 'update'
  productUuid?: string
  desiredRaw?: string
  files: DesiredStateFiles
}
