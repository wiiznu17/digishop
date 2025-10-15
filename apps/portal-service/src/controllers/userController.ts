import { Address, CheckOut, Dispute, Order, Review, Store, User } from "@digishop/db"
import { Request, Response } from "express"
import {
  Op,
  col,
  fn,
  where as sequelizeWhere,
  WhereOptions,
} from "sequelize"

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────

const asInt = (value: any, defaultValue: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : defaultValue
}

const asDate = (value?: string) => {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

const likeify = (q: string) => `%${q.replace(/[%_]/g, "\\$&")}%`

const asMoneyMinor = (value: any) => {
  if (value === undefined || value === null || value === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : null
}

/** คืน array ของ label เดือนแบบ YYYY-MM ย้อนหลัง n เดือน (นับรวมเดือนนี้) */
function lastNMonthsLabels(n: number) {
  const result: string[] = []
  const base = new Date()
  base.setDate(1) // normalize เป็นต้นเดือน

  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base)
    d.setMonth(d.getMonth() - i)
    const y = d.getFullYear()
    const m = `${d.getMonth() + 1}`.padStart(2, "0")
    result.push(`${y}-${m}`)
  }
  return result
}

// ───────────────────────────────────────────────────────────────────────────────
// Users: List
//  - ค้นหา (q)
//  - ช่วงวันที่สร้าง (dateFrom/dateTo)
//  - กรองยอดใช้จ่ายรวม (spentMin/spentMax) ด้วย HAVING
//  - จัดเรียง (createdAt/name/email)
//  - รวมยอด/นับออเดอร์ด้วย JOIN + GROUP BY (ไม่ใช้ literal/subquery)
// ───────────────────────────────────────────────────────────────────────────────

