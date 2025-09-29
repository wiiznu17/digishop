import { Request, Response } from "express"
import { Op, fn, col, literal, WhereOptions } from "sequelize"
import { cacheGet, cacheSet } from "../lib/cache"

// Models จากแพ็กเกจ db (อิง index.ts ที่คุณให้)
import { Order } from "@digishop/db/src/models/Order"
import { Store } from "@digishop/db/src/models/Store"
import { RefundOrder } from "@digishop/db/src/models/RefundOrder"
import { CheckOut } from "@digishop/db/src/models/CheckOut"

type Num = number
type MaybeDate = string | undefined

const asDate = (v?: MaybeDate) => (v && !Number.isNaN(new Date(v).getTime()) ? new Date(v) : null)
const asInt  = (v: unknown, d = 0) => {
  const n = Number(v); return Number.isFinite(n) ? Math.trunc(n) : d
}
const toNumber = (v: unknown) => Number.isFinite(Number(v ?? 0)) ? Number(v) : 0

function buildOrderWhere(q: Request["query"]): WhereOptions {
  const from = asDate(q.from as string | undefined)
  const to   = asDate(q.to as string | undefined)
  const where: WhereOptions = {}
  if (from && to) (where as any).createdAt = { [Op.between]: [from, to] }
  else if (from) (where as any).createdAt = { [Op.gte]: from }
  else if (to)   (where as any).createdAt = { [Op.lte]: to }
  return where
}

function keyOf(obj: Record<string, unknown>, k: string): boolean { return Object.prototype.hasOwnProperty.call(obj, k) }

export async function anaKpis(req: Request, res: Response) {
  try {
    const where = buildOrderWhere(req.query)
    const cacheKey = `ana:kpis:${(req.query.from||"")}:${(req.query.to||"")}`
    const cached = await cacheGet<unknown>(cacheKey)
    if (cached) return res.json(cached)

    // GMV / Orders
    const totals = await Order.findAll({
      attributes: [
        [fn("SUM", col("grand_total_minor")), "gmvMinor"],
        [fn("COUNT", col("id")), "orders"],
        // [fn("COUNT", fn("DISTINCT", col("user_id"))), "distinctUsers"],
        // paid-ish (สะท้อนว่าขายสำเร็จ)
        [fn("SUM", literal("CASE WHEN `Order`.`status` IN ('PAID','PROCESSING','SHIPPED','DELIVERED') THEN 1 ELSE 0 END")), "paidOrders"],
        [fn("SUM", literal("CASE WHEN `Order`.`status`='CANCELLED' THEN 1 ELSE 0 END")), "cancelOrders"],
      ],
      where,
      raw: true
    })

    const t = totals?.[0] as unknown as Record<string, unknown> | undefined
    const gmvMinor = toNumber(t?.gmvMinor)
    const orders = toNumber(t?.orders)
    // const distinctUsers = Math.max(1, toNumber(t?.distinctUsers))
    const aovMinor = orders > 0 ? Math.round(gmvMinor / orders) : 0
    const paidOrders = toNumber(t?.paidOrders)
    const cancelOrders = toNumber(t?.cancelOrders)

    // Refund rate
    const refunds = await RefundOrder.findAll({
      attributes: [[fn("COUNT", col("id")), "refunds"]],
      where: buildRefundWhere(req.query),
      raw: true
    })
    const refundCount = toNumber((refunds?.[0] as any)?.refunds)

    // Repeat purchase rate
    const repeatRows = await CheckOut.findAll({
      attributes: [
        [fn("COUNT", col("id")), "c"],
        [col("customer_id"), "customerId"],
      ],
      where,
      group: [col("customer_id")],
      raw: true
    })
    console.log("repeatRows:", repeatRows.length)
    const usersWith2Plus = repeatRows.filter(r => toNumber((r as any).c) >= 2).length
    const repeatRate = usersWith2Plus / Math.max(1, repeatRows.length)

    const payload = {
      gmvMinor,
      orders,
      aovMinor,
      paidRate: orders > 0 ? paidOrders / orders : 0,
      cancelRate: orders > 0 ? cancelOrders / orders : 0,
      refundRate: orders > 0 ? refundCount / orders : 0,
      repeatRate,
    }

    await cacheSet(cacheKey, payload, 120)
    return res.json(payload)
  } catch (e) {
    console.error("anaKpis error:", e)
    return res.status(500).json({ error: "Internal server error" })
  }
}

function buildRefundWhere(q: Request["query"]): WhereOptions {
  const from = asDate(q.from as string | undefined)
  const to   = asDate(q.to as string | undefined)
  const where: WhereOptions = {}
  if (from && to) (where as any).createdAt = { [Op.between]: [from, to] }
  else if (from) (where as any).createdAt = { [Op.gte]: from }
  else if (to)   (where as any).createdAt = { [Op.lte]: to }
  return where
}

