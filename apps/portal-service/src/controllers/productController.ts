// apps/portal-service/src/controllers/adminProductController.ts
import { Request, Response } from "express"
import { Op, sequelize } from "@digishop/db/src/db"
import {
  col, fn,
  where as sqWhere,
  type Order, type OrderItem
} from "sequelize"

import { Product, ProductAttributes } from "@digishop/db/src/models/Product"
import { ProductImage } from "@digishop/db/src/models/ProductImage"
import { Category } from "@digishop/db/src/models/Category"
import { Variation } from "@digishop/db/src/models/Variation"
import { VariationOption } from "@digishop/db/src/models/VariationOption"
import { ProductItem } from "@digishop/db/src/models/ProductItem"
import { ProductConfiguration } from "@digishop/db/src/models/ProductConfiguration"
import { ProductItemImage } from "@digishop/db/src/models/ProductItemImage"
import { Store } from "@digishop/db/src/models/Store"
import { ProductReqStatus } from "@digishop/db/src/types/enum"

const asInt = (v: any, d: number) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : d
}

const LIKE = (raw: string) => `%${raw.replace(/[%_]/g, "\\$&")}%`

function toReqStatus(v: unknown): ProductReqStatus | null {
  if (v === "APPROVED") return ProductReqStatus.APPROVED
  if (v === "REJECT") return ProductReqStatus.REJECT
  return null
}

// --- helper: หา id ของ category ลูกทุกชั้น ---
async function collectCategoryDescendantIds(rootUuid: string): Promise<number[]> {
  // ดึง id/uuid/parentId ทั้งหมดมาก่อน (cache ได้ในอนาคต)
  const cats = await Category.findAll({
    attributes: ["id", "uuid", "parentId"],
    order: [["name", "ASC"]]
  })
  const byUuid = new Map(cats.map(c => [c.uuid, c]))
  const byParent = new Map<number | null, number[]>()
  for (const c of cats) {
    const arr = byParent.get(c.parentId ?? null) ?? []
    arr.push(c.id)
    byParent.set(c.parentId ?? null, arr)
  }

  const root = byUuid.get(rootUuid)
  if (!root) return [] // ไม่พบ ก็ส่งว่าง (จะไม่มีผลลัพธ์)

  const result: number[] = []
  const q: number[] = [root.id]
  while (q.length) {
    const cur = q.shift()!
    result.push(cur)
    const children = byParent.get(cur) ?? []
    q.push(...children)
  }
  return result
}

/**
 * GET /admin/products/list
 */
