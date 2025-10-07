import { Request, Response } from "express";
import { Transaction } from "sequelize";

import { Order } from "@digishop/db/src/models/Order";
import { OrderStatusHistory } from "@digishop/db/src/models/OrderStatusHistory";
import { ShipmentEvent } from "@digishop/db/src/models/ShipmentEvent";
import { ShippingStatus, OrderStatus } from "@digishop/db/src/types/enum";
import sequelize from "@digishop/db";
import type { CarrierContext } from "../middlewares/carrierMiddleware";

// เปลี่ยนสถานะ Order พร้อม log ประวัติ
async function moveOrderStatus(
  orderRecord: any,
  fromStatus: OrderStatus,
  toStatus: OrderStatus,
  trx: Transaction,
  changedBy: "SYSTEM" | "MERCHANT" | "CUSTOMER",
  reason?: string
) {
  await orderRecord.update({ status: toStatus } as any, { transaction: trx });
  await OrderStatusHistory.create(
    {
      orderId: orderRecord.id,
      fromStatus,
      toStatus,
      changedByType: changedBy,
      changedById: 0,
      reason: reason ?? null,
      source: "SYSTEM",
      correlationId: null,
      metadata: {},
    } as any,
    { transaction: trx }
  );
}

// ───────────────────────────────────────────────────────────────────────────────

export async function carrierWebhook(req: Request, res: Response) {
  try {
    const ctx = req.carrierCtx as CarrierContext;
    const {
      shippingInfo,
      nextShippingStatus,
      eventTime,
      payload,
      carrierCode,
      isDuplicateEvent,
      orderRecord,
      nextOrderStatus,
      lastEventStatus,
    } = ctx;

    if (isDuplicateEvent) return res.json({ ok: true, skipped: "duplicate_event" });

    await sequelize.transaction(async (trx) => {
      // 1) เพิ่ม ShipmentEvent
      await ShipmentEvent.create(
        {
          shippingInfoId: shippingInfo!.id,
          fromStatus: lastEventStatus ?? shippingInfo!.shippingStatus ?? null,
          toStatus: nextShippingStatus,
          description:
            payload.description || payload.status_text || payload.message || null,
          location: payload.location || payload.facility || null,
          rawPayload: payload,
          occurredAt: eventTime,
        } as any,
        { transaction: trx }
      );

      // 2) อัปเดต ShippingInfo
      const shippingPatch: any = { shippingStatus: nextShippingStatus };
      if (nextShippingStatus === ShippingStatus.DELIVERED && !shippingInfo!.deliveredAt)
        shippingPatch.deliveredAt = eventTime;
      if (
        nextShippingStatus === ShippingStatus.RETURNED_TO_SENDER &&
        !shippingInfo!.returnedToSenderAt
      )
        shippingPatch.returnedToSenderAt = eventTime;

      await shippingInfo!.update(shippingPatch, { transaction: trx });

      // 3) ถ้าควรเลื่อนสถานะ Order ให้เลื่อน
      if (orderRecord && nextOrderStatus) {
        await moveOrderStatus(
          orderRecord,
          orderRecord.status as OrderStatus,
          nextOrderStatus,
          trx,
          "SYSTEM",
          `Auto transition from carrier ${carrierCode}`
        );
      }
    });

    return res.json({
      ok: true,
      updateShippingStatus: nextShippingStatus,
      updateOrderStatus: nextOrderStatus
     });
  } catch (err) {
    console.error("carrierWebhook error:", err);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}
