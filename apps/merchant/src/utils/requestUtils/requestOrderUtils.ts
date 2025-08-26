import type { Order } from "@/types/props/orderProp"
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
  const {
    page = 1, // default
    pageSize = 20, // default
    status = "ALL",
    q = "",
    storeId,
    startDate,
    endDate,
    sortBy = "created_at",
    sortDir = "DESC", // default
    signal
  } = params

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
}
