import axios from "@/lib/axios"
import type {
  DashboardKpis,
  DashboardSeriesPoint,
  DashboardStatusDist,
  DashboardTopStore
} from "@/types/admin/dashboard"

export type DateRange = { from: string; to: string }

export async function fetchDashboardKpis(params: DateRange) {
  try {
    const r = await axios.get<DashboardKpis>("/api/admin/dashboards/kpis", {
      params,
      withCredentials: true
    })
    return r.data
  } catch (error) {
    console.error("fetchDashboardKpis error:", error)
    throw error // Rethrow the error after logging it
  }
}

export async function fetchDashboardSeries(params: DateRange) {
  try {
    const r = await axios.get<DashboardSeriesPoint[]>(
      "/api/admin/dashboards/series",
      {
        params,
        withCredentials: true
      }
    )
    return r.data
  } catch (error) {
    console.error("fetchDashboardSeries error:", error)
    throw error // Rethrow the error after logging it
  }
}

export async function fetchDashboardStatusDist(params: DateRange) {
  try {
    const r = await axios.get<DashboardStatusDist[]>(
      "/api/admin/dashboards/status-dist",
      {
        params,
        withCredentials: true
      }
    )
    return r.data
  } catch (error) {
    console.error("fetchDashboardStatusDist error:", error)
    throw error // Rethrow the error after logging it
  }
}

export async function fetchDashboardTopStores(params: DateRange) {
  try {
    const r = await axios.get<DashboardTopStore[]>(
      "/api/admin/dashboards/top-stores",
      {
        params,
        withCredentials: true
      }
    )
    return r.data
  } catch (error) {
    console.error("fetchDashboardTopStores error:", error)
    throw error // Rethrow the error after logging it
  }
}
