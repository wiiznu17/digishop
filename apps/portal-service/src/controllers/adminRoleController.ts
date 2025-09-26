import { Request, Response } from "express"
import { Op, col, fn } from "sequelize"
import { AdminRole } from "@digishop/db/src/models/portal/AdminRole"
import { AdminPermission } from "@digishop/db/src/models/portal/AdminPermission"
import { AdminRolePermission } from "@digishop/db/src/models/portal/AdminRolePermission"

const asInt = (v: any, d: number) => {
  const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.floor(n) : d
}
const likeify = (q: string) => `%${q.replace(/[%_]/g, "\\$&")}%`

// GET /api/admin/roles/list
export async function adminListRoles(req: Request, res: Response) {
  try {
    const { q = "", sortBy = "createdAt", sortDir = "desc" } =
      req.query as Record<string, string | undefined>

    const page = Math.max(asInt(req.query.page, 1), 1)
    const pageSize = Math.min(Math.max(asInt(req.query.pageSize, 20), 1), 100)
    const offset = (page - 1) * pageSize

    const where: any = {}
    if (q && q.trim()) {
      const t = likeify(q.trim())
      where[Op.or] = [{ name: { [Op.like]: t } }, { slug: { [Op.like]: t } }]
    }

    const dir = String(sortDir).toUpperCase() === "ASC" ? "ASC" : "DESC"
    const orderBy: any[] = []
    if (sortBy === "name") orderBy.push([col("AdminRole.name"), dir])
    else if (sortBy === "slug") orderBy.push([col("AdminRole.slug"), dir])
    else orderBy.push([col("AdminRole.created_at"), dir])

    const { rows, count } = await AdminRole.findAndCountAll({
      where,
      include: [{ model: AdminRolePermission, as: "rolePermissions", attributes: [], required: false }],
      attributes: [
        "id",
        ["slug", "slug"],
        ["name", "name"],
        ["description", "description"],
        ["is_system", "isSystem"],
        ["created_at", "createdAt"],
        [fn("COUNT", col("rolePermissions.id")), "permissionCount"],
      ],
      group: ["AdminRole.id"],
      order: orderBy,
      offset,
      limit: pageSize,
      distinct: true,
      subQuery: false,
    })

    const data = rows.map((r: any) => ({
      id: r.get("id"),
      slug: r.get("slug"),
      name: r.get("name"),
      description: r.get("description"),
      isSystem: !!r.get("isSystem"),
      permissionCount: Number(r.get("permissionCount") ?? 0),
      createdAt: r.get("createdAt"),
    }))

    const total = Array.isArray(count) ? count.length : (count as number)
    return res.json({ data, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } })
  } catch (e) {
    console.error("adminListRoles error:", e)
    return res.status(500).json({ error: "Internal server error" })
  }
}

// GET /api/admin/roles/:id/detail
export async function adminGetRoleDetail(req: Request, res: Response) {
  try {
    const id = Number((req.params as { id: string }).id)
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" })

    const role = await AdminRole.findOne({
      where: { id },
      attributes: [
        "id",
        ["slug", "slug"],
        ["name", "name"],
        ["description", "description"],
        ["is_system", "isSystem"],
        ["created_at", "createdAt"],
        ["updated_at", "updatedAt"],
      ],
      include: [
        {
          model: AdminPermission,
          as: "permissions",
          through: { attributes: [] },
          attributes: ["id", "slug", "resource", "action", "effect"],
          required: false,
        },
      ],
    })
    if (!role) return res.status(404).json({ error: "Not found" })

    const allPermissions = await AdminPermission.findAll({
      attributes: ["id", "slug", "resource", "action", "effect"],
      order: [["resource", "ASC"], ["action", "ASC"]],
    })

    return res.json({
      id: role.get("id"),
      slug: role.get("slug"),
      name: role.get("name"),
      description: role.get("description"),
      isSystem: !!role.get("isSystem"),
      createdAt: role.get("createdAt"),
      updatedAt: role.get("updatedAt"),
      permissions: (role as any).permissions?.map((p: any) => ({
        id: p.get("id"),
        slug: p.get("slug"),
        resource: p.get("resource"),
        action: p.get("action"),
        effect: p.get("effect"),
      })) ?? [],
      allPermissions: allPermissions.map((p: any) => ({
        id: p.get("id"),
        slug: p.get("slug"),
        resource: p.get("resource"),
        action: p.get("action"),
        effect: p.get("effect"),
      })),
    })
  } catch (e) {
    console.error("adminGetRoleDetail error:", e)
    return res.status(500).json({ error: "Internal server error" })
  }
}

// POST /api/admin/roles/create
export async function adminCreateRole(req: Request, res: Response) {
  try {
    const { slug, name, description } = (req.body || {}) as { slug?: string; name?: string; description?: string }
    if (!slug || !name) return res.status(400).json({ error: "Missing fields (slug, name)" })
    const existed = await AdminRole.count({ where: { slug } })
    if (existed > 0) return res.status(409).json({ error: "Slug already exists" })

    const created = await AdminRole.create({ slug, name, description: description ?? null, isSystem: false } as any)
    return res.json({ id: created.get("id") })
  } catch (e) {
    console.error("adminCreateRole error:", e)
    return res.status(500).json({ error: "Internal server error" })
  }
}

// PATCH /api/admin/roles/:id/meta
export async function adminUpdateRoleMeta(req: Request, res: Response) {
  try {
    const id = Number((req.params as { id: string }).id)
    const { name, description } = (req.body || {}) as { name?: string; description?: string }
    const role: any = await AdminRole.findOne({ where: { id } })
    if (!role) return res.status(404).json({ error: "Not found" })
    if (role.get("isSystem")) return res.status(400).json({ error: "System role is not editable" })

    if (name != null) role.set("name", name)
    if (description !== undefined) role.set("description", description || null)
    await role.save()
    return res.json({ ok: true })
  } catch (e) {
    console.error("adminUpdateRoleMeta error:", e)
    return res.status(500).json({ error: "Internal server error" })
  }
}

// PUT /api/admin/roles/:id/permissions
export async function adminReplaceRolePermissions(req: Request, res: Response) {
  try {
    const id = Number((req.params as { id: string }).id)
    const body = (req.body || {}) as { permissionIds?: number[]; permissionSlugs?: string[] }
    const role: any = await AdminRole.findOne({ where: { id } })
    if (!role) return res.status(404).json({ error: "Not found" })
    if (role.get("isSystem")) return res.status(400).json({ error: "System role is not editable" })

    let perms: AdminPermission[] = []
    if (Array.isArray(body.permissionIds) && body.permissionIds.length > 0) {
      perms = await AdminPermission.findAll({ where: { id: body.permissionIds } })
    } else if (Array.isArray(body.permissionSlugs) && body.permissionSlugs.length > 0) {
      perms = await AdminPermission.findAll({ where: { slug: body.permissionSlugs } })
    }

    // replace all
    await AdminRolePermission.destroy({ where: { roleId: id } })
    if (perms.length > 0) {
      await AdminRolePermission.bulkCreate(
        perms.map((p: any) => ({ roleId: id, permissionId: p.get("id") as number }))
      )
    }
    return res.json({ ok: true })
  } catch (e) {
    console.error("adminReplaceRolePermissions error:", e)
    return res.status(500).json({ error: "Internal server error" })
  }
}
