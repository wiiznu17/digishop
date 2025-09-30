import axios from "@/lib/axios"
import type {
  AnalyticsKpis,
  TrendsPoint,
  StatusDistItem,
  StoreLeaderboardResponse
} from "@/types/admin/analytics"

type Range = { from: string; to: string }

export async function fetchAnaKpis(p: Range): Promise<AnalyticsKpis> {
  const r = await axios.get<AnalyticsKpis>("/api/admin/analytics/kpis", {
    params: p,
    withCredentials: true
  })
  return r.data
}

export async function fetchAnaTrends(p: Range): Promise<TrendsPoint[]> {
  const r = await axios.get<TrendsPoint[]>("/api/admin/analytics/trends", {
    params: p,
    withCredentials: true
  })
  return r.data
}

export async function fetchAnaStatusDist(p: Range): Promise<StatusDistItem[]> {
  const r = await axios.get<StatusDistItem[]>(
    "/api/admin/analytics/status-dist",
    { params: p, withCredentials: true }
  )
  return r.data
}

export async function fetchAnaStores(
  p: Range & {
    q?: string
    segment?: "ALL" | "TOP" | "LOW"
    page?: number
    pageSize?: number
  }
): Promise<StoreLeaderboardResponse> {
  const r = await axios.get<StoreLeaderboardResponse>(
    "/api/admin/analytics/stores",
    { params: p, withCredentials: true }
  )
  return r.data
}
