import axios from "@/lib/axios"
import type { Product, ProductListItem } from "@/types/props/productProp"

// ====== Types (บางตัวทำเป็น light-weight เพื่อลด coupling) ======
export type SortBy = "createdAt" | "updatedAt" | "name" | "price"
export type SortDir = "asc" | "desc"

export type FetchProductsParams = {
  q?: string
  categoryUuid?: string
  status?: string
  inStock?: boolean
  sortBy?: SortBy
  sortDir?: SortDir
  page?: number
  pageSize?: number
}

export type ProductListResponse = {
  data: ProductListItem[]
  meta: { page: number; pageSize: number; total: number; totalPages: number }
}

// เพิ่มช่องให้ backend อ่าน categoryUuid ได้โดยตรง
export type CreateProductRequest = {
  name: string
  description?: string | null
  status?: string
  // อนุญาตทั้ง id และ uuid (uuid จะให้ BE map -> categoryId)
  categoryId?: number | null
  categoryUuid?: string
  price?: number | null
  stockQuantity?: number | null
}

export type UpdateProductRequest = Partial<CreateProductRequest>

export type UpdateImagePayload = { isMain?: boolean; sortOrder?: number }
export type ReorderImagePayload = {
  orders: Array<{ imageUuid: string; sortOrder: number }>
}

export type CreateVariationPayload = { name: string }
export type UpdateVariationPayload = { name: string }

export type CreateOptionPayload = { value: string; sortOrder?: number }
export type UpdateOptionPayload = { value?: string; sortOrder?: number }
export type ReorderOptionsPayload = {
  orders: Array<{ optionUuid: string; sortOrder: number }>
}

export type CreateItemPayload = {
  sku?: string
  stockQuantity?: number
  priceMinor: number
  imageUrl?: string | null
}
export type UpdateItemPayload = Partial<CreateItemPayload>
export type SetItemConfigurationsPayload = { optionUuids: string[] }

// apps/merchant/src/utils/requestUtils/requestProductUtils.ts
export type SuggestResponse = {
  products: Array<{
    uuid: string
    name: string
    imageUrl?: string | null
    categoryName?: string | null
  }>
  skus: Array<{
    sku: string
    productUuid: string
    productName: string
    imageUrl?: string | null
  }>
}
// Type สำหรับ category
export type CategoryDto = {
  uuid: string
  name: string
  parentUuid?: string | null
}

