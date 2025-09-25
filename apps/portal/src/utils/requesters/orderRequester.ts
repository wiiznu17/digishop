import axios from "@/lib/axios"
import {
  AdminFetchOrdersParams,
  AdminOrderListResponse,
  AdminOrderDetail,
  AdminOrderSuggestResponse
} from "@/types/commerce/orders"

export async function fetchAdminOrdersRequester(
  params: AdminFetchOrdersParams
): Promise<AdminOrderListResponse | null> {
  try {
    const res = await axios.get("/api/admin/orders/list", {
      params,
      withCredentials: true
    })
    return res.data as AdminOrderListResponse
  } catch (e) {
    console.error("fetchAdminOrdersRequester error:", e)
    return null
  }
}

export async function fetchAdminOrderDetailRequester(
  id: number
): Promise<AdminOrderDetail | null> {
  try {
    const res = await axios.get(`/api/admin/orders/${id}/detail`, {
      withCredentials: true
    })
    console.log("fetchAdminOrderDetailRequester res=", res.data)
    return res.data as AdminOrderDetail
  } catch (e) {
    console.error("fetchAdminOrderDetailRequester error:", e)
    return null
  }
}

// suggest
export async function fetchAdminOrderSuggestRequester(
  q: string
): Promise<AdminOrderSuggestResponse> {
  try {
    console.log("fetchAdminOrderSuggestRequester q=", q)
    const res = await axios.get("/api/admin/orders/suggest", {
      params: { q },
      withCredentials: true
    })
    console.log("fetchAdminOrderSuggestRequester res=", res.data)
    return res.data as AdminOrderSuggestResponse
  } catch (e) {
    console.error("fetchAdminOrderSuggestRequester error:", e)
    return []
  }
}
