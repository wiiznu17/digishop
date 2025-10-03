import { Worker, QueueEvents } from "bullmq";
import IORedis from "ioredis";
import { ENV } from "../env";
import { http, svcHeaders } from "../httpClient";
import { logger } from "../logger";
import { Order } from "@digishop/db/src/models/Order";
import { Payment } from "@digishop/db/src/models/Payment";
import { PaymentStatus, OrderStatus } from "@digishop/db/src/types/enum";

export type CancelJob = {
  orderId: number;
  createdAt: string;
  correlationId?: string;
  reason?: string;
};

export function startAutoCancelWorker(connection: IORedis) {
  // const connection = new IORedis(ENV.REDIS_URL, { maxRetriesPerRequest: null });
  const queueName = ENV.CANCEL_QUEUE_NAME;
  const worker = new Worker<CancelJob>(
    queueName,
    async (job) => {
      const { orderId, correlationId } = job.data;

      // เช็คว่ายัง PENDING อยู่?
      const order = await Order.findByPk(orderId, { attributes: ["id", "status", "checkoutId"] });
      if (!order) return { skipped: true, reason: "ORDER_NOT_FOUND" };
      if (order.status !== OrderStatus.PENDING) return { skipped: true, reason: "NOT_PENDING" };

      // ยังไม่จ่าย?
      const pay = await Payment.findOne({ where: { checkoutId: order.checkoutId }, attributes: ["status"] });
      const unpaid = !pay || pay.status === PaymentStatus.PENDING;
      if (!unpaid) return { skipped: true, reason: "ALREADY_PAID" };

      // เรียก merchant-service → CUSTOMER_CANCELED
      const res = await http.patch(
        `/api/merchant/orders/${orderId}`,
        { status: "CUSTOMER_CANCELED", reason: "Auto-cancel due to unpaid timeout" },
        { headers: svcHeaders(correlationId ?? String(job.id)) }
      );
      logger.info({ jobId: job.id, orderId, newStatus: res.data?.data?.status }, "auto-cancel executed");
      return res.data;
    },
    { connection, concurrency: ENV.CONCURRENCY }
  );

  const qe = new QueueEvents(queueName, { connection });
  qe.on("completed", ({ jobId }) => logger.info({ jobId }, "auto-cancel completed"));
  qe.on("failed", ({ jobId, failedReason }) => logger.error({ jobId, failedReason }, "auto-cancel failed"));

  return { worker, qe };
}
