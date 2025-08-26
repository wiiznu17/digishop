import type { Order, OrderStatus } from "@/types/props/orderProp"
import axios from "@/lib/axios"

export type SortDir = "ASC" | "DESC"

export interface ListOrdersParams {
  page?: number
  pageSize?: number
  status?: string // "ALL" | "PENDING" | ...
  q?: string
  storeId?: number
  startDate?: string // ISO
  endDate?: string // ISO
  sortBy?: string // e.g. "created_at"
  sortDir?: SortDir
  signal?: AbortSignal
}

export interface ListOrdersResponse {
  data: Order[]
  meta: { page: number; pageSize: number; total: number }
}

export async function listOrdersRequester(
  params: ListOrdersParams = {}
): Promise<ListOrdersResponse> {
  try {
    const {
      page = 1,
      pageSize = 20,
      status = "ALL",
      q = "",
      storeId,
      startDate,
      endDate,
      sortBy = "created_at",
      sortDir = "DESC",
      signal
    } = params
    console.log("listOrdersRequester", params)
    const res = await axios.get<ListOrdersResponse>("/api/merchant/orders", {
      params: {
        page,
        pageSize,
        status,
        q,
        storeId,
        startDate,
        endDate,
        sortBy,
        sortDir
      },
      signal
    })

    return res.data
  } catch (err) {
    console.error("❌ listOrdersRequester error:", err)
    throw err
  }
}

/** ========== UPDATE STATUS ========== */

export interface UpdateOrderPayload {
  status?: OrderStatus
  trackingNumber?: string
  carrier?: string
}

export interface UpdateOrderResponse {
  data: Order
}

/**
 * อัปเดตสถานะ/เลขพัสดุของออเดอร์
 * - ส่งเฉพาะฟิลด์ที่อยากอัปเดต: { status } หรือ { trackingNumber, carrier } หรือทั้งคู่
 * - backend จะ validate transition ให้เอง
 */
export async function updateOrderRequester(
  orderId: string,
  payload: UpdateOrderPayload,
  signal?: AbortSignal
): Promise<UpdateOrderResponse> {
  try {
    console.log("updateOrderRequester", orderId, payload)

    const res = await axios.patch<UpdateOrderResponse>(
      `/api/merchant/orders/${orderId}`,
      payload,
      { signal }
    )

    console.log("✅ updateOrderRequester res", res.data)
    return res.data
  } catch (err) {
    console.error(`❌ updateOrderRequester failed (orderId=${orderId}):`, err)
    throw err
  }
}

/** Helper เฉพาะเคสเปลี่ยนเป็น HANDED_OVER และแนบเลขพัสดุ */
export async function handOverOrderRequester(
  orderId: string,
  trackingNumber: string,
  carrier?: string,
  signal?: AbortSignal
): Promise<UpdateOrderResponse> {
  try {
    return await updateOrderRequester(
      orderId,
      {
        status: "HANDED_OVER",
        trackingNumber,
        ...(carrier ? { carrier } : {})
      },
      signal
    )
  } catch (err) {
    console.error(`❌ handOverOrderRequester failed (orderId=${orderId}):`, err)
    throw err
  }
}
