import IORedis from "ioredis";

const url = process.env.REDIS_URL || "redis://localhost:6379";
// ตั้งค่า reconnect เบา ๆ
export const redis = new IORedis(url, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
});

redis.on("error", (e) => {
  console.error("[redis] error:", e);
});
redis.on("connect", () => {
  console.log("[redis] connected");
});
