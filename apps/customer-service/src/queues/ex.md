```sh
import { Request, Response } from "express";
import { refundQueue } from "../queues/refundQueue";
import { Order } from "@digishop/db/src/models/Order";
import { OrderStatusHistory } from "@digishop/db/src/models/OrderStatusHistory";
import { OrderStatus } from "@digishop/db/src/types/enum";

export async function requestRefund(req: Request, res: Response) {
  const { orderId } = req.params;
  const { reason } = req.body ?? {};

  // 1) ตรวจว่ามี order จริงไหม
  const order = await Order.findByPk(orderId);
  if (!order) return res.status(404).json({ error: "Order not found" });

  // 2) อัพเดตสถานะเป็น REFUND_REQUEST + เขียน OrderStatusHistory
  const prev = order.get("status") as OrderStatus;
  await order.update({ status: OrderStatus.REFUND_REQUEST } as any);

  const correlationId =
    (req.headers["x-request-id"] as string) ||
    (req.headers["x-correlation-id"] as string) ||
    undefined;

  await OrderStatusHistory.create({
    orderId: Number(orderId),
    fromStatus: prev,
    toStatus: OrderStatus.REFUND_REQUEST,
    changedByType: "CUSTOMER",
    changedById: (req as any)?.user?.id ?? null,
    reason: reason ?? null,
    source: "WEB",
    correlationId,
    metadata: { ip: req.ip, ua: req.headers["user-agent"] ?? null }
  } as any);

  // 3) ส่งงานเข้าคิวให้ worker ตัดสินใจ auto-approve
  await refundQueue.add(
    "auto-approve",
    {
      orderId: Number(orderId),
      requestedAt: new Date().toISOString(),
      correlationId,
      reason
    },
    {
      attempts: 8,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: 1000,
      removeOnFail: 1000
    }
  );

  return res.json({ ok: true });
}

```