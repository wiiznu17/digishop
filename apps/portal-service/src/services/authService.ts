import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'
import { signAccess, signRefresh, verifyRefresh } from '../lib/jwt'
import { authRepository } from '../repositories/authRepository'
import { AppError } from '../errors/AppError'

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000

export class AuthService {
  async login(
    payload: { email?: string; password?: string },
    ip: string,
    userAgent: string | null
  ) {
    const { email, password } = payload
    if (!email || !password) throw new AppError('EMAIL_PASSWORD_REQUIRED', 400)

    const user = await authRepository.findAdminByEmail(email)
    if (!user) throw new AppError('INVALID_CREDENTIALS', 401)
    if ((user as any).status === 'SUSPENDED') {
      throw new AppError('ACCOUNT_SUSPENDED', 403)
    }

    const ok = await bcrypt.compare(password, (user as any).password)
    if (!ok) throw new AppError('INVALID_CREDENTIALS', 401)

    const jti = uuidv4()
    const access = signAccess({ sub: (user as any).id, jti })
    const refresh = signRefresh({ sub: (user as any).id, jti })

    await authRepository.createAdminSession(
      (user as any).id,
      jti,
      ip,
      userAgent,
      new Date(Date.now() + REFRESH_TTL_MS)
    )

    return { access, refresh }
  }

  async refresh(token: string, ip: string, userAgent: string | null) {
    let payload: any
    try {
      payload = verifyRefresh(token)
    } catch {
      throw new AppError('INVALID_REFRESH', 401)
    }

    const sess = await authRepository.findActiveSession(
      payload.sub,
      payload.jti
    )
    if (!sess) throw new AppError('SESSION_REVOKED', 401)

    const newJti = uuidv4()
    await authRepository.revokeSession(sess)

    await authRepository.createAdminSession(
      payload.sub,
      newJti,
      ip,
      userAgent,
      new Date(Date.now() + REFRESH_TTL_MS)
    )

    const newAccess = signAccess({ sub: payload.sub, jti: newJti })
    const newRefresh = signRefresh({ sub: payload.sub, jti: newJti })

    return { access: newAccess, refresh: newRefresh }
  }

  async logout(token: string | undefined) {
    if (token) {
      try {
        const payload: any = verifyRefresh(token)
        await authRepository.revokeSessionByCriteria(payload.sub, payload.jti)
      } catch {
        // ignore
      }
    }
    return { ok: true }
  }

  async getAccessInfo(adminId: number | undefined) {
    if (!adminId) throw new AppError('UNAUTHORIZED', 401)

    const user = await authRepository.findAdminById(adminId)
    if (!user) throw new AppError('ADMIN_NOT_FOUND', 404)

    const roleSlugs = (user as any).roles?.map((r: any) => r.slug) ?? []
    const permSet = new Set<string>()
    for (const r of (user as any).roles ?? []) {
      for (const p of r.permissions ?? []) {
        if (p?.slug) permSet.add(p.slug)
      }
    }
    const permissionSlugs = Array.from(permSet)

    return {
      id: (user as any).id,
      email: (user as any).email,
      roles: roleSlugs,
      permissions: permissionSlugs
    }
  }
}

export const authService = new AuthService()
