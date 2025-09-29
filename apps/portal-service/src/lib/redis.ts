import Redis from "ioredis"

const url = process.env.REDIS_URL ?? "redis://localhost:6379"
export const redis = new Redis(url, { lazyConnect: true })

export async function ensureRedis(): Promise<void> {
  if (redis.status === "end") await redis.connect()
}
