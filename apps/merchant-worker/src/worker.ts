import { Worker, QueueEvents } from "bullmq";
import IORedis from "ioredis";
import { http, svcHeaders } from "./httpClient";
import { ENV } from "./env";
import { logger } from "./logger";

// DB models
import * as db from "@digishop/db";
import { OrderStatusHistory } from "@digishop/db/src/models/OrderStatusHistory";
import { OrderStatus } from "@digishop/db/src/types/enum";

export type RefundJob = {
  orderId: number;
  requestedAt: string;
  correlationId?: string;
  reason?: string;
};

export async function initDb() {
  await db.checkDatabaseConnection();
  logger.info({}, "DB connected");
}

export function startRefundWorker() {
  const connection = new IORedis(ENV.REDIS_URL, { maxRetriesPerRequest: null });
  const queueName = ENV.REFUND_QUEUE_NAME;

  const worker = new Worker<RefundJob>(
    queueName,
    async (job) => {
      const { orderId, correlationId, reason } = job.data;

      // 1) ถ้าเคย DELIVERED → ข้าม (ร้านต้อง action เอง)
      const delivered = await OrderStatusHistory.findOne({
        where: { orderId, toStatus: OrderStatus.DELIVERED },
        order: [["created_at", "DESC"]]
      });
      if (delivered) {
        logger.info({ jobId: job.id, orderId }, "Skip auto-approve (already DELIVERED)");
        return { skipped: true, reason: "ALREADY_DELIVERED" };
      }

      // 2) ยืนยันว่าเคสล่าสุดคือ REFUND_REQUEST จริง
      const last = await OrderStatusHistory.findOne({
        where: { orderId },
        order: [["created_at", "DESC"]]
      });
      if (!last || last.get("toStatus") !== OrderStatus.REFUND_REQUEST) {
        logger.info({ jobId: job.id, orderId }, "Skip (not in REFUND_REQUEST)");
        return { skipped: true, reason: "NOT_REFUND_REQUEST" };
      }

      // 3) อนุมัติอัตโนมัติ
      logger.info({ jobId: job.id, orderId }, "Auto-approve refund...");
      console.log("header: ", svcHeaders(correlationId ?? String(job.id)))
      const res = await http.patch(
        `/api/merchant/orders/${orderId}`,
        {
          status: "REFUND_APPROVED",
          reason: reason ?? "Auto-approve by worker (requested before delivery)"
        },
        { headers: svcHeaders(correlationId ?? String(job.id)) }
      );

      logger.info({ jobId: job.id, orderId, newStatus: res.data?.data?.status }, "Approved");
      return res.data;
    },
    { connection, concurrency: ENV.CONCURRENCY }
  );

  const qe = new QueueEvents(queueName, { connection });

  qe.on("completed", ({ jobId }) => logger.info({ jobId }, "Job completed"));
  qe.on("failed", ({ jobId, failedReason }) => logger.error({ jobId, failedReason }, "Job failed"));
  worker.on("error", (err) => logger.error({ err }, "Worker error"));

  const close = async () => {
    await Promise.allSettled([worker.close(), qe.close(), connection.quit()]);
  };
  return { worker, qe, close };
}
