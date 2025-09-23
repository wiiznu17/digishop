// apps/portal/src/utils/requestUtils/requestAdminProductUtils.ts
import axios from "@/lib/axios"

export type AdminCategoryDto = {
  uuid: string
  name: string
  parentUuid?: string | null
}

export type AdminProductListItem = {
  uuid: string
  name: string
  description?: string | null
  category?: { uuid: string; name: string } | null
  store?: {
    uuid: string
    storeName: string
  } | null
  status: "ACTIVE" | "INACTIVE"
  reqStatus: "PENDING" | "APPROVED" | "REJECT"
  rejectReason?: string | null
  minPriceMinor: number | null
  totalStock: number
  totalImageCount?: number
  images?: { url: string; isMain?: boolean }[]
  createdAt?: string
  updatedAt?: string
}

export type AdminFetchProductsParams = {
  q?: string
  categoryUuid?: string
  reqStatus?: "PENDING" | "APPROVED" | "REJECT"
  status?: "ACTIVE" | "INACTIVE"
  inStock?: boolean
  sortBy?: "createdAt" | "updatedAt" | "name" | "price"
  sortDir?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export type AdminProductListResponse = {
  data: AdminProductListItem[]
  meta: { page: number; pageSize: number; total: number; totalPages: number }
}

export type AdminSuggestResponse = {
  products: Array<{
    uuid: string
    name: string
    imageUrl?: string | null
    categoryName?: string | null
    storeName?: string | null
  }>
}

// ====== requesters ======

export async function fetchAdminCategoriesRequester(): Promise<
  AdminCategoryDto[]
> {
  try {
    console.log("hi category")
    // ใช้ endpoint ฝั่งแอดมินที่คืน flat list
    const res = await axios.get("/api/admin/categories/list", {
      params: { mode: "flat" },
      withCredentials: true
    })
    return (res.data?.data ?? res.data ?? []) as AdminCategoryDto[]
  } catch (e) {
    console.error("fetchAdminCategoriesRequester error:", e)
    return []
  }
}

export async function fetchAdminProductsRequester(
  params: AdminFetchProductsParams
): Promise<AdminProductListResponse | null> {
  try {
    console.log("param: ", params)
    const res = await axios.get("/api/admin/products/list", {
      params,
      withCredentials: true
    })
    console.log("Product list: ", res.data.data)
    return res.data as AdminProductListResponse
  } catch (e) {
    console.error("fetchAdminProductsRequester error:", e)
    return null
  }
}

export async function fetchAdminProductSuggestionsRequester(
  q: string
): Promise<AdminSuggestResponse | null> {
  try {
    const res = await axios.get("/api/admin/products/suggest", {
      params: { q },
      withCredentials: true
    })
    return (res.data ?? { products: [] }) as AdminSuggestResponse
  } catch (e) {
    console.error("fetchAdminProductSuggestionsRequester error:", e)
    return { products: [] }
  }
}

export async function fetchAdminProductDetailRequester(uuid: string) {
  try {
    const res = await axios.get(`/api/admin/products/${uuid}`, {
      withCredentials: true
    })
    return res.data
  } catch (e) {
    console.error("fetchAdminProductDetailRequester error:", e)
    return null
  }
}

export async function adminModerateProductRequester(
  uuid: string,
  payload: { reqStatus: "APPROVED" | "REJECT"; rejectReason?: string | null }
) {
  try {
    const res = await axios.patch(
      `/api/admin/products/${uuid}/moderate`,
      payload,
      { withCredentials: true }
    )
    return res.data
  } catch (e) {
    console.error("adminModerateProductRequester error:", e)
    return null
  }
}
