import type { Request, Response, NextFunction } from 'express'
import { redis } from '../lib/redis/client'
import { JWTPayload, verifyAccess } from '../lib/jwt'

const SESSION_PREFIX = process.env.SESSION_PREFIX || 'usr:rt'
const ATK_NAME = process.env.JWT_ACCESS_COOKIE_NAME || 'access_token'

const sessKey = (jti: string) => `${SESSION_PREFIX}:${jti}`

export async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.cookies?.[ATK_NAME]
    if (!token) return res.status(401).json({ error: 'UNAUTHORIZED' })

    const payload = verifyAccess<JWTPayload>(token)
    if (!payload?.jti) return res.status(401).json({ error: 'UNAUTHORIZED' })

    const raw = await redis.get(sessKey(payload.jti))
    if (!raw) return res.status(401).json({ error: 'SESSION_REVOKED' })

    const sess = JSON.parse(raw) as {
      userId?: number | string
      jti: string
      expiresAt?: number
    }
    if (sess.expiresAt && sess.expiresAt < Date.now())
      return res.status(401).json({ error: 'SESSION_EXPIRED' })
    ;(req as any).userId = sess.userId ?? payload.sub
    ;(req as any).jwt = payload
    next()
  } catch {
    return res.status(401).json({ error: 'UNAUTHORIZED' })
  }
}
