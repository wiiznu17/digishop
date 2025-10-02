import { Queue } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const REFUND_QUEUE_NAME = process.env.REFUND_QUEUE_NAME || "refund-auto-approve";

let _queue: Queue | null = null;

function getConnection() {
  return new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
}

export function getRefundQueue() {
  if (!_queue) {
    _queue = new Queue(REFUND_QUEUE_NAME, {
      connection: getConnection(),
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 3000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    });
  }
  return _queue;
}

/** ส่งงานเข้าคิวให้ merchant-worker ไป auto-approve (ถ้าเงื่อนไขผ่าน)
 *  - orderId: เลขออเดอร์
 *  - reason: เหตุผลที่ลูกค้าขอ refund
 *  - correlationId: ใช้ trace end-to-end (จะใส่ลง header X-Request-Id ตอน worker ยิงไป merchant-service)
 */
export async function enqueueRefundAutoApprove(params: {
  orderId: number;
  reason?: string;
  correlationId?: string;
}) {
  const queue = getRefundQueue();
  return queue.add(
    "refund-auto-approve",
    {
      orderId: params.orderId,
      requestedAt: new Date().toISOString(),
      correlationId: params.correlationId,
      reason: params.reason,
    },
    { jobId: `refund:${params.orderId}:${Date.now()}` }
  );
}
