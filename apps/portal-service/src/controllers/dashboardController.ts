import { Request, Response } from "express"
import { Op, fn, col, literal, WhereOptions } from "sequelize"
import type { Order as SequelizeOrderType } from "sequelize"
import { Order } from "@digishop/db/src/models/Order"
import { Store } from "@digishop/db/src/models/Store"
import { CheckOut } from "@digishop/db/src/models/CheckOut"
import { Payment } from "@digishop/db/src/models/Payment"
import { User } from "@digishop/db/src/models/User"
import { cacheGet, cacheSet, weakEtag } from "../lib/cache"
import { Col, Fn, Literal } from "sequelize/types/utils"

type OrderStatus =
  | "PENDING"
  | "CUSTOMER_CANCELED"
  | "PAID"
  | "MERCHANT_CANCELED"
  | "PROCESSING"
  | "READY_TO_SHIP"
  | "HANDED_OVER"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETE"
  | "TRANSIT_LACK"
  | "RE_TRANSIT"
  | "REFUND_REQUEST"
  | "REFUND_REJECTED"
  | "AWAITING_RETURN"
  | "RECEIVE_RETURN"
  | "RETURN_VERIFIED"
  | "RETURN_FAIL"
  | "REFUND_APPROVED"
  | "REFUND_PROCESSING"
  | "REFUND_SUCCESS"
  | "REFUND_FAIL"
  | "REFUND_RETRY"


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
  const startDate = new Date(r.from);
  
  // ตั้งเวลาเริ่มต้นของวัน from
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(r.to);
  
  // ตั้งเวลาสิ้นสุดของวัน to
  endDate.setHours(23, 59, 59, 999); 

  return {
    createdAt: { [Op.between]: [startDate, endDate] }
  };
}

function cacheKey(prefix: string, r: { from: string; to: string }): string {
  return `${prefix}:${r.from}:${r.to}`
}

const ORDER_BY_DAY_ASC: SequelizeOrderType = [[literal("day"), "ASC"]]
const ORDER_BY_DATE_ASC: SequelizeOrderType = [[fn("DATE", col("Order.created_at")), "ASC"]]
const ORDER_BY_SUM_GMV_DESC: SequelizeOrderType = [[fn("SUM", col("Order.grand_total_minor")), "DESC"]]

// KPI
export async function adminDashboardKpis(req: Request, res: Response) {
  try {
    const range = parseRange(req)
    console.log("KPI range: ", range)
    const key = cacheKey("dash:kpis", range)
    const cached = await cacheGet<DashboardKpis>(key)
    if (cached) { res.setHeader("ETag", weakEtag(cached)); return res.json(cached) }
    console.log("No cache for kpis")
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
    console.log("KPI rows: ", rows)
    const r0 = rows[0]
    const kpis: DashboardKpis = {
      gmvMinor: toNum(r0?.gmvMinor),
      orders: toNum(r0?.orders),
      activeStores: toNum(r0?.activeStores),
      newUsers: await User.count({ where: whereBetweenCreatedAt(range) })
    }
    console.log("Kpis: ", kpis)
    await cacheSet(key, kpis, 60)
    res.setHeader("ETag", weakEtag(kpis))
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
    const key = cacheKey("dash:series", range)
    const cached = await cacheGet<SeriesPoint[]>(key)
    if (cached) { res.setHeader("ETag", weakEtag(cached)); return res.json(cached) }

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
      PENDING: 0,
      PAID: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      COMPLETE: 0,
      CUSTOMER_CANCELED: 0,
      MERCHANT_CANCELED: 0,
      READY_TO_SHIP: 0,
      HANDED_OVER: 0,
      TRANSIT_LACK: 0,
      RE_TRANSIT: 0,
      REFUND_REQUEST: 0,
      REFUND_REJECTED: 0,
      AWAITING_RETURN: 0,
      RECEIVE_RETURN: 0,
      RETURN_VERIFIED: 0,
      RETURN_FAIL: 0,
      REFUND_APPROVED: 0,
      REFUND_PROCESSING: 0,
      REFUND_SUCCESS: 0,
      REFUND_FAIL: 0,
      REFUND_RETRY: 0
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

    await cacheSet(key, series, 60)
    res.setHeader("ETag", weakEtag(series))
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
    const key = cacheKey("dash:status", range)
    const cached = await cacheGet<StatusDistRow[]>(key)
    if (cached) { res.setHeader("ETag", weakEtag(cached)); return res.json(cached) }

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
      "PENDING",
      "PAID",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "COMPLETE",
      "CUSTOMER_CANCELED",
      "MERCHANT_CANCELED",
      "TRANSIT_LACK",
      "RE_TRANSIT",
      "REFUND_REQUEST",
      "REFUND_REJECTED",
      "AWAITING_RETURN",
      "RECEIVE_RETURN",
      "RETURN_VERIFIED",
      "RETURN_FAIL",
      "REFUND_APPROVED",
      "REFUND_PROCESSING",
      "REFUND_SUCCESS",
      "REFUND_FAIL",
      "REFUND_RETRY",
      "READY_TO_SHIP",
      "HANDED_OVER"
    ]
    const m = new Map<OrderStatus, number>()
    rows.forEach((r) => m.set(r.name, toNum(r.value)))
    const dist: StatusDistRow[] = names.map((n) => ({ name: n, value: m.get(n) ?? 0 }))

    await cacheSet(key, dist, 60)
    res.setHeader("ETag", weakEtag(dist))
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
    const key = cacheKey("dash:topstores", range)
    const cached = await cacheGet<TopStore[]>(key)
    if (cached) { res.setHeader("ETag", weakEtag(cached)); return res.json(cached) }

    const where = whereBetweenCreatedAt(range)

    // สร้าง alias แล้ว order ด้วย alias เลย เพื่อตัดปัญหา ONLY_FULL_GROUP_BY
    const rows = (await Order.findAll({
      attributes: [
        [fn("SUM", col("Order.grand_total_minor")), "gmvMinor"],
        [fn("COALESCE", col("store.store_name"), col("Order.store_name_snapshot")), "name"]
      ],
      include: [
        { model: Store, as: "store", attributes: [], required: false }
      ],
      where,
      group: [
        col("store.id"),
        col("store.store_name"),
        col("Order.store_name_snapshot"),
      ],
      // สลับมา order ด้วย alias 'gmvMinor' แทน SUM(...), กัน SQL แปลกๆ
      order: [[literal("gmvMinor"), "DESC"]],
      limit: 10,
      subQuery: false,
      raw: true,
    })) as unknown as Array<{ gmvMinor: string | number; name: string | null }>

    const data: TopStore[] = rows.map((r) => ({
      name: String(r.name ?? "Unknown"),
      gmvMinor: Number(r.gmvMinor) || 0,
    }))

    await cacheSet(key, data, 60)
    res.setHeader("ETag", weakEtag(data))
    res.json(data)
  } catch (e) {
    console.error("adminDashboardTopStores error:", e)
    res.status(400).json({ error: "Bad request" })
  }
}

