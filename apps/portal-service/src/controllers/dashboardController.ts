import { Request, Response } from "express"
import { Op, fn, col, literal, WhereOptions } from "sequelize"
import type { Order as SequelizeOrderType } from "sequelize"
import { Order, OrderStatus, Store, User } from "@digishop/db"

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

/* ========== Helpers ========== */

function toNum(v: string | number | null | undefined): number {
  if (typeof v === "number") return v
  if (typeof v === "string") {
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

function parseRange(req: Request): { from: string; to: string } {
  const q = req.query as Record<string, string | undefined>
  if (!isDateStr(q.from) || !isDateStr(q.to)) {
    throw new Error("Invalid date range: 'from' or 'to'")
  }
  return { from: q.from, to: q.to }
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

const ORDER_BY_DATE_ASC: SequelizeOrderType = [[fn("DATE", col("Order.created_at")), "ASC"]]

// KPI
export async function adminDashboardKpis(req: Request, res: Response) {
  try {
    const range = parseRange(req)
    const where = whereBetweenCreatedAt(range)

    const rows = (await Order.findAll({
      attributes: [
        [fn("SUM", col("grand_total_minor")), "gmvMinor"],
        [fn("COUNT", col("id")), "orders"],
        [fn("COUNT", fn("DISTINCT", col("store_id"))), "activeStores"]
      ],
      where,
      raw: true
    })) as unknown as Array<{ gmvMinor: string | number; orders: string | number; activeStores: string | number }>

    const r0 = rows[0]
    const kpis: DashboardKpis = {
      gmvMinor: toNum(r0?.gmvMinor),
      orders: toNum(r0?.orders),
      activeStores: toNum(r0?.activeStores),
      newUsers: await User.count({ where: whereBetweenCreatedAt(range) })
    }

    res.json(kpis)
  } catch (e) {
    console.error("adminDashboardKpis error:", e)
    res.status(400).json({ error: "Bad request" })
  }
}

// GMV, orders
export async function adminDashboardSeries(req: Request, res: Response) {
  try {
    const range = parseRange(req)
    const where = whereBetweenCreatedAt(range)

    const dailyTotals = (await Order.findAll({
      attributes: [
        [fn("DATE", col("Order.created_at")), "day"],
        [fn("SUM", col("Order.grand_total_minor")), "gmvMinor"],
        [fn("COUNT", col("Order.id")), "orders"]
      ],
      where,
      group: [fn("DATE", col("Order.created_at"))],
      order: ORDER_BY_DATE_ASC,
      raw: true
    })) as unknown as Array<{ day: string; gmvMinor: string | number; orders: string | number }>

    const byStatusDaily = (await Order.findAll({
      attributes: [
        [fn("DATE", col("Order.created_at")), "day"],
        ["status", "status"],
        [fn("COUNT", col("Order.id")), "c"]
      ],
      where,
      group: [fn("DATE", col("Order.created_at")), col("Order.status")],
      order: ORDER_BY_DATE_ASC,
      raw: true
    })) as unknown as Array<{ day: string; status: OrderStatus; c: string | number }>

    // map totals
    const mapTotals = new Map<string, { gmvMinor: number; orders: number }>()
    dailyTotals.forEach((r) =>
      mapTotals.set(r.day, { gmvMinor: toNum(r.gmvMinor), orders: toNum(r.orders) })
    )

    // map status
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

    const allDays = Array.from(new Set([...mapTotals.keys(), ...mapStatus.keys()])).sort()

    const series: SeriesPoint[] = allDays.map((day) => {
      const t = mapTotals.get(day) ?? { gmvMinor: 0, orders: 0 }
      return {
        date: day,
        gmvMinor: t.gmvMinor,
        orders: t.orders,
        byStatus: mapStatus.get(day) ?? { ...emptyStatus }
      }
    })

    res.json(series)
  } catch (e) {
    console.error("adminDashboardSeries error:", e)
    res.status(400).json({ error: "Bad request" })
  }
}

// สถานะ order
export async function adminDashboardStatusDist(req: Request, res: Response) {
  try {
    const range = parseRange(req)
    const where = whereBetweenCreatedAt(range)

    const rows = (await Order.findAll({
      attributes: [
        ["status", "name"],
        [fn("COUNT", col("Order.id")), "value"]
      ],
      where,
      group: [col("Order.status")],
      raw: true
    })) as unknown as Array<{ name: OrderStatus; value: string | number }>

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
    const dist: StatusDistRow[] = names.map((n) => ({ name: n, value: m.get(n) ?? 0 }))

    res.json(dist)
  } catch (e) {
    console.error("adminDashboardStatusDist error:", e)
    res.status(400).json({ error: "Bad request" })
  }
}

// top stores
export async function adminDashboardTopStores(req: Request, res: Response) {
  try {
    const range = parseRange(req)
    const where = whereBetweenCreatedAt(range)

    const rows = (await Order.findAll({
      attributes: [
        [fn("SUM", col("Order.grand_total_minor")), "gmvMinor"],
        [fn("COALESCE", col("store.store_name"), col("Order.store_name_snapshot")), "name"]
      ],
      include: [{ model: Store, as: "store", attributes: [], required: false }],
      where,
      group: [col("store.id"), col("store.store_name"), col("Order.store_name_snapshot")],
      order: [[literal("gmvMinor"), "DESC"]],
      limit: 10,
      subQuery: false,
      raw: true
    })) as unknown as Array<{ gmvMinor: string | number; name: string | null }>

    const data: TopStore[] = rows.map((r) => ({
      name: String(r.name ?? "Unknown"),
      gmvMinor: Number(r.gmvMinor) || 0
    }))

    res.json(data)
  } catch (e) {
    console.error("adminDashboardTopStores error:", e)
    res.status(400).json({ error: "Bad request" })
  }
}
