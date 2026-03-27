import type { Request, Response } from 'express'
import { AuthService } from '../services/AuthService'
import { asyncHandler } from '../utils/asyncHandler'

const IS_PROD = process.env.NODE_ENV === 'production'
const ATK_NAME = process.env.JWT_ACCESS_COOKIE_NAME || 'access_token'
const RTK_NAME = process.env.JWT_REFRESH_COOKIE_NAME || 'refresh_token'
const ACCESS_TOKEN_TTL_MS =
  Number(process.env.ACCESS_TOKEN_TTL_MS) || 15 * 60 * 1000
const REFRESH_TOKEN_TTL_MS =
  Number(process.env.REFRESH_TOKEN_TTL_MS) || 30 * 24 * 60 * 60 * 1000

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

function setAuthCookies(res: Response, access: string, refresh: string) {
  res.cookie(ATK_NAME, access, { ...BASE_COOKIE, maxAge: ACCESS_TOKEN_TTL_MS })
  res.cookie(RTK_NAME, refresh, {
    ...REFRESH_COOKIE,
    maxAge: REFRESH_TOKEN_TTL_MS
  })
}

function clearAuthCookies(res: Response) {
  res.clearCookie(ATK_NAME, { ...BASE_COOKIE, maxAge: undefined })
  res.clearCookie(RTK_NAME, { ...REFRESH_COOKIE, maxAge: undefined })
}

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = (req.body ?? {}) as {
    email: string
    password: string
  }
  if (!email || !password) {
    return res.status(400).json({ error: 'EMAIL_PASSWORD_REQUIRED' })
  }

  const { user, tokens } = await AuthService.login(
    email,
    password,
    req.ip,
    req.headers['user-agent'] as string
  )

  setAuthCookies(res, tokens.access, tokens.refresh)
  return res.json({ ok: true, user })
})

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[RTK_NAME]
  if (!token) return res.status(401).json({ error: 'NO_REFRESH' })

  const { tokens } = await AuthService.refresh(
    token,
    req.ip,
    req.headers['user-agent'] as string
  )

  setAuthCookies(res, tokens.access, tokens.refresh)
  return res.json({ ok: true })
})

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[RTK_NAME]
  await AuthService.logout(token || '')
  clearAuthCookies(res)
  return res.json({ ok: true })
})

// GET /api/auth/me — requires authenticateUser middleware
export const access = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).userId as number | undefined
  if (!userId) return res.status(401).json({ error: 'UNAUTHORIZED' })

  const user = await AuthService.getMe(userId)
  return res.json(user)
})
