import IORedis from "ioredis";

const url = process.env.REDIS_URL || "redis://localhost:6379";
// ถ้า provider บังคับ TLS ให้ตั้งเป็น rediss:// แล้วเพิ่ม options ตามต้องการ
export const redis = new IORedis(url, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
});

redis.on("error", (e) => console.error("[redis] error:", e));
redis.on("connect", () => console.log("[redis] connected"));
