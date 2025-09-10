// เพิ่ม interface สำหรับหน้า List
export interface ProductListItem {
  uuid: string
  name: string
  description?: string | null
  status: ProductStatus // ใช้ enum เดิม (ไม่ใช่ string ธรรมดา)
  minPriceMinor?: number | null // ราคาต่ำสุดของ SKU หน่วยสตางค์
  totalStock?: number | null // stock รวมจาก SKU
  category?: { uuid: string; name: string } | null
  images?: ProductImage[] // ส่วนใหญ่จะได้รูป main 1 รูป
  createdAt: string // list รับเป็น string ชัดเจน
  updatedAt: string
}

/** ================= Enums ================= */
export enum ProductStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  OUT_OF_STOCK = "OUT_OF_STOCK"
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

export interface VariationOptionLite {
  id?: number // id ภายใน DB (ถ้า BE คืนมา)
  uuid: string
  value: string
  sortOrder?: number
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

export interface ProductItemLite {
  id?: number
  uuid: string
  sku: string
  stockQuantity: number
  priceMinor: number // หน่วยสตางค์
  imageUrl?: string | null
  configurations?: ProductConfigurationLite[]
}

/** =============== Product (ใช้ร่วมทั้ง List/Detail) =============== */
export interface Product {
  /** ใช้ uuid แทน id เพื่ออ้างอิงทุก endpoint */
  uuid: string

  name: string
  description?: string | null

  /**
   * base price ของสินค้า (ถ้าใช้ราคาจาก SKU ให้ปล่อยเป็น null/ไม่ใช้ฝั่ง FE)
   * หมายเหตุ: หน้า List เราจะได้ field คำนวณ minPriceMinor จาก PRODUCT_ITEMS มาด้วย
   */
  price?: number | null

  /** legacy จาก schema เดิมบางจุดยังอาจส่งมา */
  price_minor?: number | null

  /** อิง category แบบ object (ฝั่ง Controller ใส่ {uuid,name}) */
  category?: CategoryLite | null
  /** เผื่อโค้ดเก่ายังใช้อยู่ */
  categoryId?: number

  /** legacy รวม stock ที่ product เอง (ถ้ามี) */
  stockQuantity?: number | null

  /** สำหรับหน้า List: stock รวมจาก PRODUCT_ITEMS */
  totalStock?: number | null

  status: ProductStatus

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
  price: null,
  price_minor: null,
  category: null,
  categoryId: undefined,
  stockQuantity: null,
  totalStock: null,
  status: ProductStatus.ACTIVE,
  images: [],
  minPriceMinor: null,
  createdAt: undefined,
  updatedAt: undefined
}
