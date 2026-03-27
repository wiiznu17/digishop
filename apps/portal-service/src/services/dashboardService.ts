import { OrderStatus } from '@digishop/db'
import { Op, WhereOptions } from 'sequelize'
import { BadRequestError } from '../errors/AppError'
import { dashboardRepository } from '../repositories/dashboardRepository'

type SeriesByStatus = Record<OrderStatus, number>

type SeriesPoint = {
  date: string
  gmvMinor: number
  orders: number
  byStatus: SeriesByStatus
}

type DashboardKpis = {
  gmvMinor: number
  orders: number
  activeStores: number
  newUsers: number
}

type StatusDistRow = { name: OrderStatus; value: number }
type TopStore = { name: string; gmvMinor: number }

function toNum(v: string | number | null | undefined): number {
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

function isDateStr(s: string | undefined): s is string {
  if (!s) return false
  const t = new Date(s).getTime()
  return Number.isFinite(t)
}

function parseRange(query: Record<string, string | undefined>): {
  from: string
  to: string
} {
  if (!isDateStr(query.from) || !isDateStr(query.to)) {
    throw new BadRequestError("Invalid date range: 'from' or 'to'")
  }
  return { from: query.from, to: query.to }
}

function whereBetweenCreatedAt(r: { from: string; to: string }): WhereOptions {
  const startDate = new Date(r.from)
  startDate.setHours(0, 0, 0, 0)

  const endDate = new Date(r.to)
  endDate.setHours(23, 59, 59, 999)

  return {
    createdAt: { [Op.between]: [startDate, endDate] }
  }
}

export class DashboardService {
  async getDashboardKpis(query: Record<string, string | undefined>) {
    const range = parseRange(query)
    const where = whereBetweenCreatedAt(range)

    const rows = (await dashboardRepository.getKpisOrdersData(
      where
    )) as unknown as Array<{
      gmvMinor: string | number
      orders: string | number
      activeStores: string | number
    }>

    const r0 = rows[0]
    const kpis: DashboardKpis = {
      gmvMinor: toNum(r0?.gmvMinor),
      orders: toNum(r0?.orders),
      activeStores: toNum(r0?.activeStores),
      newUsers: await dashboardRepository.getKpisNewUsers(
        whereBetweenCreatedAt(range)
      )
    }

    return kpis
  }

  async getDashboardSeries(query: Record<string, string | undefined>) {
    const range = parseRange(query)
    const where = whereBetweenCreatedAt(range)

    const dailyTotals = (await dashboardRepository.getDailyTotals(
      where
    )) as unknown as Array<{
      day: string
      gmvMinor: string | number
      orders: string | number
    }>
    const byStatusDaily = (await dashboardRepository.getDailyByStatus(
      where
    )) as unknown as Array<{
      day: string
      status: OrderStatus
      c: string | number
    }>

    const mapTotals = new Map<string, { gmvMinor: number; orders: number }>()
    dailyTotals.forEach((r) =>
      mapTotals.set(r.day, {
        gmvMinor: toNum(r.gmvMinor),
        orders: toNum(r.orders)
      })
    )

    const emptyStatus: SeriesByStatus = {
      [OrderStatus.CANCELED_REFUND]: 0,
      [OrderStatus.PENDING]: 0,
      [OrderStatus.CUSTOMER_CANCELED]: 0,
      [OrderStatus.PAID]: 0,
      [OrderStatus.MERCHANT_CANCELED]: 0,
      [OrderStatus.PROCESSING]: 0,
      [OrderStatus.READY_TO_SHIP]: 0,
      [OrderStatus.HANDED_OVER]: 0,
      [OrderStatus.SHIPPED]: 0,
      [OrderStatus.DELIVERED]: 0,
      [OrderStatus.COMPLETE]: 0,
      [OrderStatus.TRANSIT_LACK]: 0,
      [OrderStatus.RE_TRANSIT]: 0,
      [OrderStatus.REFUND_REQUEST]: 0,
      [OrderStatus.REFUND_REJECTED]: 0,
      [OrderStatus.AWAITING_RETURN]: 0,
      [OrderStatus.RECEIVE_RETURN]: 0,
      [OrderStatus.RETURN_VERIFIED]: 0,
      [OrderStatus.RETURN_FAIL]: 0,
      [OrderStatus.REFUND_APPROVED]: 0,
      [OrderStatus.REFUND_PROCESSING]: 0,
      [OrderStatus.REFUND_SUCCESS]: 0,
      [OrderStatus.REFUND_FAIL]: 0,
      [OrderStatus.REFUND_RETRY]: 0
    }

    const mapStatus = new Map<string, SeriesByStatus>()
    byStatusDaily.forEach((r) => {
      const cur = mapStatus.get(r.day) ?? { ...emptyStatus }
      const next: SeriesByStatus = { ...cur }
      next[r.status] = (next[r.status] ?? 0) + toNum(r.c)
      mapStatus.set(r.day, next)
    })

    const allDays = Array.from(
      new Set([...mapTotals.keys(), ...mapStatus.keys()])
    ).sort()

    const series: SeriesPoint[] = allDays.map((day) => {
      const t = mapTotals.get(day) ?? { gmvMinor: 0, orders: 0 }
      return {
        date: day,
        gmvMinor: t.gmvMinor,
        orders: t.orders,
        byStatus: mapStatus.get(day) ?? { ...emptyStatus }
      }
    })

    return series
  }

  async getDashboardStatusDist(query: Record<string, string | undefined>) {
    const range = parseRange(query)
    const where = whereBetweenCreatedAt(range)

    const rows = (await dashboardRepository.getStatusDist(
      where
    )) as unknown as Array<{ name: OrderStatus; value: string | number }>

    const names: OrderStatus[] = [
      OrderStatus.CANCELED_REFUND,
      OrderStatus.PENDING,
      OrderStatus.CUSTOMER_CANCELED,
      OrderStatus.PAID,
      OrderStatus.MERCHANT_CANCELED,
      OrderStatus.PROCESSING,
      OrderStatus.READY_TO_SHIP,
      OrderStatus.HANDED_OVER,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
      OrderStatus.COMPLETE,
      OrderStatus.TRANSIT_LACK,
      OrderStatus.RE_TRANSIT,
      OrderStatus.REFUND_REQUEST,
      OrderStatus.REFUND_REJECTED,
      OrderStatus.AWAITING_RETURN,
      OrderStatus.RECEIVE_RETURN,
      OrderStatus.RETURN_VERIFIED,
      OrderStatus.RETURN_FAIL,
      OrderStatus.REFUND_APPROVED,
      OrderStatus.REFUND_PROCESSING,
      OrderStatus.REFUND_SUCCESS,
      OrderStatus.REFUND_FAIL,
      OrderStatus.REFUND_RETRY
    ]
    const m = new Map<OrderStatus, number>()
    rows.forEach((r) => m.set(r.name, toNum(r.value)))
    const dist: StatusDistRow[] = names.map((n) => ({
      name: n,
      value: m.get(n) ?? 0
    }))

    return dist
  }

  async getDashboardTopStores(query: Record<string, string | undefined>) {
    const range = parseRange(query)
    const where = whereBetweenCreatedAt(range)

    const rows = (await dashboardRepository.getTopStores(
      where
    )) as unknown as Array<{ gmvMinor: string | number; name: string | null }>

    const data: TopStore[] = rows.map((r) => ({
      name: String(r.name ?? 'Unknown'),
      gmvMinor: Number(r.gmvMinor) || 0
    }))

    return data
  }
}

export const dashboardService = new DashboardService()
