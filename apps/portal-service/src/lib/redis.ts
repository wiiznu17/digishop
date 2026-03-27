import Redis, { RedisOptions } from 'ioredis'

function pickRedisUrl() {
  const raw = process.env.REDIS_URL ?? ''
  const preferPublic =
    process.env.USE_PUBLIC_REDIS === '1' ||
    process.env.NODE_ENV !== 'production'

  // ถ้า dev/local และมี public URL ให้ใช้ public (เชื่อมจากเครื่องเรา)
  if (preferPublic && process.env.REDIS_PUBLIC_URL) {
    return process.env.REDIS_PUBLIC_URL!
  }
  return raw
}

function buildOptions(url: URL): RedisOptions {
  const base: RedisOptions = {
    lazyConnect: true,
    family: 0, // แก้ ENOTFOUND จาก DNS IPv6-only
    // ให้ ioredis ไม่ fail คิว/คำสั่งตอนต่อไม่ติด (ดีสำหรับ BullMQ / worker)
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    retryStrategy(times) {
      // backoff: 0.5s, 1s, 2s, ... สูงสุด 5s
      const delay = Math.min(500 * Math.pow(2, times), 5000)
      return delay
    }
  }

  // ถ้าเป็น rediss:// ใส่ TLS ให้เอง
  if (url.protocol === 'rediss:') {
    base.tls = {} // ค่าเริ่มต้นพอแล้ว (ไม่ต้องใส่ rejectUnauthorized ถ้า CA ถูกต้อง)
  }

  return base
}

const picked = pickRedisUrl()
if (!picked) {
  // ช่วยเตือนตั้งแต่ตอนบูต
  // (อย่าทำ throw ตรงนี้ ถ้าต้องการให้แอปยังรันได้โดยไม่ใช้ Redis)
  // eslint-disable-next-line no-console
  console.warn('[redis] Missing REDIS_URL (or REDIS_PUBLIC_URL for local).')
}

const parsed = new URL(picked || 'redis://localhost:6379')
export const redis = new Redis(parsed.toString(), buildOptions(parsed))

export async function ensureRedis(): Promise<void> {
  try {
    // ต่อแบบ on-demand ถ้ายังไม่เชื่อม
    if (redis.status === 'wait' || redis.status === 'end') {
      await redis.connect()
    }
    await redis.ping()
    console.log('[redis] connected:', parsed.hostname, parsed.port)
  } catch (error) {
    console.error('[redis] connection error:', error)
    throw error
  }
}

// ช่วยปิดให้เรียบร้อยตอนโปรเซสจะจบ (optional)
process.once('SIGTERM', async () => {
  try {
    await redis.quit()
  } catch {
    redis.disconnect()
  }
})