export async function adminListUsers(req: Request, res: Response) {
  try {
    const {
      q = "",
      dateFrom,
      dateTo,
      sortBy = "createdAt",
      sortDir = "desc",
    } = req.query as Record<string, string | undefined>

    const page = Math.max(asInt(req.query.page, 1), 1)
    const pageSize = Math.min(Math.max(asInt(req.query.pageSize, 20), 1), 100)
    const offset = (page - 1) * pageSize

    // --- where หลักจากวันที่/keyword
    const whereClause: WhereOptions = {}

    const from = asDate(dateFrom)
    const to = asDate(dateTo)
    if (from && to) whereClause["createdAt" as any] = { [Op.between]: [from, to] }
    else if (from) whereClause["createdAt" as any] = { [Op.gte]: from }
    else if (to) whereClause["createdAt" as any] = { [Op.lte]: to }

    if (q && q.trim()) {
      const term = likeify(q.trim())
      Object.assign(whereClause, {
        [Op.or]: [
          { email: { [Op.like]: term } },
          { firstName: { [Op.like]: term } },
          { lastName: { [Op.like]: term } },
        ],
      })
    }

    // --- filter ช่วงยอดรวม (minor units) ด้วย HAVING
    const spentMinMinor = asMoneyMinor(req.query.spentMin)
    const spentMaxMinor = asMoneyMinor(req.query.spentMax)

    // SUM(grand_total_minor) ผ่าน association: User -> CheckOut(as: "checkout") -> Order(as: "orders")
    const orderSumExpression = fn(
      "COALESCE",
      fn("SUM", col("checkout->orders.grand_total_minor")),
      0
    )

    const havingAnd: any[] = []
    if (spentMinMinor !== null) {
      havingAnd.push(sequelizeWhere(orderSumExpression, { [Op.gte]: spentMinMinor }))
    }
    if (spentMaxMinor !== null) {
      havingAnd.push(sequelizeWhere(orderSumExpression, { [Op.lte]: spentMaxMinor }))
    }

    const orderCountExpression = fn("COUNT", col("checkout->orders.id"))

    // --- sort
    const direction = String(sortDir).toUpperCase() === "ASC" ? "ASC" : "DESC"
    const orderBy: any[] = []
    if (sortBy === "name") {
      orderBy.push([col("User.first_name"), direction], [col("User.last_name"), direction])
    } else if (sortBy === "email") {
      orderBy.push([col("User.email"), direction])
    } else {
      orderBy.push([col("User.created_at"), direction]) // createdAt (default)
    }

    // --- query หลัก
    const { rows, count } = await User.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Store,
          as: "store",
          required: false,
          attributes: [
            "id",
            "uuid",
            "storeName",
            "status",
          ],
        },
        {
          model: CheckOut,
          as: "checkout",
          required: false,
          attributes: [],
          include: [
            {
              model: Order,
              as: "orders",
              required: false,
              attributes: [],
            },
          ],
        },
      ],
      attributes: [
        "id",
        [col("User.email"), "email"],
        [col("User.first_name"), "firstName"],
        [col("User.last_name"), "lastName"],
        [col("User.created_at"), "createdAt"],

        [orderSumExpression, "orderTotalMinor"],
        [orderCountExpression, "orderCount"],
      ],
      group: [
        // ต้องระบุทุกคอลัมน์ที่ไม่ใช่ aggregate เมื่อ ONLY_FULL_GROUP_BY เปิด
        col("User.id"),
        col("User.email"),
        col("User.first_name"),
        col("User.last_name"),
        col("User.created_at"),

        // คอลัมน์จาก Store ที่ select มา
        col("store.id"),
        col("store.uuid"),
        col("store.store_name"),
        col("store.status"),
      ],
      having: havingAnd.length ? { [Op.and]: havingAnd } : undefined,
      order: orderBy,
      limit: pageSize,
      offset,
      subQuery: false,
      distinct: true,
      // raw: false (default) เพื่อให้รวม include เป็น instance (u.store)
    })
    console.log("adminListUsers: rows", rows.length, "count:", count)
    const data = rows.map((u: any) => ({
      id: u.get("id"),
      name: [u.get("firstName"), u.get("lastName")].filter(Boolean).join(" "),
      email: u.get("email"),
      createdAt: u.get("createdAt"),

      orderTotalMinor: Number(u.get("orderTotalMinor") ?? 0),
      orderCount: Number(u.get("orderCount") ?? 0),

      store: u.store
        ? {
            id: u.store.get("id"),
            uuid: u.store.get("uuid"),
            storeName: u.store.get("storeName"),
            status: u.store.get("status"),
          }
        : null,
    }))

    const total = Array.isArray(count) ? count.length : (count as number)

    res.json({
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    })
  } catch (error) {
    console.error("adminListUsers error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Users: Suggest
// ───────────────────────────────────────────────────────────────────────────────

export async function adminSuggestUsers(req: Request, res: Response) {
  try {
    const queryText = String(req.query.q || "").trim()
    if (!queryText) return res.json([])

    const term = likeify(queryText)

    const users = await User.findAll({
      where: {
        [Op.or]: [
          { email: { [Op.like]: term } },
          { firstName: { [Op.like]: term } },
          { lastName: { [Op.like]: term } },
        ],
      },
      attributes: [
        "id",
        ["email", "email"],
        [col("first_name"), "firstName"],
        [col("last_name"), "lastName"],
      ],
      limit: 8,
      order: [[col("created_at"), "DESC"]],
    })

    res.json(
      users.map((u: any) => ({
        id: u.get("id"),
        name: [u.get("firstName"), u.get("lastName")].filter(Boolean).join(" "),
        email: u.get("email"),
      }))
    )
  } catch (error) {
    console.error("adminSuggestUsers error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Users: Detail (+ Summary, Latest Orders, Monthly Spend 12 เดือนล่าสุด - MySQL)
// ───────────────────────────────────────────────────────────────────────────────

export async function adminGetUserDetail(req: Request, res: Response) {
  try {
    const id = Number((req.params as { id: string }).id)
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" })

    // --- User + Store (ถ้ามี)
    const userRow: any = await User.findOne({
      where: { id },
      include: [
        {
          model: Store,
          as: "store",
          required: false,
          attributes: [
            "id",
            "uuid",
            ["store_name", "storeName"],
            ["status", "status"],
          ],
        },
      ],
      attributes: [
        "id",
        ["email", "email"],
        [col("first_name"), "firstName"],
        [col("last_name"), "lastName"],
        ["created_at", "createdAt"],
      ],
    })

    if (!userRow) return res.status(404).json({ error: "Not found" })

    // --- Addresses
    const addressRows = await Address.findAll({
      where: { userId: id },
      attributes: [
        "id",
        "recipientName",
        "phone",
        "addressNumber",
        "building",
        "subStreet",
        "street",
        "subdistrict",
        "district",
        "province",
        "postalCode",
        "country",
        "isDefault",
        "addressType",
        ["created_at", "createdAt"],
      ],
      order: [
        [col("is_default"), "DESC"],
        [col("created_at"), "DESC"],
      ],
    })

    // --- Summary (count/sum/avg/last) สำหรับออเดอร์ของลูกค้าคนนี้
    const [summary] =
      ((await Order.findAll({
        include: [
          {
            model: CheckOut,
            as: "checkout",
            required: true,
            attributes: [],
            where: { customerId: id },
          },
        ],
        attributes: [
          [fn("COUNT", col("Order.id")), "totalOrders"],
          [fn("COALESCE", fn("SUM", col("Order.grand_total_minor")), 0), "totalSpentMinor"],
          [fn("COALESCE", fn("AVG", col("Order.grand_total_minor")), 0), "averageOrderMinor"],
          [fn("MAX", col("Order.created_at")), "lastOrderAt"],
        ],
        raw: true,
      })) as any[]) || [{ totalOrders: 0, totalSpentMinor: 0, averageOrderMinor: 0, lastOrderAt: null }]

    // --- Latest orders
    const latestOrders = await Order.findAll({
      include: [
        {
          model: CheckOut,
          as: "checkout",
          required: true,
          attributes: [
            "orderCode"
          ],
          where: { customerId: id },
        },
      ],
      attributes: [
        "id",
        "reference",
        "status",
        "grandTotalMinor",
        "currencyCode",
        "storeNameSnapshot",
        ["created_at", "createdAt"],
      ],
      order: [[col("Order.created_at"), "DESC"]],
      limit: 10,
    })

    // --- Monthly spend (12 เดือนล่าสุด) — MySQL: DATE_FORMAT(created_at, '%Y-%m')
    const monthExpression = fn("DATE_FORMAT", col("Order.created_at"), "%Y-%m")

    const monthlyAggregateRows = await Order.findAll({
      include: [
        {
          model: CheckOut,
          as: "checkout",
          required: true,
          attributes: [],
          where: { customerId: id },
        },
      ],
      attributes: [
        [monthExpression, "month"],
        [fn("COALESCE", fn("SUM", col("Order.grand_total_minor")), 0), "totalSpentMinor"],
        [fn("COUNT", col("Order.id")), "orderCount"],
      ],
      group: [monthExpression],
      order: [[monthExpression, "DESC"]],
      limit: 18, // ดึงเผื่อไว้แล้วไป normalize ให้เหลือ 12 เดือนหลัง
      raw: true,
    })

    // สร้าง map: "YYYY-MM" -> { totalSpentMinor, orderCount }
    const monthlyMap = new Map<string, { totalSpentMinor: number; orderCount: number }>()
    for (const r of monthlyAggregateRows as any[]) {
      monthlyMap.set(String(r.month), {
        totalSpentMinor: Number(r.totalSpentMinor ?? 0),
        orderCount: Number(r.orderCount ?? 0),
      })
    }

    // ให้ครบ 12 เดือนย้อนหลัง (ไม่มีข้อมูลให้เป็น 0)
    const monthLabels = lastNMonthsLabels(12)
    const monthly = monthLabels.map((label) => ({
      month: label,
      totalSpentMinor: monthlyMap.get(label)?.totalSpentMinor ?? 0,
      orderCount: monthlyMap.get(label)?.orderCount ?? 0,
    }))

    // --- Counters: reviews, disputes
    const [reviewsCount, disputesCount] = await Promise.all([
      Review.count({ where: { userId: id } }),
      Dispute.count({ where: { customerId: id } }),
    ])

    // --- Response
    res.json({
      id: userRow.get("id"),
      name: [userRow.get("firstName"), userRow.get("lastName")].filter(Boolean).join(" "),
      email: userRow.get("email"),
      createdAt: userRow.get("createdAt"),

      orderTotalMinor: Number(summary?.totalSpentMinor ?? 0),
      orderCount: Number(summary?.totalOrders ?? 0),

      store: userRow.store
        ? {
            id: userRow.store.get("id"),
            uuid: userRow.store.get("uuid"),
            storeName: userRow.store.get("storeName"),
            status: userRow.store.get("status"),
          }
        : null,

      addresses: addressRows.map((a: any) => ({
        id: a.get("id"),
        recipientName: a.get("recipientName"),
        phone: a.get("phone"),
        addressNumber: a.get("addressNumber"),
        building: a.get("building"),
        subStreet: a.get("subStreet"),
        street: a.get("street"),
        subdistrict: a.get("subdistrict"),
        district: a.get("district"),
        province: a.get("province"),
        postalCode: a.get("postalCode"),
        country: a.get("country"),
        isDefault: a.get("isDefault"),
        addressType: a.get("addressType"),
        createdAt: a.get("createdAt"),
      })),

      orders: {
        summary: {
          totalOrders: Number(summary?.totalOrders ?? 0),
          totalSpentMinor: Number(summary?.totalSpentMinor ?? 0),
          averageOrderMinor: Number(summary?.averageOrderMinor ?? 0),
          lastOrderAt: summary?.lastOrderAt ?? null,
        },
        latest: latestOrders.map((o: any) => ({
          id: o.get("id"),
          reference: o.get("reference"),
          orderCode: o.checkout?.get("orderCode"),
          status: o.get("status"),
          grandTotalMinor: Number(o.get("grandTotalMinor") ?? 0),
          currencyCode: o.get("currencyCode"),
          storeNameSnapshot: o.get("storeNameSnapshot"),
          createdAt: o.get("createdAt"),
        })),
        monthly,
      },

      reviewsCount,
      disputesCount,
    })
  } catch (error) {
    console.error("adminGetUserDetail error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}
