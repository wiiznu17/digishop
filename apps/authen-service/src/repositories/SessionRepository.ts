import { redis } from '../lib/redis/client'
import { toMillis } from '../lib/duration'

const SESSION_PREFIX = process.env.SESSION_PREFIX || 'usr:rt'
const SESSION_INDEX_PREFIX = process.env.SESSION_INDEX_PREFIX || 'usr:rt:idx'
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || '30d'
const REFRESH_TTL_MS = toMillis(REFRESH_TOKEN_TTL)

export interface RefreshSession {
  userId: number | string
  jti: string
  ip?: string | null
  userAgent?: string | null
  createdAt: number
  expiresAt: number
}

const sessKey = (jti: string) => `${SESSION_PREFIX}:${jti}`
const indexKey = (userId: string | number) =>
  `${SESSION_INDEX_PREFIX}:${userId}`

export class SessionRepository {
  static async getSession(jti: string): Promise<RefreshSession | null> {
    const raw = await redis.get(sessKey(jti))
    if (!raw) return null
    return JSON.parse(raw) as RefreshSession
  }

  static async setSession(
    userId: number | string,
    jti: string,
    session: RefreshSession
  ) {
    const idxKey = indexKey(userId)
    const oldJti = await redis.get(idxKey)
    const pipe = redis.multi()

    if (oldJti) pipe.del(sessKey(oldJti))
    pipe.set(sessKey(jti), JSON.stringify(session), 'PX', REFRESH_TTL_MS)
    pipe.set(idxKey, jti, 'PX', REFRESH_TTL_MS)

    await pipe.exec()
  }

  static async revokeSession(userId: string | number, jti: string) {
    const idxKey = indexKey(userId)
    const currentJti = await redis.get(idxKey)
    const pipe = redis.multi()

    pipe.del(sessKey(jti))
    if (currentJti === jti) pipe.del(idxKey)

    await pipe.exec()
  }
}
