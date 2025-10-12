// apps/portal-service/src/controllers/adminRoleController.ts
import { Request, Response } from "express"
import { Transaction } from "sequelize"
import { AdminRole } from "@digishop/db/src/models/portal/AdminRole"
import { AdminUserRole } from "@digishop/db/src/models/portal/AdminUserRole"
import { AdminUser } from "@digishop/db/src/models/portal/AdminUser"
import { sequelize } from "@digishop/db"

// GET /roles/list
export async function adminListRoles(req: Request, res: Response) {
  try {
    const rows = await AdminRole.findAll({
      attributes: ["id", "slug", "name", "description", "isSystem"],
      order: [["slug", "ASC"]],
    })
    res.json(rows.map(r => ({
      id: r.get("id"),
      slug: r.get("slug"),
      name: r.get("name"),
      description: r.get("description"),
      isSystem: !!r.get("isSystem")
    })))
  } catch (e) {
    console.error("adminListRoles error:", e)
    res.status(500).json({ error: "Internal server error" })
  }
}

export async function adminUpdateAdminRoles(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

    const admin = await AdminUser.findByPk(id);
    if (!admin) return res.status(404).json({ error: "Admin not found" });

    const roleSlugs = Array.isArray(req.body?.roleSlugs) ? (req.body.roleSlugs as string[]) : [];
    if (roleSlugs.length === 0) return res.status(400).json({ error: "roleSlugs must not be empty" });
    console.log("role: ", roleSlugs)
    const requesterRoleSlugs: string[] = (req as any)?.roleSlugs || [];
    const wantsSuperAdmin = roleSlugs.includes("SUPER_ADMIN");
    const isRequesterSuperAdmin = requesterRoleSlugs.includes("SUPER_ADMIN");
    if (wantsSuperAdmin && !isRequesterSuperAdmin) {
      return res.status(403).json({ error: "FORBIDDEN_SUPER_ADMIN_ASSIGN" });
    }

    // ตรวจ role ให้ครบ
    const roles = await AdminRole.findAll({ where: { slug: roleSlugs } as any });
    const found = new Set(roles.map((r) => String(r.get("slug"))));
    const missing = roleSlugs.filter((s) => !found.has(s));
    if (missing.length) return res.status(400).json({ error: "INVALID_ROLE_SLUGS", missing });

    const wantRoleIds = new Set<number>(roles.map((r) => r.get("id") as number));
    const now = new Date();

    await sequelize.transaction(async (t: Transaction) => {
      // โหลดความสัมพันธ์ทั้งหมด (รวมที่เคยลบ) เพื่อคำนวณสถานะ
      const allRows = await AdminUserRole.findAll({
        where: { adminId: id },
        paranoid: false,
        transaction: t,
      });

      // active = end_at IS NULL && deleted_at IS NULL
      const activeByRoleId = new Map<number, AdminUserRole>();
      for (const row of allRows) {
        const rid = row.get("roleId") as number;
        const endAt = row.get("endAt") as Date | null;
        const deletedAt = row.get("deletedAt") as Date | null;
        if (!endAt && !deletedAt) activeByRoleId.set(rid, row);
      }

      // 1) ปิดบทบาทที่ไม่ต้องการแล้ว: เซ็ต end_at
      for (const [rid, row] of activeByRoleId) {
        if (!wantRoleIds.has(rid)) {
          await row.update({ endAt: now } as any, { transaction: t });
        }
      }

      // 2) เปิดบทบาทที่ต้องการ: ถ้ายังไม่มี active ให้ "สร้างแถวใหม่" เริ่มช่วงใหม่
      for (const rid of wantRoleIds) {
        if (activeByRoleId.has(rid)) continue; // มี active แล้ว ข้าม
        await AdminUserRole.create(
          { adminId: id, roleId: rid, startAt: now, endAt: null } as any,
          { transaction: t }
        );
        // ถ้ามี bug แอบมี active ซ้อน DB จะกันด้วย unique (admin_id, role_id, active_flag)
      }
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error("adminUpdateAdminRoles error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}

