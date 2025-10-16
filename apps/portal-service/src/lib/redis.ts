import Redis from "ioredis"

const url = process.env.REDIS_URL ?? ""
export const redis = new Redis(url, { lazyConnect: true })

export async function ensureRedis(): Promise<void> {
  try {
    await redis.ping()
    console.log("Redis connected")
  } catch (error) {
    console.error("Redis connection error:", error)
    throw error
  }
}
