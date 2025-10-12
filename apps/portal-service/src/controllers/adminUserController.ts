import { Request, Response } from "express"
import { Op, col, fn, WhereOptions } from "sequelize"
import { AdminUser } from "@digishop/db/src/models/portal/AdminUser"
import { AdminSession } from "@digishop/db/src/models/portal/AdminSession"
import { AdminRole } from "@digishop/db/src/models/portal/AdminRole"
import { AdminUserRole } from "@digishop/db/src/models/portal/AdminUserRole"
import { AdminPermission } from "@digishop/db/src/models/portal/AdminPermission"
import { AdminRolePermission } from "@digishop/db/src/models/portal/AdminRolePermission"
import { AdminInvite } from "@digishop/db/src/models/portal/AdminInvite"

const asInt = (v: any, d: number) => {
  const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.floor(n) : d
}
const likeify = (q: string) => `%${q.replace(/[%_]/g, "\\$&")}%`

export async function adminListAdmins(req: Request, res: Response) {
  try {
    const { q = "", role, status, sortBy = "createdAt", sortDir = "desc" } =
      req.query as Record<string, string | undefined>

    const page = Math.max(asInt(req.query.page, 1), 1)
    const pageSize = Math.min(Math.max(asInt(req.query.pageSize, 20), 1), 100)
    const offset = (page - 1) * pageSize

    const where: WhereOptions = {}
    if (status && status.trim()) (where as any)["status"] = status

    if (q && q.trim()) {
      const t = likeify(q.trim())
      Object.assign(where, { [Op.or]: [{ email: { [Op.like]: t } }, { name: { [Op.like]: t } }] })
    }

    // include roles สำหรับ filter ตาม role
    const rolesInclude: any = {
      model: AdminRole,
      as: "roles",
      attributes: [["slug", "slug"]],
      through: { attributes: [] },
      required: !!role,
      where: role ? { slug: role } : undefined
    }

    const dir = String(sortDir).toUpperCase() === "ASC" ? "ASC" : "DESC"
    const orderBy: any[] = []
    if (sortBy === "name") orderBy.push([col("AdminUser.name"), dir])
    else if (sortBy === "email") orderBy.push([col("AdminUser.email"), dir])
    else if (sortBy === "lastLoginAt") orderBy.push([col("AdminUser.last_login_at"), dir])
    else orderBy.push([col("AdminUser.created_at"), dir])

    // ดึงรายชื่อ + roles
    const { rows, count } = await AdminUser.findAndCountAll({
      where,
      include: [rolesInclude],
      attributes: [
        "id",
        ["email", "email"],
        ["name", "name"],
        ["status", "status"],
        ["last_login_at", "lastLoginAt"],
        ["created_at", "createdAt"]
      ],
      order: orderBy,
      offset,
      limit: pageSize,
      distinct: true,
      subQuery: false
    })

    const data = rows.map((u: any) => {
      const roleSlugs: string[] = (u.roles ?? []).map((r: any) => r.get("slug"))
      // primaryRole = เอา SUPER_ADMIN ก่อน ถ้าไม่มีค่อยเอา role แรก
      const primaryRole =
        roleSlugs.includes("SUPER_ADMIN") ? "SUPER_ADMIN" : (roleSlugs[0] ?? "VIEWER")
      return {
        id: u.get("id"),
        email: u.get("email"),
        name: u.get("name"),
        status: u.get("status"),
        lastLoginAt: u.get("lastLoginAt"),
        roles: roleSlugs,
        primaryRole
      }
    })

    const total = Array.isArray(count) ? count.length : (count as number)
    res.json({ data, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } })
  } catch (e) {
    console.error("adminListAdmins error:", e)
    res.status(500).json({ error: "Internal server error" })
  }
}

export async function adminSuggestAdmins(req: Request, res: Response) {
  try {
    const q = String(req.query.q || "").trim()
    if (!q) return res.json([])
    const t = likeify(q)
    const rows = await AdminUser.findAll({
      where: { [Op.or]: [{ email: { [Op.like]: t } }, { name: { [Op.like]: t } }] },
      attributes: ["id", "name", "email"],
      order: [["created_at", "DESC"]],
      limit: 8
    })
    res.json(rows)
  } catch (e) {
    console.error("adminSuggestAdmins error:", e)
    res.status(500).json({ error: "Internal server error" })
  }
}

const REINVITE_COOLDOWN_MIN = 10;

