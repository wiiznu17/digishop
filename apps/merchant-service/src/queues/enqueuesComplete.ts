import { Queue } from "bullmq";
import IORedis from "ioredis";

export type CompleteJob = {
  orderId: number;
  deliveredAt: string;
  correlationId?: string;
};
// await removeJobById(completeQueue, `complete:${orderId}`);
// เมื่อลูกค้าขอคืนสินค้า หรือกดยอมรับเองไปแล้วให้ลบคิวออก
export async function removeJobById(q: Queue, jobId: string) {
  const job = await q.getJob(jobId);
  if (job) await job.remove();
}

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const COMPLETE_QUEUE_NAME = process.env.COMPLETE_QUEUE_NAME || "auto-complete";

const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

const completeQueue= new Queue<CompleteJob>(COMPLETE_QUEUE_NAME,{ connection });

export async function enqueueAutoComplete(input: CompleteJob, opts?: { delayMs?: number }) {
  const delay = opts?.delayMs ?? Number(process.env.DELIVERED_AUTOCOMPLETE_AFTER_MS || 604_800_000); // 7 day
  await completeQueue.add("auto-complete", input, {
    jobId: `complete:${input.orderId}`,
    delay,
    attempts: 3,
    backoff: { type: "fixed", delay: 10000 },
    removeOnComplete: 1000,
    removeOnFail: false
  });
}
