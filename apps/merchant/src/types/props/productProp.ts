// import { reqStatus } from "@/utils/requestUtils/requestProductUtils"

// เพิ่ม interface สำหรับหน้า List
export interface ProductListItem {
  uuid: string
  name: string
  description?: string | null
  status: ProductStatus // ใช้ enum เดิม (ไม่ใช่ string ธรรมดา)
  reqStatus: reqStatus // << NEW
  rejectReason?: string | null
  minPriceMinor?: number | null // ราคาต่ำสุดของ SKU หน่วยสตางค์
  totalStock?: number | null // stock รวมจาก SKU
  category?: { uuid: string; name: string } | null
  images?: ProductImage[]
  createdAt: string
  updatedAt: string
}

/** ================= Enums ================= */
export enum ProductStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE"
  // OUT_OF_STOCK = "OUT_OF_STOCK"
}

export enum reqStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECT = "REJECT"
}

/** =============== Lite Models (relations) =============== */
export interface CategoryLite {
  uuid: string
  name: string
}

export interface ProductImage {
  /** uuid ของรูป (ฝั่ง BE ใช้เป็น path param เวลา update/delete) */
  uuid?: string
  url: string
  fileName: string
  isMain?: boolean
  sortOrder?: number
  createdAt?: string // ISO
}

/** เพิ่ม type ของรูปที่ติดกับ Product Item */
export interface ProductItemImageLite {
  uuid: string
  url: string
  fileName: string
}

export interface VariationOptionLite {
  sortOrder: number
  createdAt: string // ← เดิมเป็น unknown
  variationId: number
  id?: number
  uuid: string
  value: string
}

export interface ProductItemLite {
  id?: number
  uuid: string
  sku: string
  stockQuantity: number
  priceMinor: number
  imageUrl?: string | null
  isEnable: boolean
  productItemImage?: ProductItemImageLite | null // ← ใส่ให้อ้างถึงแบบ type-safe
  configurations?: ProductConfigurationLite[]
}

export interface VariationLite {
  id?: number
  uuid: string
  name: string
  options?: VariationOptionLite[]
}

export interface ProductConfigurationLite {
  id?: number
  uuid: string
  variationOptionId?: number // ใช้ตอน setItemConfigurations
  variationOption?: VariationOptionLite // ใช้ตอนแสดงผล
}

/** =============== Product (ใช้ร่วมทั้ง List/Detail) =============== */
export interface Product {
  /** ใช้ uuid แทน id เพื่ออ้างอิงทุก endpoint */
  uuid: string

  name: string
  description?: string | null

  /** อิง category แบบ object (ฝั่ง Controller ใส่ {uuid,name}) */
  category?: CategoryLite | null
  /** เผื่อโค้ดเก่ายังใช้อยู่ */
  categoryId?: number

  // /** legacy รวม stock ที่ product เอง (ถ้ามี) */
  // stockQuantity?: number | null

  /** สำหรับหน้า List: stock รวมจาก PRODUCT_ITEMS */
  totalStock?: number | null

  status: ProductStatus
  reqStatus: reqStatus
  rejectReason?: string

  images?: ProductImage[]

  /** สำหรับหน้า Detail */
  variations?: VariationLite[]
  items?: ProductItemLite[]

  /** สำหรับหน้า List: ราคาต่ำสุดของ SKU (สตางค์) */
  minPriceMinor?: number | null

  createdAt?: string // ISO datetime
  updatedAt?: string // ISO datetime
}

/** ค่าเริ่มต้นเวลา init form (หน้า Add/Edit) */
export const defaultProduct: Product = {
  uuid: "",
  name: "",
  description: "",
  category: null,
  categoryId: undefined,
  totalStock: null,
  status: ProductStatus.ACTIVE,
  reqStatus: reqStatus.PENDING,
  images: [],
  minPriceMinor: null,
  createdAt: undefined,
  updatedAt: undefined
}
