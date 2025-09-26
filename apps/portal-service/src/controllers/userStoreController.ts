// apps/gateway/src/controllers/adminUsersStores.ts
import { Request, Response } from "express"
import { Op, col, fn, literal, WhereOptions } from "sequelize"
import { User } from "@digishop/db/src/models/User"
import { Store } from "@digishop/db/src/models/Store"
import { Product } from "@digishop/db/src/models/Product"

const asInt = (v: any, d: number) => {
  const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.floor(n) : d
}
const asDate = (v?: string) => v && !Number.isNaN(new Date(v).getTime()) ? new Date(v) : null
const likeify = (q: string) => `%${q.replace(/[%_]/g, "\\$&")}%`

// ───────────────────────── Users
export async function adminListUsers(req: Request, res: Response) {
  try {
    const { q = "", dateFrom, dateTo, sortBy = "createdAt", sortDir = "desc" } = req.query as Record<string, string | undefined>
    const page = Math.max(asInt(req.query.page, 1), 1)
    const pageSize = Math.min(Math.max(asInt(req.query.pageSize, 20), 1), 100)
    const offset = (page - 1) * pageSize

    const where: WhereOptions = {}
    const from = asDate(dateFrom); const to = asDate(dateTo)
    if (from && to) where["createdAt" as any] = { [Op.between]: [from, to] }
    else if (from) where["createdAt" as any] = { [Op.gte]: from }
    else if (to) where["createdAt" as any] = { [Op.lte]: to }

    if (q && q.trim()) {
      const t = likeify(q.trim())
      Object.assign(where, {
        [Op.or]: [
          { email: { [Op.like]: t } },
          { firstName: { [Op.like]: t } },
          { lastName: { [Op.like]: t } },
        ]
      })
    }

    const dir = String(sortDir).toUpperCase() === "ASC" ? "ASC" : "DESC"
    const orderBy: any[] = []
    if (sortBy === "name") orderBy.push([col("User.first_name"), dir], [col("User.last_name"), dir])
    else if (sortBy === "email") orderBy.push([col("User.email"), dir])
    else orderBy.push([col("User.created_at"), dir])

    const include = [
      { model: Store, as: "store",
        required: false,
        attributes: [
          "id",
          "uuid",
          "storeName",
          "status"
        ]
      }
    ]

    const { rows, count } = await User.findAndCountAll({
      where,
      include,
      offset,
      limit: pageSize,
      order: orderBy,
      distinct: true,
      attributes: [
        "id",
        ["email","email"],
        [col("first_name"),"firstName"],
        [col("last_name"),"lastName"],
        ["created_at","createdAt"],
      ],
      subQuery: false,
    })

    const data = rows.map((u: any) => ({
      id: u.get("id"),
      name: [u.get("firstName"), u.get("lastName")].filter(Boolean).join(" "),
      email: u.get("email"),
      createdAt: u.get("createdAt"),
      store: u.store ? {
        id: u.store.get("id"),
        uuid: u.store.get("uuid"),
        storeName: u.store.get("storeName"),
        status: u.store.get("status"),
      } : null
    }))

    const total = Array.isArray(count) ? count.length : (count as number)
    res.json({ data, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } })
  } catch (e) {
    console.error("adminListUsers error:", e)
    res.status(500).json({ error: "Internal server error" })
  }
}

export async function adminSuggestUsers(req: Request, res: Response) {
  try {
    const q = String(req.query.q || "").trim()
    if (!q) return res.json([])
    const t = likeify(q)
    const users = await User.findAll({
      where: { [Op.or]: [{ email: { [Op.like]: t } }, { firstName: { [Op.like]: t } }, { lastName: { [Op.like]: t } }] },
      attributes: ["id", ["email","email"], [col("first_name"),"firstName"], [col("last_name"),"lastName"]],
      limit: 8, order: [["created_at", "DESC"]],
    })
    res.json(users.map((u: any) => ({
      id: u.get("id"),
      name: [u.get("firstName"), u.get("lastName")].filter(Boolean).join(" "),
      email: u.get("email"),
    })))
  } catch (e) {
    console.error("adminSuggestUsers error:", e)
    res.status(500).json({ error: "Internal server error" })
  }
}

