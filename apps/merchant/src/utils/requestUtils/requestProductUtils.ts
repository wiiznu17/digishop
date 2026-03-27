import axios from '@/lib/axios'
import type { Product, ProductListItem } from '@/types/props/productProp'

//  light-weight เพื่อลด coupling
export type SortBy = 'createdAt' | 'updatedAt' | 'name' | 'price'
export type SortDir = 'asc' | 'desc'
export type reqStatus = 'PENDING' | 'APPROVED' | 'REJECT'

export type FetchProductsParams = {
  q?: string
  categoryUuid?: string
  status?: 'ACTIVE' | 'INACTIVE'
  reqStatus?: reqStatus
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
  // price?: number | null
  // stockQuantity?: number | null
  expectedSkuCount?: number
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
  isEnable?: boolean
}
export type UpdateItemPayload = Partial<CreateItemPayload>
export type SetItemConfigurationsPayload = { optionUuids: string[] }

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
    const res = await axios.get('/api/merchant/products/categories/list', {
      withCredentials: true,
      params: { flat: 'true' }
    })
    // console.log("categories: ", res.data)
    return (res.data ?? []) as CategoryDto[]
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

export async function fetchProductSuggestionsRequester(
  q: string
): Promise<SuggestResponse | null> {
  try {
    if (!q.trim()) return { products: [], skus: [] }
    const res = await axios.get('/api/merchant/products/suggest', {
      withCredentials: true,
      params: { q }
    })
    return res.data as SuggestResponse
  } catch (error) {
    console.error('Error fetching product suggestions:', error)
    return null
  }
}

// ============== List / Detail =================
export async function fetchProductsRequester(
  params: FetchProductsParams = {}
): Promise<ProductListResponse | null> {
  console.log('params: ', params)
  try {
    const res = await axios.get('/api/merchant/products/list', {
      withCredentials: true,
      params: {
        ...params,
        inStock:
          params.inStock === undefined ? undefined : String(params.inStock)
      }
    })
    console.log('product data: ', res.data as ProductListResponse)
    return res.data as ProductListResponse
  } catch (error) {
    console.error('Error fetching product list:', error)
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
    console.log('Product detail in Req: ', res.data)
    return res.data as Product
  } catch (error) {
    console.error('Error fetching product detail:', error)
    return null
  }
}

// ============== Create / Update / Delete / Duplicate =================
export async function deleteProductRequester(
  productUuid: string
): Promise<boolean> {
  try {
    await axios.delete(`/api/merchant/products/${productUuid}`, {
      withCredentials: true
    })
    return true
  } catch (error) {
    console.error('Error deleting product:', error)
    return false
  }
}

export async function duplicateProductRequester(
  productUuid: string
): Promise<{ uuid: string; name: string } | null> {
  try {
    console.log('duplicate product: ', productUuid)
    const res = await axios.post(
      `/api/merchant/products/${productUuid}/duplicate`,
      null,
      { withCredentials: true }
    )
    return res.data as { uuid: string; name: string }
  } catch (error) {
    console.error('Error duplicating product:', error)
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
    images.forEach((f) => formData.append('images', f))

    const res = await axios.post(
      `/api/merchant/products/${productUuid}/images`,
      formData,
      {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    )
    return res.data as unknown[]
  } catch (error) {
    console.error('Error adding product images:', error)
    return null
  }
}

export async function deleteProductImageRequester(
  productUuid: string,
  imageUuid: string
): Promise<boolean> {
  try {
    await axios.delete(
      `/api/merchant/products/${productUuid}/images-delete/${imageUuid}`,
      { withCredentials: true }
    )
    return true
  } catch (error) {
    console.error('Error deleting product image:', error)
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
      `/api/merchant/products/${productUuid}/images-update/${imageUuid}`,
      payload,
      { withCredentials: true }
    )
    return true
  } catch (error) {
    console.error('Error updating product image:', error)
    return false
  }
}

export async function reorderProductImagesRequester(
  productUuid: string,
  orders: ReorderImagePayload['orders']
): Promise<boolean> {
  try {
    console.log('product uuid: ', productUuid)
    console.log('orders for reoder: ', orders)
    await axios.patch(
      `/api/merchant/products/${productUuid}/images/reorder`,
      { orders },
      { withCredentials: true }
    )
    return true
  } catch (error) {
    console.error('Error reordering product images:', error)
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
      '/api/merchant/products/bulk/status',
      { productUuids, status },
      { withCredentials: true }
    )
    return (res.data?.updated ?? 0) as number
  } catch (error) {
    console.error('Error bulk updating status:', error)
    return null
  }
}

export async function bulkDeleteProductsRequester(
  productUuids: string[]
): Promise<boolean> {
  try {
    await axios.delete('/api/merchant/products/bulk/delete', {
      withCredentials: true,
      data: { productUuids }
    })
    return true
  } catch (error) {
    console.error('Error bulk deleting products:', error)
    return false
  }
}

export async function updateProductItemRequester( // for enable/disable items
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
    console.error('Error updating product item:', error)
    return null
  }
}

// new
// ===== Desired-state Types =====
export type DesiredImageInput = {
  uuid?: string
  uploadKey?: string
  fileName?: string
  isMain?: boolean
  sortOrder: number
}

export type DesiredVariationOption = {
  uuid?: string
  clientId?: string
  value: string
  sortOrder: number
}

export type DesiredVariation = {
  uuid?: string
  clientId?: string
  name: string
  options: DesiredVariationOption[]
}

export type DesiredItemImage = {
  uuid?: string
  uploadKey?: string
  remove?: boolean
} | null

export type DesiredItem = {
  uuid?: string
  clientKey?: string
  sku?: string
  priceMinor: number
  stockQuantity: number
  isEnable: boolean
  optionRefs: string[] // uuid หรือ clientId
  image?: DesiredItemImage
}

export type DesiredPayload = {
  ifMatchUpdatedAt?: string | null
  product: {
    name: string
    description?: string | null
    status: string
    // reqStatus: string
    categoryUuid?: string | null
  }
  images: { product: DesiredImageInput[] }
  variations: DesiredVariation[]
  items: DesiredItem[]
}

export async function createProductDesiredRequester(
  payload: DesiredPayload,
  productImages: File[] = [],
  itemImages: File[] = []
): Promise<Product | null> {
  try {
    const form = new FormData()
    form.append('desired', JSON.stringify(payload))
    productImages.forEach((f) => form.append('productImages', f, f.name))
    itemImages.forEach((f) => form.append('itemImages', f, f.name))
    console.log(form.append)
    const res = await axios.post('/api/merchant/products/desired', form, {
      withCredentials: true,
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return res.data as Product
  } catch (e) {
    console.error('createProductDesiredRequester error:', e)
    return null
  }
}

export async function updateProductDesiredRequester(
  productUuid: string,
  payload: DesiredPayload,
  productImages: File[] = [],
  itemImages: File[] = []
): Promise<Product | null> {
  try {
    const form = new FormData()
    form.append('desired', JSON.stringify(payload))
    productImages.forEach((f) => form.append('productImages', f, f.name))
    itemImages.forEach((f) => form.append('itemImages', f, f.name))

    const res = await axios.put(
      `/api/merchant/products/${productUuid}/desired`,
      form,
      {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    )
    return res.data as Product
  } catch (e) {
    console.error('updateProductDesiredRequester error:', e)
    return null
  }
}
