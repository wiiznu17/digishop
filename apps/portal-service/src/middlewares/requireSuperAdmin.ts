import { NextFunction, Request, Response } from "express"
import { AdminUserRole } from "@digishop/db/src/models/portal/AdminUserRole"
import { AdminRole } from "@digishop/db/src/models/portal/AdminRole"

export async function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  // สมมติ auth ใส่ req.admin.id มาแล้ว (เหมือน requirePerms)
  console.log("req: ", req.adminId)
  const adminId = (req as any)?.adminId
  if (!adminId) return res.status(401).json({ error: "Unauthorized" })
  const match = await AdminUserRole.count({
    where: { adminId },
    include: [{ model: AdminRole, as: "role", where: { slug: "SUPER_ADMIN" }, attributes: [] }]
  })
  if (match <= 0) return res.status(403).json({ error: "Forbidden (Super Admin only)" })
  return next()
}
