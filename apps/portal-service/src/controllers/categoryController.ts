import { Request, Response } from "express"
import { Category, Op, Product, sequelize } from "@digishop/db"

type ListQuery = {
  parentUuid?: string
  q?: string
  page?: string
  pageSize?: string
  mode?: "flat"
}

const asInt = (v: any, d: number) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : d
}

async function findCategoryByUuid(uuid: string) {
  return Category.findOne({ where: { uuid }, paranoid: true })
}

/** ดึงหมวดทั้งหมด (ยังไม่ถูกลบ) แล้วหา descendants ของ root ด้วย in-memory BFS (เลี่ยง raw/CTE) */
async function getDescendantIdsByScan(rootUuid: string): Promise<number[]> {
  const all = await Category.findAll({
    where: { deletedAt: null },
    attributes: ["id", "uuid", "parentId"],
    paranoid: true
  })

  const byUuid = new Map(all.map((c) => [c.uuid, c]))
  const byParent = new Map<number | null, number[]>()
  for (const c of all) {
    const arr = byParent.get(c.parentId ?? null) ?? []
    arr.push(c.id)
    byParent.set(c.parentId ?? null, arr)
  }

  const root = byUuid.get(rootUuid)
  if (!root) return []

  const result: number[] = []
  const q: number[] = [root.id]
  while (q.length) {
    const id = q.shift()!
    result.push(id)
    const children = byParent.get(id) ?? []
    for (const cid of children) q.push(cid)
  }
  return result
}

async function countProductsDirect(categoryId: number): Promise<number> {
  return Product.count({ where: { categoryId } }) // paranoid:true โดยค่าเริ่มต้น
}

async function countProductsTotal(rootUuid: string): Promise<number> {
  const ids = await getDescendantIdsByScan(rootUuid)
  if (ids.length === 0) return 0
  return Product.count({ where: { categoryId: { [Op.in]: ids } } })
}

// ============ GET /admin/categories/list ============
export async function listCategories(
  req: Request<{}, {}, {}, ListQuery>,
  res: Response
) {
  try {
    const { parentUuid, q, page = "1", pageSize = "20", mode } = req.query
    const p = asInt(page, 1)
    const ps = asInt(pageSize, 20)

    // ===== flat mode (สำหรับ dropdown/select) =====
    if (mode === "flat") {
      const where: any = { deletedAt: null }
      if (q) where.name = { [Op.like]: `%${q}%` }

      const rows = await Category.findAll({
        where,
        order: [["name", "ASC"]],
        attributes: ["uuid", "name", "parentId", "createdAt", "updatedAt"]
      })

      // map parentUuid
      const parentIds = rows.map((r) => r.parentId).filter(Boolean) as number[]
      const parents =
        parentIds.length > 0
          ? await Category.findAll({
              where: { id: { [Op.in]: parentIds } },
              attributes: ["id", "uuid"]
            })
          : []
      const parentById = new Map(parents.map((p) => [p.id, p.uuid]))

      const data = rows.map((r) => ({
        uuid: r.uuid,
        name: r.name,
        parentUuid: r.parentId ? parentById.get(r.parentId) ?? null : null,
        // flat ใช้เบา ๆ ไม่คำนวณ count เพื่อความเร็ว
        productCountDirect: 0,
        productCountTotal: 0,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      }))

      return res.json({ data, meta: { total: data.length, totalPages: 1 } })
    }

    // ===== list เฉพาะระดับ (root หรือ children ของ parentUuid) =====
    let parentId: number | null = null
    if (parentUuid) {
      const pCat = await findCategoryByUuid(parentUuid)
      if (!pCat) return res.status(404).json({ error: "Parent not found" })
      parentId = pCat.id
    }

    const where: any = { deletedAt: null, parentId }
    if (q) where.name = { [Op.like]: `%${q}%` }

    const { count, rows } = await Category.findAndCountAll({
      where,
      order: [["name", "ASC"]],
      limit: ps,
      offset: (p - 1) * ps,
      attributes: ["id", "uuid", "name", "parentId", "createdAt", "updatedAt"]
    })

    // parentUuid mapping
    const parentIds = rows.map((r) => r.parentId).filter(Boolean) as number[]
    const parents =
      parentIds.length > 0
        ? await Category.findAll({
            where: { id: { [Op.in]: parentIds } },
            attributes: ["id", "uuid"]
          })
        : []
    const parentById = new Map(parents.map((x) => [x.id, x.uuid]))

    // นับสินค้า: direct + total (subtree)
    const data = await Promise.all(
      rows.map(async (r) => {
        const direct = await countProductsDirect(r.id)
        const total = await countProductsTotal(r.uuid)
        return {
          uuid: r.uuid,
          name: r.name,
          parentUuid: r.parentId ? parentById.get(r.parentId) ?? null : null,
          productCountDirect: direct,
          productCountTotal: total,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt
        }
      })
    )

    return res.json({
      data,
      meta: { total: count, totalPages: Math.max(1, Math.ceil(count / ps)) }
    })
  } catch (e) {
    console.error("listCategories error:", e)
    return res.status(500).json({ error: "Internal server error" })
  }
}