export async function adminGetUserDetail(req: Request, res: Response) {
  try {
    const id = Number((req.params as { id: string }).id)
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" })

    const u: any = await User.findOne({
      where: { id },
      include: [{ model: Store, as: "store", required: false, attributes: ["id","uuid",["store_name","storeName"], ["status","status"]] }],
      attributes: ["id", ["email","email"], [col("first_name"),"firstName"], [col("last_name"),"lastName"], ["created_at","createdAt"]],
    })
    if (!u) return res.status(404).json({ error: "Not found" })

    res.json({
      id: u.get("id"),
      name: [u.get("firstName"), u.get("lastName")].filter(Boolean).join(" "),
      email: u.get("email"),
      createdAt: u.get("createdAt"),
      store: u.store ? {
        id: u.store.get("id"),
        uuid: u.store.get("uuid"),
        storeName: u.store.get("storeName"),
        status: u.store.get("status"),
      } : null,
    })
  } catch (e) {
    console.error("adminGetUserDetail error:", e)
    res.status(500).json({ error: "Internal server error" })
  }
}

// ───────────────────────── Stores (Merchants)
export async function adminListStores(req: Request, res: Response) {
  try {
    const { q = "", status, dateFrom, dateTo, sortBy = "createdAt", sortDir = "desc" } = req.query as Record<string, string | undefined>
    const page = Math.max(asInt(req.query.page, 1), 1)
    const pageSize = Math.min(Math.max(asInt(req.query.pageSize, 20), 1), 100)
    const offset = (page - 1) * pageSize

    const where: WhereOptions = {}
    if (status && status.trim()) where["status" as any] = status

    const from = asDate(dateFrom); const to = asDate(dateTo)
    if (from && to) where["createdAt" as any] = { [Op.between]: [from, to] }
    else if (from) where["createdAt" as any] = { [Op.gte]: from }
    else if (to) where["createdAt" as any] = { [Op.lte]: to }

    if (q && q.trim()) {
      const t = likeify(q.trim())
      Object.assign(where, {
        [Op.and]: [{ [Op.or]: [{ storeName: { [Op.like]: t } }, { email: { [Op.like]: t } }] }]
      })
    }

    const dir = String(sortDir).toUpperCase() === "ASC" ? "ASC" : "DESC"
    const orderBy: any[] = []
    if (sortBy === "status") orderBy.push([col("Store.status"), dir])
    else if (sortBy === "storeName") orderBy.push([col("Store.store_name"), dir])
    else orderBy.push([col("Store.created_at"), dir])

    const include = [
      { model: User, as: "owner",
      required: false,
      attributes: [
        "firstName",
        "lastName", 
        "email"
      ]
    },
      { model: Product, as: "products", attributes: [], required: false },
    ]

    const { rows, count } = await Store.findAndCountAll({
      where,
      include,
      attributes: [
        "id", "uuid", ["store_name","storeName"], ["email","email"], ["status","status"], ["created_at","createdAt"],
        [fn("COUNT", col("products.id")), "productCount"],
      ],
      group: ["Store.id", "owner.id"],  // group for COUNT
      order: orderBy,
      offset, limit: pageSize, distinct: true, subQuery: false,
    })

    const data = rows.map((s: any) => ({
      id: s.get("id"),
      uuid: s.get("uuid"),
      storeName: s.get("storeName"),
      email: s.get("email"),
      status: s.get("status"),
      createdAt: s.get("createdAt"),
      productCount: Number(s.get("productCount") ?? 0),
      ownerName: [s.owner?.get("firstName"), s.owner?.get("lastName")].filter(Boolean).join(" "),
      ownerEmail: s.owner?.get("email") ?? "",
    }))

    const total = Array.isArray(count) ? count.length : (count as number)
    res.json({ data, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } })
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
      attributes: ["id", ["store_name","storeName"]],
      limit: 8, order: [["created_at", "DESC"]],
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

    const s: any = await Store.findOne({
      where: { id },
      include: [
        { model: User, as: "owner", required: false, attributes: [[col("first_name"),"firstName"], [col("last_name"),"lastName"], ["email","email"]] },
        { model: Product, as: "products", attributes: [], required: false },
      ],
      attributes: [
        "id", "uuid", ["store_name","storeName"], ["email","email"], ["status","status"], ["created_at","createdAt"],
        [fn("COUNT", col("products.id")), "productCount"],
      ],
      group: ["Store.id", "owner.id"],
    })
    if (!s) return res.status(404).json({ error: "Not found" })

    res.json({
      id: s.get("id"),
      uuid: s.get("uuid"),
      storeName: s.get("storeName"),
      email: s.get("email"),
      status: s.get("status"),
      createdAt: s.get("createdAt"),
      productCount: Number(s.get("productCount") ?? 0),
      ownerName: [s.owner?.get("firstName"), s.owner?.get("lastName")].filter(Boolean).join(" "),
      ownerEmail: s.owner?.get("email") ?? "",
    })
  } catch (e) {
    console.error("adminGetStoreDetail error:", e)
    res.status(500).json({ error: "Internal server error" })
  }
}
