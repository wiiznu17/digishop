import { Queue } from "bullmq";
import IORedis from "ioredis";

export type RefundJob = {
  orderId: number;
  requestedAt: string;
  correlationId?: string;
  reason?: string;
};

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const REFUND_QUEUE_NAME = process.env.REFUND_QUEUE_NAME || "refund-auto-approve";

const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

export const refundQueue = new Queue<RefundJob>(REFUND_QUEUE_NAME, { connection });