export async function anaTrends(req: Request, res: Response) {
  try {
    const where = buildOrderWhere(req.query)
    const cacheKey = `ana:trends:${(req.query.from||"")}:${(req.query.to||"")}`
    const cached = await cacheGet<unknown>(cacheKey)
    if (cached) return res.json(cached)

    const rows = await Order.findAll({
      attributes: [
        [fn("DATE", col("created_at")), "day"],
        [fn("SUM", col("grand_total_minor")), "gmvMinor"],
        [fn("COUNT", col("id")), "orders"],
      ],
      where,
      group: [fn("DATE", col("created_at"))],
      order: [[fn("DATE", col("created_at")), "ASC"]],
      raw: true
    })

    const out = (rows as unknown as Array<Record<string, unknown>>).map(r => {
      const gmv = toNumber(r.gmvMinor)
      const orders = toNumber(r.orders)
      const aov = orders > 0 ? Math.round(gmv / orders) : 0
      return { date: String(r.day), gmvMinor: gmv, orders, aovMinor: aov }
    })

    await cacheSet(cacheKey, out, 180)
    return res.json(out)
  } catch (e) {
    console.error("anaTrends error:", e)
    return res.status(500).json({ error: "Internal server error" })
  }
}

export async function anaStatusDist(req: Request, res: Response) {
  try {
    const where = buildOrderWhere(req.query)
    const cacheKey = `ana:status:${(req.query.from||"")}:${(req.query.to||"")}`
    const cached = await cacheGet<unknown>(cacheKey)
    if (cached) return res.json(cached)

    const rows = await Order.findAll({
      attributes: [
        ["status", "name"],
        [fn("COUNT", col("id")), "value"],
      ],
      where,
      group: [col("status")],
      raw: true
    })

    const names: Array<"PENDING"|"PAID"|"PROCESSING"|"SHIPPED"|"DELIVERED"|"CANCELLED"> =
      ["PENDING","PAID","PROCESSING","SHIPPED","DELIVERED","CANCELLED"]

    const map = new Map<string, number>()
    rows.forEach(r => map.set(String((r as any).name), toNumber((r as any).value)))

    const out = names.map(n => ({ name: n, value: map.get(n) ?? 0 }))
    await cacheSet(cacheKey, out, 180)
    return res.json(out)
  } catch (e) {
    console.error("anaStatusDist error:", e)
    return res.status(500).json({ error: "Internal server error" })
  }
}

/* -------------------- 4) Store Leaderboard -------------------- */

export async function anaStoreLeaderboard(req: Request, res: Response) {
  try {
    const where = buildOrderWhere(req.query)
    const q = String((req.query.q ?? "") as string).trim()
    const segment = (req.query.segment as "ALL"|"TOP"|"LOW" | undefined) ?? "ALL"
    const page = Math.max(1, asInt(req.query.page, 1))
    const pageSize = Math.min(100, Math.max(1, asInt(req.query.pageSize, 20)))

    const cacheKey = `ana:stores:${(req.query.from||"")}:${(req.query.to||"")}:${q}:${segment}:${page}:${pageSize}`
    const cached = await cacheGet<unknown>(cacheKey)
    if (cached) return res.json(cached)

    // base query (aggregate by store)
    const baseWhere = { ...where }

    // สร้างเงื่อนไขค้นหาชื่อร้านบนทั้ง store.store_name และ snapshot
    const nameFilter: WhereOptions | undefined = q
      ? {
          [Op.or]: [
            { "$store.store_name$": { [Op.like]: `%${q}%` } },
            { store_name_snapshot: { [Op.like]: `%${q}%` } },
          ]
        }
      : undefined

    const attributes = [
      [fn("COALESCE", col("store.store_name"), col("Order.store_name_snapshot")), "name"],
      [fn("SUM", col("Order.grand_total_minor")), "gmvMinor"],
      [fn("COUNT", col("Order.id")), "orders"],
      [fn("COALESCE", col("store.id"), literal("NULL")), "storeId"]
    ] as const

    // นับทั้งหมด (เพื่อทำ paging) — ใช้ซับคิวรีแบบง่าย
    const allRows = await Order.findAll({
      attributes: [...attributes],
      include: [{ model: Store, as: "store", required: false, attributes: [] }],
      where: nameFilter ? { ...baseWhere, ...nameFilter } : baseWhere,
      group: [col("store.id"), col("store.store_name"), col("Order.store_name_snapshot")],
      raw: true
    })
    const materialized = (allRows as unknown as Array<Record<string, unknown>>).map(r => {
      const gmv = toNumber(r.gmvMinor)
      const orders = toNumber(r.orders)
      const aov = orders > 0 ? Math.round(gmv / orders) : 0
      return {
        storeId: r.storeId === null ? null : toNumber(r.storeId),
        name: String(r.name ?? "Unknown"),
        gmvMinor: gmv,
        orders,
        aovMinor: aov
      }
    })

    // segment
    let sorted: typeof materialized
    if (segment === "TOP") {
      sorted = [...materialized].sort((a,b)=> b.gmvMinor - a.gmvMinor).slice(0, 10)
    } else if (segment === "LOW") {
      sorted = [...materialized].sort((a,b)=> a.gmvMinor - b.gmvMinor).slice(0, 10)
    } else {
      sorted = [...materialized].sort((a,b)=> b.gmvMinor - a.gmvMinor)
    }

    const total = sorted.length
    const start = (page - 1) * pageSize
    const rows = sorted.slice(start, start + pageSize)

    const payload = { total, rows }
    await cacheSet(cacheKey, payload, 300)
    return res.json(payload)
  } catch (e) {
    console.error("anaStoreLeaderboard error:", e)
    return res.status(500).json({ error: "Internal server error" })
  }
}