// ============ GET /admin/categories/suggest ============
export async function suggestCategories(
  req: Request<{}, {}, {}, { q?: string }>,
  res: Response
) {
  try {
    const { q = "" } = req.query
    if (!q.trim()) return res.json([])
    const rows = await Category.findAll({
      where: {
        deletedAt: null,
        name: { [Op.like]: `%${q.trim()}%` }
      },
      limit: 10,
      order: [["name", "ASC"]],
      attributes: ["uuid", "name"]
    })
    return res.json(rows.map((r) => ({ uuid: r.uuid, name: r.name })))
  } catch (e) {
    console.error("suggestCategories error:", e)
    return res.status(500).json({ error: "Internal server error" })
  }
}

// ============ GET /admin/categories/:uuid ============
export async function getCategoryDetail(
  req: Request<{ uuid: string }>,
  res: Response
) {
  try {
    const row = await Category.findOne({
      where: { uuid: req.params.uuid, deletedAt: null },
      attributes: ["id", "uuid", "name", "parentId"]
    })
    if (!row) return res.status(404).json({ error: "Not found" })

    let parentUuid: string | null = null
    if (row.parentId) {
      const p = await Category.findByPk(row.parentId, { attributes: ["uuid"] })
      parentUuid = p?.uuid ?? null
    }
    return res.json({
      uuid: row.uuid,
      name: row.name,
      parentUuid
    })
  } catch (e) {
    console.error("getCategoryDetail error:", e)
    return res.status(500).json({ error: "Internal server error" })
  }
}

// ============ POST /admin/categories ============
export async function createCategory(req: Request, res: Response) {
  const t = await sequelize.transaction()
  try {
    const { name, parentUuid = null } = req.body as {
      name: string
      parentUuid?: string | null
    }
    if (!name?.trim()) {
      await t.rollback()
      return res.status(400).json({ error: "Name is required" })
    }

    let parentId: number | null = null
    if (parentUuid) {
      const p = await findCategoryByUuid(parentUuid)
      if (!p) {
        await t.rollback()
        return res.status(400).json({ error: "Parent not found" })
      }
      parentId = p.id
    }

    const uuid = require("crypto").randomUUID()
    const created = await Category.create(
      { uuid, name: name.trim(), parentId },
      { transaction: t }
    )

    await t.commit()
    return res.status(201).json({ uuid: created.uuid })
  } catch (e) {
    await t.rollback()
    console.error("createCategory error:", e)
    return res.status(500).json({ error: "Internal server error" })
  }
}