export async function adminGetAdminDetail(req: Request, res: Response) {
  try {
    const id = Number((req.params as { id: string }).id)
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" })

    const u: any = await AdminUser.findOne({
      where: { id },
      include: [
        {
          model: AdminRole,
          as: "roles",
          attributes: ["id", "slug", "name", "description", "isSystem"],
          required: false,
          // ห้ามใส่ model ตรงนี้
          through: {
            attributes: ["endAt"],
          },
          include: [
            {
              model: AdminPermission,
              as: "permissions",
              through: { attributes: [] },
              attributes: ["id", "slug", "resource", "action", "effect"],
              required: false
            }
          ]
        },
        {
          model: AdminSession,
          as: "sessions",
          attributes: [
            "id",
            ["jti", "jti"],
            ["ip", "ip"],
            ["user_agent", "userAgent"],
            ["expires_at", "expiresAt"],
            ["revoked_at", "revokedAt"],
            ["created_at", "createdAt"]
          ],
          required: false
        }
      ],
      attributes: [
        "id",
        "email",
        "password",
        "name",
        "status",
        "lastLoginAt",
        "createdAt",
        "updatedAt"
      ]
    })
    if (!u) return res.status(404).json({ error: "Not found" })

    // ⬇️ Filter เฉพาะ active roles: endAt == null
    const activeRoles = (u.roles ?? []).filter((r: any) => {
      const junction = (r as any).AdminUserRole   // ชื่อเท่ากับ model ของ join table
      // ถ้าใช้ camelCase mapping endAt จะมาเป็น endAt
      return !junction?.endAt
    })

    const roleObjs = activeRoles.map((r: any) => ({
      id: r.get("id"),
      slug: r.get("slug"),
      name: r.get("name"),
      description: r.get("description"),
      isSystem: !!r.get("isSystem")
    }))

    // รวม permissions เฉพาะจาก active roles
    const permMap = new Map<string, any>()
    for (const r of activeRoles) {
      for (const p of (r.permissions ?? [])) {
        const slug = p.get("slug") as string
        if (!permMap.has(slug)) {
          permMap.set(slug, {
            id: p.get("id"),
            slug,
            resource: p.get("resource"),
            action: p.get("action"),
            effect: p.get("effect")
          })
        }
      }
    }

    const sessions = (u.sessions ?? [])
      .map((s: any) => ({
        id: s.get("id"),
        jti: s.get("jti"),
        ip: s.get("ip"),
        userAgent: s.get("userAgent"),
        expiresAt: s.get("expiresAt"),
        revokedAt: s.get("revokedAt"),
        createdAt: s.get("createdAt")
      }))
      .sort((a: any, b: any) =>
        new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime()
      )
    const roleHistoryRows = await AdminUserRole.findAll({
      where: { adminId: u.get("id") as number },
      paranoid: false,
      include: [
        {
          model: AdminRole,
          as: "role",
          attributes: ["id", "slug", "name"]
        }
      ],
      attributes: [
        "id",
        ["start_at", "startAt"],
        ["end_at", "endAt"],
        ["created_at", "createdAt"],
        ["updated_at", "updatedAt"],
        ["deleted_at", "deletedAt"]
      ] as any,
      order: [["created_at", "DESC"]]
    })

    const roleHistory = roleHistoryRows.map((r: any) => {
      const startAt = r.get("startAt") as Date | null
      const endAt = r.get("endAt") as Date | null
      const deletedAt = r.get("deletedAt") as Date | null
      const isActive = !endAt && !deletedAt
      const role = r.get("role") as any
      return {
        id: r.get("id"),
        roleId: role?.get("id") ?? null,
        roleSlug: role?.get("slug") ?? null,
        roleName: role?.get("name") ?? null,
        startAt: startAt ? startAt.toISOString() : null,
        endAt: endAt ? endAt.toISOString() : null,
        createdAt: (r.get("createdAt") as Date).toISOString(),
        updatedAt: (r.get("updatedAt") as Date).toISOString(),
        deletedAt: deletedAt ? deletedAt.toISOString() : null,
        status: isActive ? "ACTIVE" : "INACTIVE"
      }
    })

    const hasPassword = Boolean(u.get("password"))
    const status = String(u.get("status"))
    const canResetPassword = hasPassword === true
    const canReinviteBase = !hasPassword && status !== "ACTIVE"

    let canReinvite = canReinviteBase
    let reinviteCooldownSeconds: number | undefined
    let lastInviteAt: string | undefined
    let reinviteAvailableAt: string | undefined

    if (canReinviteBase) {
      const email = String(u.get("email"))
      const recentInvite = await AdminInvite.findOne({
        where: {
          email,
          acceptedAt: { [Op.is]: null },
          deletedAt: { [Op.is]: null },
        },
        order: [["created_at", "DESC"]],
      })

      if (recentInvite) {
        const createdAt = recentInvite.get("createdAt") as Date
        lastInviteAt = createdAt.toISOString()

        const available = new Date(createdAt.getTime() + REINVITE_COOLDOWN_MIN * 60 * 1000)
        reinviteAvailableAt = available.toISOString()

        const now = Date.now()
        if (now < available.getTime()) {
          canReinvite = false
          reinviteCooldownSeconds = Math.ceil((available.getTime() - now) / 1000)
        }
      }
    }

    res.json({
      id: u.get("id"),
      email: u.get("email"),
      name: u.get("name"),
      status,
      lastLoginAt: u.get("lastLoginAt"),
      createdAt: u.get("createdAt"),
      updatedAt: u.get("updatedAt"),
      roles: roleObjs,                            // เฉพาะ active
      permissions: Array.from(permMap.values()),  // จาก active
      sessions,
      canReinvite,
      canResetPassword,
      reinviteCooldownSeconds,
      lastInviteAt,
      reinviteAvailableAt,
      roleHistory
    })
  } catch (e) {
    console.error("adminGetAdminDetail error:", e)
    res.status(500).json({ error: "Internal server error" })
  }
}

export async function adminCreateAdmin(req: Request, res: Response) {
  try {
    const { email, name, roleSlug } = (req.body || {}) as { email?: string; name?: string; roleSlug?: string };
    if (!email || !name || !roleSlug) {
      return res.status(400).json({ error: "Missing fields (email, name, roleSlug)" });
    }

    const existed = await AdminUser.count({ where: { email } });
    if (existed > 0) return res.status(409).json({ error: "Email already exists" });
    
    // สร้างแบบไม่ตั้งรหัส และตั้งสถานะ SUSPENDED (รอ invite)
    const created = await AdminUser.create({
      email, name, status: "SUSPENDED", password: null, lastLoginAt: null
    } as any);

    const role = await AdminRole.findOne({ where: { slug: roleSlug } });
    if (!role) return res.status(400).json({ error: "Invalid roleSlug" });
    await AdminUserRole.create({ adminId: created.get("id") as number, roleId: role.get("id") as number });

    return res.json({ id: created.get("id") });
  } catch (e) {
    console.error("adminCreateAdmin error:", e);
    res.status(500).json({ error: "Internal server error" });
  }
}
