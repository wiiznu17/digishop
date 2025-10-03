import { Queue } from "bullmq";
import IORedis from "ioredis";

export type CancelJob = {
  orderId: number;
  correlationId?: string;
};
// await removeCancelJobById(cancelQueue, `complete:${orderId}`);
// เมื่อลูกค้ายกเลิก ให้ลบคิวออก
export async function removeCancelJobById(q: Queue, jobId: string) {
  const job = await q.getJob(jobId);
  if (job) await job.remove();
}

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const CANCEL_QUEUE_NAME = process.env.CANCEL_QUEUE_NAME || "auto-cancel-unpaid";

const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

const cancelQueue= new Queue<CancelJob>(CANCEL_QUEUE_NAME,{ connection });

export async function enqueueAutoCancel(input: CancelJob, opts?: { delayMs?: number }) {
  const delay = opts?.delayMs ?? Number(process.env.DELIVERED_AUTOCOMPLETE_AFTER_MS || 604_800_000); // 7 day
  await cancelQueue.add("auto-cancel-unpaid", input, {
    jobId: `cancel:${input.orderId}`,
    delay,
    attempts: 3,
    backoff: { type: "fixed", delay: 10000 },
    removeOnComplete: 1000,
    removeOnFail: false
  });
}