// ดึงหมวดหมู่แบบ flat
export async function fetchCategoriesRequester(): Promise<CategoryDto[]> {
  try {
    const res = await axios.get("/api/merchant/products/categories/list", {
      withCredentials: true,
      params: { flat: "true" }
    })
    console.log("categories: ", res.data)
    return (res.data ?? []) as CategoryDto[]
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
}

export async function fetchProductSuggestionsRequester(
  q: string
): Promise<SuggestResponse | null> {
  try {
    if (!q.trim()) return { products: [], skus: [] }
    const res = await axios.get("/api/merchant/products/suggest", {
      withCredentials: true,
      params: { q }
    })
    return res.data as SuggestResponse
  } catch (error) {
    console.error("Error fetching product suggestions:", error)
    return null
  }
}

// ============== List / Detail =================
export async function fetchProductsRequester(
  params: FetchProductsParams = {}
): Promise<ProductListResponse | null> {
  console.log("params: ", params)
  try {
    const res = await axios.get("/api/merchant/products/list", {
      withCredentials: true,
      params: {
        ...params,
        inStock:
          params.inStock === undefined ? undefined : String(params.inStock)
      }
    })
    console.log("product data: ", res.data as ProductListResponse)
    return res.data as ProductListResponse
  } catch (error) {
    console.error("Error fetching product list:", error)
    return null
  }
}

export async function fetchProductDetailRequester(
  productUuid: string
): Promise<Product | null> {
  try {
    const res = await axios.get(`/api/merchant/products/${productUuid}`, {
      withCredentials: true
    })
    return res.data as Product
  } catch (error) {
    console.error("Error fetching product detail:", error)
    return null
  }
}

// ============== Create / Update / Delete / Duplicate =================
export async function createProductRequester(
  productData: CreateProductRequest,
  images: File[] = []
): Promise<Product | null> {
  try {
    const formData = new FormData()
    formData.append("productData", JSON.stringify(productData))
    images.forEach((f) => formData.append("images", f))

    const res = await axios.post("/api/merchant/products", formData, {
      withCredentials: true,
      headers: { "Content-Type": "multipart/form-data" }
    })
    return res.data as Product
  } catch (error) {
    console.error("Error creating product:", error)
    return null
  }
}

export async function updateProductRequester(
  productUuid: string,
  productData: UpdateProductRequest,
  images: File[] = []
): Promise<Product | null> {
  try {
    const formData = new FormData()
    formData.append("productData", JSON.stringify(productData))
    images.forEach((f) => formData.append("images", f))

    const res = await axios.put(
      `/api/merchant/products/${productUuid}`,
      formData,
      {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" }
      }
    )
    return res.data as Product
  } catch (error) {
    console.error("Error updating product:", error)
    return null
  }
}

export async function deleteProductRequester(
  productUuid: string
): Promise<boolean> {
  try {
    await axios.delete(`/api/merchant/products/${productUuid}`, {
      withCredentials: true
    })
    return true
  } catch (error) {
    console.error("Error deleting product:", error)
    return false
  }
}

export async function duplicateProductRequester(
  productUuid: string
): Promise<{ uuid: string; name: string } | null> {
  try {
    const res = await axios.post(
      `/api/merchant/products/${productUuid}/duplicate`,
      null,
      { withCredentials: true }
    )
    return res.data as { uuid: string; name: string }
  } catch (error) {
    console.error("Error duplicating product:", error)
    return null
  }
}

// ============== Images =================
export async function addProductImagesRequester(
  productUuid: string,
  images: File[]
): Promise<unknown[] | null> {
  try {
    const formData = new FormData()
    images.forEach((f) => formData.append("images", f))

    const res = await axios.post(
      `/api/merchant/products/${productUuid}/images`,
      formData,
      {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" }
      }
    )
    return res.data as unknown[]
  } catch (error) {
    console.error("Error adding product images:", error)
    return null
  }
}

export async function deleteProductImageRequester(
  productUuid: string,
  imageUuid: string
): Promise<boolean> {
  try {
    await axios.delete(
      `/api/merchant/products/${productUuid}/images/${imageUuid}`,
      { withCredentials: true }
    )
    return true
  } catch (error) {
    console.error("Error deleting product image:", error)
    return false
  }
}

export async function updateProductImageRequester(
  productUuid: string,
  imageUuid: string,
  payload: UpdateImagePayload
): Promise<boolean> {
  try {
    await axios.patch(
      `/api/merchant/products/${productUuid}/images/${imageUuid}`,
      payload,
      { withCredentials: true }
    )
    return true
  } catch (error) {
    console.error("Error updating product image:", error)
    return false
  }
}

export async function reorderProductImagesRequester(
  productUuid: string,
  orders: ReorderImagePayload["orders"]
): Promise<boolean> {
  try {
    await axios.patch(
      `/api/merchant/products/${productUuid}/images/reorder`,
      { orders },
      { withCredentials: true }
    )
    return true
  } catch (error) {
    console.error("Error reordering product images:", error)
    return false
  }
}

// ============== Bulk =================
export async function bulkUpdateProductStatusRequester(
  productUuids: string[],
  status: string
): Promise<number | null> {
  try {
    const res = await axios.patch(
      "/api/merchant/products/bulk/status",
      { productUuids, status },
      { withCredentials: true }
    )
    return (res.data?.updated ?? 0) as number
  } catch (error) {
    console.error("Error bulk updating status:", error)
    return null
  }
}

export async function bulkDeleteProductsRequester(
  productUuids: string[]
): Promise<boolean> {
  try {
    await axios.delete("/api/merchant/products/bulk", {
      withCredentials: true,
      data: { productUuids }
    })
    return true
  } catch (error) {
    console.error("Error bulk deleting products:", error)
    return false
  }
}

// ============== Variations =================
export async function createVariationRequester(
  productUuid: string,
  payload: CreateVariationPayload
): Promise<{ uuid: string; name: string } | null> {
  try {
    const res = await axios.post(
      `/api/merchant/products/${productUuid}/variations`,
      payload,
      { withCredentials: true }
    )
    return res.data
  } catch (error) {
    console.error("Error creating variation:", error)
    return null
  }
}

export async function updateVariationRequester(
  productUuid: string,
  variationUuid: string,
  payload: UpdateVariationPayload
): Promise<{ uuid: string; name: string } | null> {
  try {
    const res = await axios.put(
      `/api/merchant/products/${productUuid}/variations/${variationUuid}`,
      payload,
      { withCredentials: true }
    )
    return res.data
  } catch (error) {
    console.error("Error updating variation:", error)
    return null
  }
}

export async function deleteVariationRequester(
  productUuid: string,
  variationUuid: string
): Promise<boolean> {
  try {
    await axios.delete(
      `/api/merchant/products/${productUuid}/variations/${variationUuid}`,
      { withCredentials: true }
    )
    return true
  } catch (error) {
    console.error("Error deleting variation:", error)
    return false
  }
}

// ============== Variation Options =================
export async function createVariationOptionRequester(
  productUuid: string,
  variationUuid: string,
  payload: CreateOptionPayload
): Promise<{ uuid: string; value: string; sortOrder: number } | null> {
  try {
    const res = await axios.post(
      `/api/merchant/products/${productUuid}/variations/${variationUuid}/options`,
      payload,
      { withCredentials: true }
    )
    return res.data
  } catch (error) {
    console.error("Error creating option:", error)
    return null
  }
}

export async function updateVariationOptionRequester(
  productUuid: string,
  variationUuid: string,
  optionUuid: string,
  payload: UpdateOptionPayload
): Promise<{ uuid: string; value: string; sortOrder: number } | null> {
  try {
    const res = await axios.put(
      `/api/merchant/products/${productUuid}/variations/${variationUuid}/options/${optionUuid}`,
      payload,
      { withCredentials: true }
    )
    return res.data
  } catch (error) {
    console.error("Error updating option:", error)
    return null
  }
}

export async function deleteVariationOptionRequester(
  productUuid: string,
  variationUuid: string,
  optionUuid: string
): Promise<boolean> {
  try {
    await axios.delete(
      `/api/merchant/products/${productUuid}/variations/${variationUuid}/options/${optionUuid}`,
      { withCredentials: true }
    )
    return true
  } catch (error) {
    console.error("Error deleting option:", error)
    return false
  }
}

export async function reorderVariationOptionsRequester(
  productUuid: string,
  variationUuid: string,
  orders: ReorderOptionsPayload["orders"]
): Promise<boolean> {
  try {
    await axios.patch(
      `/api/merchant/products/${productUuid}/variations/${variationUuid}/options/reorder`,
      { orders },
      { withCredentials: true }
    )
    return true
  } catch (error) {
    console.error("Error reordering options:", error)
    return false
  }
}

// ============== Items / Configurations =================
export async function createProductItemRequester(
  productUuid: string,
  payload: CreateItemPayload
): Promise<unknown | null> {
  try {
    const res = await axios.post(
      `/api/merchant/products/${productUuid}/items`,
      payload,
      { withCredentials: true }
    )
    return res.data
  } catch (error) {
    console.error("Error creating product item:", error)
    return null
  }
}

export async function updateProductItemRequester(
  productUuid: string,
  itemUuid: string,
  payload: UpdateItemPayload
): Promise<unknown | null> {
  try {
    const res = await axios.put(
      `/api/merchant/products/${productUuid}/items/${itemUuid}`,
      payload,
      { withCredentials: true }
    )
    return res.data
  } catch (error) {
    console.error("Error updating product item:", error)
    return null
  }
}

export async function deleteProductItemRequester(
  productUuid: string,
  itemUuid: string
): Promise<boolean> {
  try {
    await axios.delete(
      `/api/merchant/products/${productUuid}/items/${itemUuid}`,
      { withCredentials: true }
    )
    return true
  } catch (error) {
    console.error("Error deleting product item:", error)
    return false
  }
}

export async function setItemConfigurationsRequester(
  productUuid: string,
  itemUuid: string,
  optionUuids: string[]
): Promise<unknown[] | null> {
  try {
    const res = await axios.put(
      `/api/merchant/products/${productUuid}/items/${itemUuid}/configurations`,
      { optionUuids },
      { withCredentials: true }
    )
    return res.data as unknown[]
  } catch (error) {
    console.error("Error setting item configurations:", error)
    return null
  }
}
