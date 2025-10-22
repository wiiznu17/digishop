import { delay, Queue } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "";
const REFUND_QUEUE_NAME = process.env.REFUND_QUEUE_NAME || "";
const AUTO_CANCEL_TIMEOUT = process.env.AUTO_CANCEL_TIMEOUT || "";

export type RefundJob = {
  orderId: number;
  requestedAt: string;
  correlationId?: string;
  reason?: string;
};


const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
const queue = new Queue<RefundJob>(REFUND_QUEUE_NAME, { connection });

export async function enqueueRefundAutoApprove(job: RefundJob) {
  return queue.add("refund-auto-approve", job, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 }, // delay retry after fail 5, 10, 15, ...
    removeOnComplete: 1000,
    removeOnFail: 1000,
  });
}