export async function adminListProducts(req: Request, res: Response) {
  try {
    const {
      q,
      categoryUuid,
      reqStatus,
      status,
      sortBy = "createdAt",
      sortDir = "desc",
    } = req.query as Record<string, string | undefined>
    const inStockParam = req.query.inStock as string | undefined

    const page = Math.max(asInt(req.query.page, 1), 1)
    const pageSize = Math.min(Math.max(asInt(req.query.pageSize, 20), 1), 100)
    const offset = (page - 1) * pageSize
    const limit = pageSize

    // ===== WHERE (เฉพาะ field บนตาราง Product) =====
    const whereProduct: any = {}
    if (status) whereProduct.status = status
    if (reqStatus) whereProduct.reqStatus = reqStatus

    // ===== include =====
    const include: any[] = []

    // 1) store (required: false) — ใช้สำหรับ search เฉพาะชื่อร้าน
    include.push({
      model: Store,
      as: "store",
      attributes: ["id", "uuid", ["store_name", "storeName"], "email", "status"],
      required: false,
    })

    // 2) category (ดึงเพื่อแสดงชื่อ) — filter ลูกทุกชั้นทำผ่าน whereProduct.categoryId
    include.push({
      model: Category,
      as: "category",
      attributes: ["id", "uuid", "name"],
      required: false,
    })

    // 3) main image (thumb) — ไม่ aggregate, แค่ดึงภาพปก
    include.push({
      model: ProductImage,
      as: "images",
      separate: true,
      attributes: ["uuid", "url", "fileName", "isMain", "sortOrder", "createdAt"],
      where: { isMain: true },
      required: false,
      limit: 1,
      order: [
        ["sortOrder", "ASC"],
        ["createdAt", "ASC"],
      ],
    })

    // 4) items — ใช้คำนวณ minPrice / totalStock (เฉพาะ isEnable=true)
    include.push({
      model: ProductItem,
      as: "items",
      attributes: [],
      required: false,
      where: { isEnable: true },
    })

    // ====== Search ด้วย "ชื่อร้าน" เท่านั้น ======
    // ใช้ sqWhere + col กับ include: store
    if (q && q.trim()) {
      const like = LIKE(q.trim())
      // NOTE: ใช้ AND กับ whereProduct (ไม่ยัดใน OR รวมชื่อสินค้า/sku อีกต่อไป)
      whereProduct[Op.and] = [
        sqWhere(col("store.store_name"), { [Op.like]: like }),
      ]
    }

    // ===== Aggregate จาก items =====
    const sumStockExpr = fn("COALESCE", fn("SUM", col("items.stock_quantity")), 0)
    const minPriceExpr = fn("MIN", col("items.price_minor"))

    // ===== Filter category เป็น “descendants ทั้งหมด” =====
    if (categoryUuid) {
      const ids = await collectCategoryDescendantIds(categoryUuid)
      if (ids.length === 0) {
        return res.json({
          data: [],
          meta: { page, pageSize, total: 0, totalPages: 0 }
        })
      }
      whereProduct.categoryId = { [Op.in]: ids }
    }

    // HAVING (inStock)
    let having: any | undefined
    if (inStockParam === "true")  having = sqWhere(sumStockExpr, { [Op.gt]: 0 })
    if (inStockParam === "false") having = sqWhere(sumStockExpr, { [Op.eq]: 0 })

    // ORDER
    const sortable = new Set(["createdAt", "updatedAt", "name", "price"])
    const orderCol = sortable.has(sortBy) ? (sortBy as string) : "createdAt"
    const orderDir: "ASC" | "DESC" = String(sortDir).toUpperCase() === "ASC" ? "ASC" : "DESC"
    const defaultOrder: OrderItem = [orderCol, orderDir]
    const priceOrder: OrderItem = [col("minPriceMinor"), orderDir]
    const order: Order = [orderCol === "price" ? priceOrder : defaultOrder]

    // GROUP BY (ให้พอสำหรับ select ที่ไม่ aggregate)
    const group = [
      col("Product.id"),
      col("category.id"),
      col("category.uuid"),
      col("category.name"),
      col("store.id"),
      col("store.uuid"),
      col("store.store_name"),
      col("store.email"),
      col("store.status"),
    ]

    const { rows, count } = await Product.findAndCountAll({
      where: whereProduct,
      include,
      attributes: [
        "uuid",
        "name",
        "description",
        "status",
        "reqStatus",
        "rejectReason",
        "createdAt",
        "updatedAt",
        [minPriceExpr, "minPriceMinor"],
        [sumStockExpr, "totalStock"],
      ],
      group,
      having,
      order,
      offset,
      limit,
      distinct: true,
      subQuery: false,
    })

    const total = Array.isArray(count) ? count.length : (count as number)
    return res.json({
      data: rows,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (e) {
    console.error("adminListProducts error:", e)
    return res.status(500).json({ error: "Internal server error" })
  }
}

/**
 * GET /admin/products/suggest?q=...
 * suggest เฉพาะชื่อร้าน
 */
export async function adminSuggestProducts(req: Request, res: Response) {
  try {
    const raw = String(req.query.q ?? "").trim()
    if (raw.length < 1) return res.json({ products: [] })

    const like = LIKE(raw)

    // ดึงร้านที่ชื่อ match
    const stores = await Store.findAll({
      where: sqWhere(col("store_name"), { [Op.like]: like }),
      attributes: ["uuid", ["store_name", "storeName"]],
      order: [["store_name", "ASC"]],
      limit: 8,
    })

    // ให้ FE ใช้ storeName ในการ pick
    const products = stores.map((s) => ({
      uuid: s.uuid,     // ไม่ได้ใช้ก็ได้ แต่เผื่ออนาคต
      name: s.get("storeName") as string,    // ให้ field name = storeName เพื่อ backward compatibility
      imageUrl: null,
      categoryName: null,
      storeName: s.get("storeName") as string,
    }))

    return res.json({ products })
  } catch (e) {
    console.error("adminSuggestProducts error:", e)
    return res.status(500).json({ error: "Internal server error" })
  }
}

/**
 * GET /admin/products/:uuid
 * รายละเอียดเต็มสำหรับ Admin (ไม่มีข้อจำกัด store)
 */
export async function adminGetProductDetail(req: Request, res: Response) {
  try {
    const { uuid } = req.params as { uuid: string }
    const product = await Product.findOne({
      where: { uuid },
      attributes: ["uuid", "name", "description", "status", "reqStatus", "rejectReason", "createdAt", "updatedAt"],
      include: [
        { model: Store, as: "store", attributes: ["uuid", ["store_name","storeName"], "email", "status"], required: false },
        { model: Category, as: "category", attributes: ["uuid", "name"], required: false },
        {
          model: ProductImage,
          as: "images",
          separate: true,
          attributes: ["uuid","url","fileName","isMain","sortOrder","createdAt"],
          order: [["sortOrder","ASC"],["createdAt","ASC"]],
        },
        {
          model: Variation,
          as: "variations",
          attributes: ["id","uuid","name","createdAt","updatedAt"],
          include: [
            { model: VariationOption, as: "options", attributes: ["id","uuid","value","sortOrder","createdAt","updatedAt"] }
          ]
        },
        {
          model: ProductItem,
          as: "items",
          attributes: ["id","uuid","sku","stockQuantity","priceMinor","isEnable","createdAt","updatedAt"],
          include: [
            { model: ProductItemImage, as: "productItemImage", attributes: ["uuid","url","fileName"], required: false },
            {
              model: ProductConfiguration,
              as: "configurations",
              attributes: ["id","uuid"],
              include: [
                {
                  model: VariationOption,
                  as: "variationOption",
                  attributes: ["id","uuid","value","sortOrder","variationId"],
                  include: [{ model: Variation, as: "variation", attributes: ["id","uuid","name"] }]
                }
              ]
            }
          ]
        }
      ]
    })
    if (!product) return res.status(404).json({ error: "Product not found" })
    return res.json(product)
  } catch (e) {
    console.error("adminGetProductDetail error:", e)
    return res.status(500).json({ error: "Internal server error" })
  }
}

/**
 * PATCH /admin/products/:uuid/moderate
 * body: { reqStatus: "APPROVED" | "REJECT", rejectReason?: string }
 */
export async function adminModerateProduct(req: Request, res: Response) {
  const t = await sequelize.transaction();
  try {
    const { uuid } = req.params as { uuid: string };
    const { reqStatus: rawReqStatus, rejectReason } = req.body as {
      reqStatus: "APPROVED" | "REJECT";
      rejectReason?: string | null;
    };

    const reqStatusEnum = toReqStatus(rawReqStatus);
    if (!reqStatusEnum) {
      await t.rollback();
      return res.status(400).json({ error: "Invalid reqStatus" });
    }

    const trimmedReason = String(rejectReason ?? "").trim();
    if (reqStatusEnum === ProductReqStatus.REJECT && !trimmedReason) {
      await t.rollback();
      return res.status(400).json({ error: "rejectReason is required when REJECT" });
    }

    const p = await Product.findOne({ where: { uuid }, transaction: t, lock: t.LOCK.UPDATE });
    if (!p) {
      await t.rollback();
      return res.status(404).json({ error: "Product not found" });
    }
    
    if (p.reqStatus !== ProductReqStatus.PENDING) {
      await t.rollback()
      return res.status(400).json({ error: "Only PENDING can be moderated" })
    }

    // ใช้ set + save เพื่อหลบ overload และส่ง enum ที่ถูกต้อง
    p.set({
      reqStatus: reqStatusEnum,
      rejectReason: reqStatusEnum === ProductReqStatus.REJECT ? trimmedReason : null,
    });
    await p.save({ transaction: t });

    await t.commit();
    return res.json({ ok: true });
  } catch (e) {
    await t.rollback();
    console.error("adminModerateProduct error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * POST /admin/products/bulk/moderate
 * body: { productUuids: string[], reqStatus: "APPROVED" | "REJECT", rejectReason?: string }
 */
export async function adminBulkModerateProducts(req: Request, res: Response) {
  const t = await sequelize.transaction();
  try {
    const { productUuids, reqStatus: rawReqStatus, rejectReason } = req.body as {
      productUuids: string[];
      reqStatus: "APPROVED" | "REJECT";
      rejectReason?: string | null;
    };

    if (!Array.isArray(productUuids) || productUuids.length === 0) {
      await t.rollback();
      return res.status(400).json({ error: "productUuids required" });
    }

    const reqStatusEnum = toReqStatus(rawReqStatus);
    if (!reqStatusEnum) {
      await t.rollback();
      return res.status(400).json({ error: "Invalid reqStatus" });
    }

    const trimmedReason = String(rejectReason ?? "").trim();
    if (reqStatusEnum === ProductReqStatus.REJECT && !trimmedReason) {
      await t.rollback();
      return res.status(400).json({ error: "rejectReason is required when REJECT" });
    }

    const payload: Partial<ProductAttributes> = {
      reqStatus: reqStatusEnum,
      rejectReason: reqStatusEnum === ProductReqStatus.REJECT ? trimmedReason : null,
    };

    const [affected] = await Product.update(
      payload,
      { where: { uuid: { [Op.in]: productUuids } }, transaction: t }
    );

    await t.commit();
    return res.json({ ok: true, updated: affected });
  } catch (e) {
    await t.rollback();
    console.error("adminBulkModerateProducts error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * GET /admin/categories/list?mode=flat
 * ส่ง flat list สำหรับหน้า Select (เหมือน merchant)
 */
export async function adminListCategories(req: Request, res: Response) {
  try {
    const { mode = "flat" } = (req.query ?? {}) as { mode?: "flat" | "tree" }

    const rows = await Category.findAll({
      attributes: ["id", "uuid", "name", "parentId"],
      include: [{ model: Category, as: "parent", attributes: ["uuid"], required: false }],
      order: [["name", "ASC"]],
    })

    if (mode === "flat") {
      const data = rows.map((r) => ({
        uuid: r.uuid,
        name: r.name,
        parentUuid: (r as any).parent?.uuid ?? null,
      }))
      return res.json({ data, meta: { total: data.length } })
    }

    // tree (optional)
    const nodes = rows.map((r) => ({
      uuid: r.uuid,
      name: r.name,
      parentUuid: (r as any).parent?.uuid ?? null,
      children: [] as any[],
    }))
    const byUuid = new Map(nodes.map((n) => [n.uuid, n]))
    const roots: any[] = []
    for (const n of nodes) {
      if (n.parentUuid && byUuid.get(n.parentUuid)) {
        byUuid.get(n.parentUuid)!.children.push(n)
      } else roots.push(n)
    }
    return res.json({ data: roots })
  } catch (e) {
    console.error("adminListCategories error:", e)
    return res.status(500).json({ error: "Internal server error" })
  }
}
