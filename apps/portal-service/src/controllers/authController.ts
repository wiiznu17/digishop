import type { Request, Response, RequestHandler } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { authService } from '../services/authService'

const IS_PROD = process.env.NODE_ENV === 'production'
const ATK_NAME = process.env.JWT_ACCESS_COOKIE_NAME || ''
const RTK_NAME = process.env.JWT_REFRESH_COOKIE_NAME || ''

const ACCESS_TTL_MS = 15 * 60 * 1000 // 15 นาที
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 วัน

const BASE_COOKIE: import('express').CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: '/',
  ...(IS_PROD ? ({ partitioned: true } as any) : {})
}

const REFRESH_COOKIE: import('express').CookieOptions = {
  ...BASE_COOKIE,
  path: '/api/auth/refresh'
}

function setAuthCookies(res: Response, accessJwt: string, refreshJwt: string) {
  res.cookie(ATK_NAME, accessJwt, { ...BASE_COOKIE, maxAge: ACCESS_TTL_MS })
  res.cookie(RTK_NAME, refreshJwt, {
    ...REFRESH_COOKIE,
    maxAge: REFRESH_TTL_MS
  })
}

function clearAuthCookies(res: Response) {
  res.clearCookie(ATK_NAME, { ...BASE_COOKIE, maxAge: undefined })
  res.clearCookie(RTK_NAME, { ...REFRESH_COOKIE, maxAge: undefined })
}

export const login: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const ip = req.ip || 'unknown'
    const userAgent = (req.headers['user-agent'] as string) || null

    const tokens = await authService.login(req.body ?? {}, ip, userAgent)
    setAuthCookies(res, tokens.access, tokens.refresh)

    res.json({ ok: true })
  }
)

export const refresh: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const token = (req as any).cookies?.[RTK_NAME]
    if (!token) return res.status(401).json({ error: 'NO_REFRESH' })

    const ip = req.ip || 'unknown'
    const userAgent = (req.headers['user-agent'] as string) || null

    try {
      const tokens = await authService.refresh(token, ip, userAgent)
      setAuthCookies(res, tokens.access, tokens.refresh)
      res.json({ ok: true })
    } catch (err: any) {
      if (
        err.message === 'INVALID_REFRESH' ||
        err.message === 'SESSION_REVOKED'
      ) {
        clearAuthCookies(res)
      }
      throw err
    }
  }
)

export const logout: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const token = (req as any).cookies?.[RTK_NAME]
    await authService.logout(token)

    clearAuthCookies(res)
    res.json({ ok: true })
  }
)

export const access: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const adminId = (req as any).adminId as number | undefined

    const result = await authService.getAccessInfo(adminId)
    res.json(result)
  }
)
