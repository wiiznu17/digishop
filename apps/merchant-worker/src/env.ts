export const ENV = {
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  REFUND_QUEUE_NAME: process.env.REFUND_QUEUE_NAME || "refund-auto-approve",

  MERCHANT_BASE: process.env.MERCHANT_BASE || "http://localhost:4000",
  MERCHANT_SERVICE_TOKEN: process.env.MERCHANT_SERVICE_TOKEN || "super-secret-service-token",

  CONCURRENCY: Number(process.env.WORKER_CONCURRENCY || 5)
};
