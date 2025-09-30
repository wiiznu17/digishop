import axios from "@/lib/axios"
import {
  AdminFetchOrdersParams,
  AdminOrderListResponse,
  AdminOrderDetail,
  AdminOrderSuggestResponse,
  AdminCustomerEmailSuggestItem,
  AdminStoreNameSuggestItem
} from "@/types/commerce/orders"

export async function fetchAdminOrdersRequester(
  params: AdminFetchOrdersParams
): Promise<AdminOrderListResponse | null> {
  console.log("fetchAdminOrdersRequester params=", params)
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

export async function fetchAdminCustomerEmailSuggestRequester(
  q: string
): Promise<AdminCustomerEmailSuggestItem[]> {
  try {
    const res = await axios.get("/api/admin/orders/customer-suggest", {
      params: { q },
      withCredentials: true
    })
    return res.data as AdminCustomerEmailSuggestItem[]
  } catch (e) {
    console.error("fetchAdminCustomerEmailSuggestRequester error:", e)
    return []
  }
}

export async function fetchAdminStoreNameSuggestRequester(
  q: string
): Promise<AdminStoreNameSuggestItem[]> {
  try {
    console.log("fetchAdminStoreNameSuggestRequester q=", q)
    const res = await axios.get("/api/admin/orders/store-name-suggest", {
      params: { q },
      withCredentials: true
    })
    console.log("fetchAdminStoreNameSuggestRequester res=", res.data)
    return res.data as AdminStoreNameSuggestItem[]
  } catch (e) {
    console.error("fetchAdminStoreNameSuggestRequester error:", e)
    return []
  }
}
