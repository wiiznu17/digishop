import axios from '@/lib/axios'
import type {
  AdminCategoryDto,
  AdminProductListItem,
  AdminFetchProductsParams,
  AdminProductListResponse,
  AdminSuggestResponse,
  AdminProductDetail,
  AdminModeratePayload
} from '@/types/admin/catalog'

export async function fetchAdminCategoriesRequester(): Promise<
  AdminCategoryDto[]
> {
  try {
    console.log('hi category')
    // ใช้ endpoint ฝั่งแอดมินที่คืน flat list
    const res = await axios.get('/api/admin/categories/list', {
      params: { mode: 'flat' },
      withCredentials: true
    })
    return (res.data?.data ?? res.data ?? []) as AdminCategoryDto[]
  } catch (e) {
    console.error('fetchAdminCategoriesRequester error:', e)
    return []
  }
}

export async function fetchAdminProductsRequester(
  params: AdminFetchProductsParams
): Promise<AdminProductListResponse | null> {
  try {
    console.log('param: ', params)
    const res = await axios.get('/api/admin/products/list', {
      params,
      withCredentials: true
    })
    console.log('Product list: ', res.data.data)
    return res.data as AdminProductListResponse
  } catch (e) {
    console.error('fetchAdminProductsRequester error:', e)
    return null
  }
}

export async function fetchAdminProductSuggestionsRequester(
  q: string
): Promise<AdminSuggestResponse | null> {
  try {
    const res = await axios.get('/api/admin/products/suggest', {
      params: { q },
      withCredentials: true
    })
    return (res.data ?? { products: [] }) as AdminSuggestResponse
  } catch (e) {
    console.error('fetchAdminProductSuggestionsRequester error:', e)
    return { products: [] }
  }
}

export async function fetchAdminProductDetailRequester(
  uuid: string
): Promise<AdminProductDetail | null> {
  try {
    const res = await axios.get(`/api/admin/products/${uuid}`, {
      withCredentials: true
    })
    return res.data as AdminProductDetail
  } catch (e) {
    console.error('fetchAdminProductDetailRequester error:', e)
    return null
  }
}

export async function adminModerateProductRequester(
  uuid: string,
  payload: AdminModeratePayload
) {
  try {
    const res = await axios.patch(
      `/api/admin/products/${uuid}/moderate`,
      payload,
      { withCredentials: true }
    )
    return res.data as { ok: true }
  } catch (e) {
    console.error('adminModerateProductRequester error:', e)
    return null
  }
}
