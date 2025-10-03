import { Worker, QueueEvents } from "bullmq";
import IORedis from "ioredis";
import { ENV } from "../env";
import { http, svcHeaders } from "../httpClient";
import { logger } from "../logger";
import { Order } from "@digishop/db/src/models/Order";
import { OrderStatusHistory } from "@digishop/db/src/models/OrderStatusHistory";
import { OrderStatus } from "@digishop/db/src/types/enum";
import { Op } from "sequelize";

export type CompleteJob = {
  orderId: number;
  deliveredAt: string;
  correlationId?: string;
};

export function startAutoCompleteWorker(connection: IORedis) {
  // const connection = new IORedis(ENV.REDIS_URL, { maxRetriesPerRequest: null });
  const queueName = ENV.COMPLETE_QUEUE_NAME;

  const worker = new Worker<CompleteJob>(
    queueName,
    async (job) => {
      const { orderId, correlationId } = job.data;

      const order = await Order.findByPk(orderId, { attributes: ["id", "status"] });
      if (!order) return { skipped: true, reason: "ORDER_NOT_FOUND" };

      // ต้องยังอยู่ใน DELIVERED เท่านั้น (ถ้าไป REFUND_* แล้วให้ข้าม)
      if (order.status !== OrderStatus.DELIVERED) return { skipped: true, reason: "NOT_DELIVERED" };

      // ถ้าเคยมี REFUND_REQUEST หลัง delivered ให้ข้าม
      const refundRequested = await OrderStatusHistory.findOne({
        where: {
          orderId,
          toStatus: { [Op.in]: [OrderStatus.REFUND_REQUEST, OrderStatus.REFUND_PROCESSING, OrderStatus.REFUND_APPROVED] }
        }
      });
      if (refundRequested) return { skipped: true, reason: "REFUND_FLOW_EXIST" };

      // complete
      const res = await http.patch(
        `/api/merchant/orders/${orderId}`,
        { status: "COMPLETE", reason: "Auto-complete after delivered window" },
        { headers: svcHeaders(correlationId ?? String(job.id)) }
      );
      logger.info({ jobId: job.id, orderId, newStatus: res.data?.data?.status }, "auto-complete executed");
      return res.data;
    },
    { connection, concurrency: ENV.CONCURRENCY }
  );

  const qe = new QueueEvents(queueName, { connection });
  qe.on("completed", ({ jobId }) => logger.info({ jobId }, "auto-complete completed"));
  qe.on("failed", ({ jobId, failedReason }) => logger.error({ jobId, failedReason }, "auto-complete failed"));

  return { worker, qe };
}
