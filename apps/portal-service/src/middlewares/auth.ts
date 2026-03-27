import type { Request, Response, NextFunction } from 'express'
import { verifyAccess } from '../lib/jwt'
import { AdminSession } from '@digishop/db'

declare global {
  namespace Express {
    interface Request {
      adminId?: number
      sessionJti?: string
      permCache?: Set<string>
    }
  }
}

// อ่าน access token จาก "คุกกี้" แทน Authorization Bearer
const ATK_NAME = process.env.JWT_ACCESS_COOKIE_NAME || 'access_token'

// ตรวจ access cookie + session ยังไม่ revoke
export async function authenticateAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = (req as any).cookies?.[ATK_NAME] as string | undefined
    if (!token) return res.status(401).json({ error: 'UNAUTHORIZED' })

    const payload = verifyAccess(token) // throws if invalid
    req.adminId = Number(payload.sub)
    req.sessionJti = payload.jti

    // ตรวจ session jti ใน DB
    const sess = await AdminSession.findOne({
      where: {
        jti: req.sessionJti,
        adminId: req.adminId,
        revokedAt: null
      } as any
    })
    if (!sess) return res.status(401).json({ error: 'SESSION_REVOKED' })

    next()
  } catch {
    return res.status(401).json({ error: 'INVALID_TOKEN' })
  }
}

// ดึง permission slugs ของ admin จาก RBAC (cache ใน req ตลอด request)
import { sequelize } from '@digishop/db'
async function getPerms(adminId: number): Promise<Set<string>> {
  const rows = await sequelize.query(
    `
    SELECT DISTINCT p.slug
    FROM ADMIN_USER_ROLES ur
    JOIN ADMIN_ROLES r ON r.id = ur.role_id
    JOIN ADMIN_ROLE_PERMISSIONS rp ON rp.role_id = r.id
    JOIN ADMIN_PERMISSIONS p ON p.id = rp.permission_id
    WHERE ur.admin_id = :adminId
    `,
    { replacements: { adminId }, type: 'SELECT' as any }
  )
  return new Set((rows as any[]).map((r) => r.slug))
}

export function requirePerms(...need: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.adminId) return res.status(401).json({ error: 'UNAUTHORIZED' })
    if (!req.permCache) req.permCache = await getPerms(req.adminId)
    const ok = need.every((s) => req.permCache!.has(s))
    if (!ok) return res.status(403).json({ error: 'FORBIDDEN', required: need })
    next()
  }
}
