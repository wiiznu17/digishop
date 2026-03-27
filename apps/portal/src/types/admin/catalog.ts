export type Uuid = string
export type MinorBaht = number // integer (สตางค์)

export type ReqStatus = 'PENDING' | 'APPROVED' | 'REJECT'
export type ProductStatus = 'ACTIVE' | 'INACTIVE'
export type SortDir = 'asc' | 'desc'
export type SortBy = 'createdAt' | 'updatedAt' | 'name' | 'price'

export type AdminCategoryDto = {
  uuid: Uuid
  name: string
  parentUuid?: Uuid | null
}

export type AdminImageThumb = {
  url: string
  isMain?: boolean
  fileName?: string
}

export type AdminStoreLite = {
  uuid: Uuid
  storeName: string
  email?: string
  status?: string
}

export type AdminCategoryLite = {
  uuid: Uuid
  name: string
}

export type AdminProductListItem = {
  uuid: Uuid
  name: string
  description?: string | null
  category?: AdminCategoryLite | null
  store?: AdminStoreLite | null
  status: ProductStatus
  reqStatus: ReqStatus
  rejectReason?: string | null
  minPriceMinor: MinorBaht | null
  totalStock: number
  totalImageCount?: number
  images?: AdminImageThumb[]
  createdAt?: string
  updatedAt?: string
}

export type AdminFetchProductsParams = {
  q?: string
  categoryUuid?: Uuid
  reqStatus?: ReqStatus
  status?: ProductStatus
  inStock?: boolean
  sortBy?: SortBy
  sortDir?: SortDir
  page?: number
  pageSize?: number
}

export type AdminProductListResponse = {
  data: AdminProductListItem[]
  meta: { page: number; pageSize: number; total: number; totalPages: number }
}

export type AdminSuggestItem = {
  uuid: Uuid
  name: string
  imageUrl?: string | null
  categoryName?: string | null
  storeName?: string | null
}
export type AdminSuggestResponse = { products: AdminSuggestItem[] }

// ===== Detail =====
export type AdminProductImage = {
  uuid: Uuid
  url: string
  fileName: string
  isMain?: boolean
  sortOrder?: number | null
  createdAt?: string
}

export type AdminVariationOption = {
  id: number
  uuid: Uuid
  value: string
  sortOrder?: number | null
  createdAt?: string
  updatedAt?: string
  variationId?: number
}

export type AdminVariation = {
  id: number
  uuid: Uuid
  name: string
  createdAt?: string
  updatedAt?: string
  options?: AdminVariationOption[]
}

export type AdminProductItemImage = {
  uuid: Uuid
  url: string
  fileName?: string
}

export type AdminProductItemConfiguration = {
  id: number
  uuid: Uuid
  variationOption?: {
    id: number
    uuid: Uuid
    value: string
    sortOrder?: number | null
    variationId?: number
    variation?: { id: number; uuid: Uuid; name: string }
  }
}

export type AdminProductItem = {
  id: number
  uuid: Uuid
  sku?: string | null
  stockQuantity?: number
  priceMinor?: MinorBaht | null
  isEnable?: boolean
  createdAt?: string
  updatedAt?: string
  productItemImage?: AdminProductItemImage | null
  imageUrl?: string | null // fallback
  configurations?: AdminProductItemConfiguration[]
}

export type AdminProductDetail = {
  uuid: Uuid
  name: string
  description?: string | null
  status: ProductStatus
  reqStatus: ReqStatus
  rejectReason?: string | null
  createdAt?: string
  updatedAt?: string
  store?: AdminStoreLite | null
  category?: AdminCategoryLite | null
  images?: AdminProductImage[]
  variations?: AdminVariation[]
  items?: AdminProductItem[]
}

// ===== Moderate Payload (discriminated union) =====
export type ModerateApprovePayload = { reqStatus: 'APPROVED' }
export type ModerateRejectPayload = {
  reqStatus: 'REJECT'
  rejectReason: string
}
export type AdminModeratePayload =
  | ModerateApprovePayload
  | ModerateRejectPayload