// ============ PATCH /admin/categories/:uuid ============
export async function updateCategory(
  req: Request<{ uuid: string }>,
  res: Response
) {
  const t = await sequelize.transaction()
  try {
    const row = await findCategoryByUuid(req.params.uuid)
    if (!row) {
      await t.rollback()
      return res.status(404).json({ error: "Not found" })
    }

    const { name, parentUuid } = req.body as {
      name?: string
      parentUuid?: string | null
    }

    let parentId = row.parentId
    if (parentUuid !== undefined) {
      if (parentUuid === null) parentId = null
      else {
        const p = await findCategoryByUuid(parentUuid)
        if (!p) {
          await t.rollback()
          return res.status(400).json({ error: "Parent not found" })
        }
        // ห้ามตั้ง parent เป็นลูกหลานของตัวเอง
        const descIds = await getDescendantIdsByScan(row.uuid)
        if (descIds.includes(p.id)) {
          await t.rollback()
          return res
            .status(400)
            .json({ error: "Cannot set parent to its descendant" })
        }
        parentId = p.id
      }
    }

    await row.update(
      {
        name: name?.trim() ?? row.name,
        parentId
      },
      { transaction: t }
    )

    await t.commit()
    return res.json({ ok: true })
  } catch (e) {
    await t.rollback()
    console.error("updateCategory error:", e)
    return res.status(500).json({ error: "Internal server error" })
  }
}

// ============ DELETE /admin/categories/:uuid ============
// ลบได้เฉพาะกรณีไม่มีสินค้าใน subtree ทั้งหมด (รวมตัวเอง)
export async function deleteCategory(
  req: Request<{ uuid: string }>,
  res: Response
) {
  const t = await sequelize.transaction()
  try {
    const row = await findCategoryByUuid(req.params.uuid)
    if (!row) {
      await t.rollback()
      return res.status(404).json({ error: "Not found" })
    }

    const total = await countProductsTotal(row.uuid)
    if (total > 0) {
      await t.rollback()
      return res.status(409).json({ error: "CATEGORY_HAS_PRODUCTS", total })
    }

    // soft-delete ทั้ง subtree
    const ids = await getDescendantIdsByScan(row.uuid)
    if (ids.length > 0) {
      await Category.destroy({
        where: { id: { [Op.in]: ids } },
        transaction: t
      }) // paranoid:true -> update deletedAt
    }

    await t.commit()
    return res.json({ ok: true, deletedCount: ids.length })
  } catch (e) {
    await t.rollback()
    console.error("deleteCategory error:", e)
    return res.status(500).json({ error: "Internal server error" })
  }
}

// ============ POST /admin/categories/:uuid/move-products ============
// ย้ายสินค้าทั้ง subtree ไปยัง target category
export async function moveProducts(
  req: Request<{ uuid: string }>,
  res: Response
) {
  const t = await sequelize.transaction()
  try {
    const { targetCategoryUuid } = req.body as { targetCategoryUuid: string }
    const src = await findCategoryByUuid(req.params.uuid)
    const dst = await findCategoryByUuid(targetCategoryUuid)

    if (!src || !dst) {
      await t.rollback()
      return res.status(400).json({ error: "Source or target not found" })
    }
    if (src.uuid === dst.uuid) {
      await t.rollback()
      return res
        .status(400)
        .json({ error: "Target must be different from source" })
    }

    // ป้องกันย้ายไป descendant ของตัวเอง
    const descIds = await getDescendantIdsByScan(src.uuid)
    if (descIds.includes(dst.id)) {
      await t.rollback()
      return res
        .status(400)
        .json({ error: "Target cannot be a descendant of source" })
    }

    // ย้ายสินค้าทั้ง subtree
    const ids = descIds
    const [affected] = await Product.update(
      { categoryId: dst.id },
      { where: { categoryId: { [Op.in]: ids } }, transaction: t }
    )

    await t.commit()
    return res.json({ ok: true, moved: Number(affected ?? 0) })
  } catch (e) {
    await t.rollback()
    console.error("moveProducts error:", e)
    return res.status(500).json({ error: "Internal server error" })
  }
}
