import { CheckOut, Order, OrderItem, Product, Store, StoreStatus, User } from "@digishop/db";
import { Request, Response } from "express"
import { Op, col, fn, where as sqlWhere, WhereOptions } from "sequelize"

const asInt = (v: any, d: number) => {
  const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.floor(n) : d
}
const asDate = (v?: string) => v && !Number.isNaN(new Date(v).getTime()) ? new Date(v) : null
const likeify = (q: string) => `%${q.replace(/[%_]/g, "\\$&")}%`
const asMoneyMinor = (v: any) => {
  if (v === undefined || v === null || v === "") return null
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null
}

/** YYYY-MM */
function lastNMonthsLabels(n: number) {
  const res: string[] = []
  const base = new Date()
  base.setDate(1)
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base)
    d.setMonth(d.getMonth() - i)
    const y = d.getFullYear()
    const m = `${d.getMonth() + 1}`.padStart(2, "0")
    res.push(`${y}-${m}`)
  }
  return res
}

export async function adminListStores(req: Request, res: Response) {
  try {
    const {
      q = "",
      status,
      dateFrom,
      dateTo,
      sortBy = "createdAt",
      sortDir = "desc",
      salesMin,
      salesMax,
      orderCountMin,
      orderCountMax,
    } = req.query as Record<string, string | undefined>

    // ── pagination
    const page = Math.max(asInt(req.query.page, 1), 1)
    const pageSize = Math.min(Math.max(asInt(req.query.pageSize, 20), 1), 100)
    const offset = (page - 1) * pageSize

    // ── where: เงื่อนไขของร้านค้า
    const storeWhere: WhereOptions = {}
    if (status && status.trim()) (storeWhere as any)["status"] = status

    const from = asDate(dateFrom); const to = asDate(dateTo)
    if (from && to) (storeWhere as any)["createdAt"] = { [Op.between]: [from, to] }
    else if (from) (storeWhere as any)["createdAt"] = { [Op.gte]: from }
    else if (to) (storeWhere as any)["createdAt"] = { [Op.lte]: to }

    if (q && q.trim()) {
      const t = likeify(q.trim())
      Object.assign(storeWhere, {
        [Op.and]: [{ [Op.or]: [{ storeName: { [Op.like]: t } }, { email: { [Op.like]: t } }] }],
      })
    }

    // aggregate expr (เฉพาะออเดอร์: ไม่ join products เพื่อกันคูณซ้ำ)
    const orderTotalExpr = fn("COALESCE", fn("SUM", col("storeOrders.grand_total_minor")), 0)
    const orderCountExpr = fn("COUNT", col("storeOrders.id"))

    // having: filter ช่วงยอดขายรวม + จำนวนออเดอร์
    const havingAnd: any[] = []
    const salesMinMinor = asMoneyMinor(salesMin)
    const salesMaxMinor = asMoneyMinor(salesMax)
    if (salesMinMinor !== null) havingAnd.push(sqlWhere(orderTotalExpr, { [Op.gte]: salesMinMinor }))
    if (salesMaxMinor !== null) havingAnd.push(sqlWhere(orderTotalExpr, { [Op.lte]: salesMaxMinor }))

    const orderCountMinInt = asInt(orderCountMin, -1)
    const orderCountMaxInt = asInt(orderCountMax, -1)
    if (orderCountMin && orderCountMinInt >= 0) havingAnd.push(sqlWhere(orderCountExpr, { [Op.gte]: orderCountMinInt }))
    if (orderCountMax && orderCountMaxInt >= 0) havingAnd.push(sqlWhere(orderCountExpr, { [Op.lte]: orderCountMaxInt }))

    // ── order by (งด sort ด้วย productCount ที่มาจาก query แยก; ใช้ createdAt/status/storeName แทน)
    const dir = String(sortDir).toUpperCase() === "ASC" ? "ASC" : "DESC"
    const orderBy: any[] = []
    if (sortBy === "status")       orderBy.push([col("Store.status"), dir])
    else if (sortBy === "storeName") orderBy.push([col("Store.store_name"), dir])
    else                            orderBy.push([col("Store.created_at"), dir])

    // ── Query แรก: รายการร้าน + aggregate ของออเดอร์ (ไม่มี products join)
    const { rows, count } = await Store.findAndCountAll({
      where: storeWhere,
      attributes: [
        "id",
        "uuid",
        ["store_name", "storeName"],
        ["email", "email"],
        ["status", "status"],
        ["created_at", "createdAt"],
        [orderTotalExpr, "orderTotalMinor"],
        [orderCountExpr, "orderCount"],
      ],
      include: [
        {
          model: User,
          as: "owner",
          required: false,
          attributes: [
            [col("first_name"), "firstName"],
            [col("last_name"),  "lastName"],
            ["email",           "email"],
          ],
        },
        {
          model: Order,
          as: "storeOrders",
          attributes: [],
          required: false,
        },
      ],
      group: ["Store.id", "owner.id"],
      having: havingAnd.length ? { [Op.and]: havingAnd } : undefined,
      order: orderBy,
      offset,
      limit: pageSize,
      distinct: true,
      subQuery: false,
    })

    // ── ดึง productCount แบบ query แยก (นับไม่ซ้ำตาม store)
    const storeIdsOnPage = rows.map((s: any) => Number(s.get("id"))).filter(Boolean)
    const productCountsRaw = storeIdsOnPage.length
      ? await Product.findAll({
          where: { storeId: { [Op.in]: storeIdsOnPage } },
          attributes: [
            ["store_id", "storeId"],
            [fn("COUNT", col("Product.id")), "productCount"],
          ],
          group: ["storeId"],
          raw: true,
        })
      : []

    const productCountMap = new Map<number, number>()
    for (const r of productCountsRaw as any[]) {
      productCountMap.set(Number(r.storeId), Number(r.productCount ?? 0))
    }

    // ── shape response
    const data = rows.map((s: any) => ({
      id:              s.get("id"),
      uuid:            s.get("uuid"),
      storeName:       s.get("storeName"),
      email:           s.get("email"),
      status:          s.get("status"),
      createdAt:       s.get("createdAt"),
      orderTotalMinor: Number(s.get("orderTotalMinor") ?? 0),
      orderCount:      Number(s.get("orderCount") ?? 0),
      productCount:    productCountMap.get(Number(s.get("id"))) ?? 0,
      ownerName:       [s.owner?.get("firstName"), s.owner?.get("lastName")].filter(Boolean).join(" "),
      ownerEmail:      s.owner?.get("email") ?? "",
    }))

    const total = Array.isArray(count) ? count.length : (count as number)
    res.json({
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (e) {
    console.error("adminListStores error:", e)
    res.status(500).json({ error: "Internal server error" })
  }
}


export async function adminSuggestStores(req: Request, res: Response) {
  try {
    const q = String(req.query.q || "").trim()
    if (!q) return res.json([])
    const t = likeify(q)
    const stores = await Store.findAll({
      where: { [Op.or]: [{ storeName: { [Op.like]: t } }, { email: { [Op.like]: t } }] },
      attributes: ["id", ["store_name", "storeName"]],
      limit: 8,
      order: [[col("Store.created_at"), "DESC"]],
    })
    res.json(stores.map((s: any) => ({ id: s.get("id"), storeName: s.get("storeName") })))
  } catch (e) {
    console.error("adminSuggestStores error:", e)
    res.status(500).json({ error: "Internal server error" })
  }
}

export async function adminGetStoreDetail(req: Request, res: Response) {
  try {
    const id = Number((req.params as { id: string }).id)
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" })

    // Store + owner + productCount + order aggregates (sum/count)
    const s: any = await Store.findOne({
      where: { id },
      include: [
        { model: User, as: "owner", required: false, attributes: [[col("first_name"), "firstName"], [col("last_name"), "lastName"], ["email", "email"]] },
        { model: Product, as: "products", attributes: [], required: false },
        { model: Order, as: "storeOrders",
          attributes: [],
          required: false,
          // include: [{
          //   model: OrderItem, as: "items",
          //   attributes: [
          //     "productId", "productName", "uuid"
          //   ],
          //   required: false
          // }]
        },
      ],
      attributes: [
        "id",
        "uuid",
        ["store_name", "storeName"],
        ["email", "email"],
        ["status", "status"],
        ["created_at", "createdAt"],
        [fn("COUNT", fn("DISTINCT", col("products.id"))), "productCount"],
        [fn("COALESCE", fn("SUM", col("storeOrders.grand_total_minor")), 0), "orderTotalMinor"],
        [fn("COUNT", col("storeOrders.id")), "orderCount"],
      ],
      group: ["Store.id", "owner.id"],
    })
    if (!s) return res.status(404).json({ error: "Not found" })

    // Summary (orders)
    const [agg] = (await Order.findAll({
      where: { storeId: id },
      attributes: [
        [fn("COUNT", col("Order.id")), "totalOrders"],
        [fn("COALESCE", fn("SUM", col("Order.grand_total_minor")), 0), "totalSalesMinor"],
        [fn("COALESCE", fn("AVG", col("Order.grand_total_minor")), 0), "averageOrderMinor"],
        [fn("MAX", col("Order.created_at")), "lastOrderAt"],
      ],
      raw: true,
    })) as any[] || [{ totalOrders: 0, totalSalesMinor: 0, averageOrderMinor: 0, lastOrderAt: null }]

    // Monthly sales (ใช้ DATE_FORMAT สำหรับ MySQL)
    const monthExpr = fn("DATE_FORMAT", col("Order.created_at"), "%Y-%m")
    const monthlyRaw = await Order.findAll({
      where: { storeId: id },
      attributes: [
        [monthExpr, "month"],
        [fn("COALESCE", fn("SUM", col("Order.grand_total_minor")), 0), "totalSalesMinor"],
        [fn("COUNT", col("Order.id")), "orderCount"],
      ],
      group: [monthExpr as any],
      order: [[monthExpr as any, "DESC"]],
      limit: 18,
      raw: true,
    })
    const monthlyMap = new Map<string, { totalSalesMinor: number; orderCount: number }>()
    for (const r of monthlyRaw as any[]) {
      monthlyMap.set(String(r.month), {
        totalSalesMinor: Number(r.totalSalesMinor ?? 0),
        orderCount: Number(r.orderCount ?? 0),
      })
    }
    const labels = lastNMonthsLabels(12)
    const monthly = labels.map((label) => ({
      month: label,
      totalSalesMinor: monthlyMap.get(label)?.totalSalesMinor ?? 0,
      orderCount: monthlyMap.get(label)?.orderCount ?? 0,
    }))

    // Recent orders (รวม customer + items(product))
    const recentOrders = await Order.findAll({
      where: { storeId: id },
      include: [
        {
          model: CheckOut,
          as: "checkout",
          required: true,
          attributes: [
            "orderCode"
          ],
          include: [
            {
              model: User,
              as: "customer",
              required: true,
              attributes: [
                "id",
                [col("first_name"), "firstName"],
                [col("last_name"), "lastName"],
                ["email", "email"],
              ],
            },
          ],
        },
      ],
      attributes: [
        "id",
        "reference",
        "status",
        ["grand_total_minor", "grandTotalMinor"],
        ["currency_code", "currencyCode"],
        ["created_at", "createdAt"],
      ],
      order: [[col("Order.created_at"), "DESC"]],
      limit: 10,
    })

    // ดึง items แยกเพื่อ map เข้าออเดอร์
    const recentOrderIds = recentOrders.map((o: any) => o.get("id"))
    const recentItems = await OrderItem.findAll({
      where: { orderId: recentOrderIds },
      include: [
        {
          model: Product, as: "product",
            required: false,
            attributes: ["id", "uuid", "name"]
        },
      ],
      attributes: ["orderId"],
      limit: 200, // เผื่อ
    })

    const itemsByOrder = new Map<number, Array<{ productId: number; productName: string; uuid: string }>>()
    for (const it of recentItems as any[]) {
      const oid = Number(it.get("orderId"))
      const list = itemsByOrder.get(oid) ?? []
      if (it.product) {
        list.push({
          productId: it.product.get("id"),
          productName: it.product.get("name"),
          uuid: it.product.get("uuid")})
      }
      itemsByOrder.set(oid, list)
    }

    const detail = {
      id: s.get("id"),
      uuid: s.get("uuid"),
      storeName: s.get("storeName"),
      email: s.get("email"),
      status: s.get("status"),
      createdAt: s.get("createdAt"),
      productCount: Number(s.get("productCount") ?? 0),
      orderTotalMinor: Number(s.get("orderTotalMinor") ?? 0),
      orderCount: Number(s.get("orderCount") ?? 0),
      ownerName: [s.owner?.get("firstName"), s.owner?.get("lastName")].filter(Boolean).join(" "),
      ownerEmail: s.owner?.get("email") ?? "",
      orders: {
        summary: {
          totalOrders: Number(agg?.totalOrders ?? 0),
          totalSalesMinor: Number(agg?.totalSalesMinor ?? 0),
          averageOrderMinor: Number(agg?.averageOrderMinor ?? 0),
          lastOrderAt: agg?.lastOrderAt ?? null,
        },
        monthly,
        latest: recentOrders.map((o: any) => {
          const customer = (o as any).checkout?.customer
          const customerName = [customer?.get("firstName"), customer?.get("lastName")].filter(Boolean).join(" ")
          return {
            id: o.get("id"),
            reference: o.get("reference"),
            orderCode: o.checkout.get("orderCode"),
            status: o.get("status"),
            grandTotalMinor: Number(o.get("grandTotalMinor") ?? 0),
            currencyCode: o.get("currencyCode"),
            createdAt: o.get("createdAt"),
            customer: {
              id: customer?.get("id"),
              name: customerName,
              email: customer?.get("email"),
            },
            items: (itemsByOrder.get(Number(o.get("id"))) ?? []).slice(0, 5),
          }
        }),
      },
    }

    res.json(detail)
  } catch (e) {
    console.error("adminGetStoreDetail error:", e)
    res.status(500).json({ error: "Internal server error" })
  }
}

export async function adminApproveStore(req: Request, res: Response) {
  try {
    const id = Number((req.params as { id: string }).id)
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" })

    // เช็คสถานะปัจจุบันก่อน (เพื่อง่ายต่อการแจ้งข้อความที่ถูกต้อง)
    const existing: any = await Store.findOne({
      where: { id },
      attributes: ["id", "uuid", ["store_name", "storeName"], "email", "status", ["created_at", "createdAt"]],
    })
    if (!existing) return res.status(404).json({ error: "Not found" })

    const currentStatus = String(existing.get("status")) as StoreStatus
    if (currentStatus === StoreStatus.BANNED) {
      return res.status(409).json({ error: "Store is BANNED and cannot be approved" })
    }
    if (currentStatus === StoreStatus.APPROVED) {
      // idempotent: อนุมัติแล้ว ไม่ต้องทำซ้ำ
      return res.status(200).json({
        message: "Store already approved",
        store: {
          id: existing.get("id"),
          uuid: existing.get("uuid"),
          storeName: existing.get("storeName"),
          email: existing.get("email"),
          status: existing.get("status"),
          createdAt: existing.get("createdAt"),
        },
      })
    }

    // อัปเดตแบบมีเงื่อนไขเพื่อกัน race (จะอัปเดตได้เฉพาะเมื่อยังเป็น PENDING)
    const [affected] = await Store.update(
      { status: StoreStatus.APPROVED },
      { where: { id, status: StoreStatus.PENDING } }
    )

    if (affected === 0) {
      // เกิด race หรือสถานะถูกเปลี่ยนก่อนหน้า ลองอ่านใหม่เพื่อรายงานที่ถูกต้อง
      const after: any = await Store.findOne({
        where: { id },
        attributes: ["id", "uuid", ["store_name", "storeName"], "email", "status", ["created_at", "createdAt"]],
      })
      if (!after) return res.status(404).json({ error: "Not found" })

      const st = String(after.get("status")) as StoreStatus
      if (st === StoreStatus.APPROVED) {
        return res.status(200).json({
          message: "Store already approved",
          store: {
            id: after.get("id"),
            uuid: after.get("uuid"),
            storeName: after.get("storeName"),
            email: after.get("email"),
            status: after.get("status"),
            createdAt: after.get("createdAt"),
          },
        })
      }
      if (st === StoreStatus.BANNED) {
        return res.status(409).json({ error: "Store is BANNED and cannot be approved" })
      }
      // ยังเป็น PENDING แต่ update ไม่ผ่าน (ไม่น่าเกิด แต่กันเผื่อ)
      return res.status(409).json({ error: "Store status is not eligible for approval" })
    }

    // อัปเดตสำเร็จ: อ่านค่าหลังอัปเดตเพื่อตอบกลับ
    const updated: any = await Store.findOne({
      where: { id },
      attributes: ["id", "uuid", ["store_name", "storeName"], "email", "status", ["created_at", "createdAt"]],
    })

    return res.status(200).json({
      message: "Store approved",
      store: {
        id: updated?.get("id"),
        uuid: updated?.get("uuid"),
        storeName: updated?.get("storeName"),
        email: updated?.get("email"),
        status: updated?.get("status"),
        createdAt: updated?.get("createdAt"),
      },
    })
  } catch (e) {
    console.error("adminApproveStore error:", e)
    return res.status(500).json({ error: "Internal server error" })
  }
}