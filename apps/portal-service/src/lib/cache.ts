import Redis from "ioredis"
import crypto from "crypto"

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379"

let _redis: Redis | null = null
export function getRedis(): Redis {
  if (_redis) return _redis
  _redis = new Redis(REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 2
  })
  return _redis
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const r = await getRedis().get(key)
    if (!r) return null
    return JSON.parse(r) as T
  } catch {
    return null
  }
}

export async function cacheSet(key: string, value: unknown, ttlSec: number): Promise<void> {
  try {
    const json = JSON.stringify(value)
    await getRedis().set(key, json, "EX", Math.max(1, Math.floor(ttlSec)))
  } catch {
    // swallow
  }
}

export function weakEtag(value: unknown): string {
  const json = typeof value === "string" ? value : JSON.stringify(value)
  const h = crypto.createHash("sha1").update(json).digest("hex")
  return `W/"${h}"`
}
