import { Request, Response } from "express";
import { Transaction } from "sequelize";
import { sequelize } from '@digishop/db';

import { Order } from "@digishop/db/src/models/Order";
import { OrderStatusHistory } from "@digishop/db/src/models/OrderStatusHistory";
import { ReturnShipment } from "@digishop/db/src/models/ReturnShipment";
import { ReturnShipmentEvent } from "@digishop/db/src/models/ReturnShipmentEvent";

import { OrderStatus, ReturnShipmentStatus } from "@digishop/db/src/types/enum";

// ───────────────────────────────────────────────────────────────────────────────
// Transition rules

export const RETURN_ALLOW_NEXT: Record<ReturnShipmentStatus, ReadonlyArray<ReturnShipmentStatus>> = {
  [ReturnShipmentStatus.AWAITING_DROP]: [ReturnShipmentStatus.RETURN_IN_TRANSIT, ReturnShipmentStatus.RETURN_TIME_OUT],
  [ReturnShipmentStatus.RETURN_IN_TRANSIT]: [ReturnShipmentStatus.DELIVERED_BACK, ReturnShipmentStatus.RETURN_FAILED],
  [ReturnShipmentStatus.DELIVERED_BACK]: [],
  [ReturnShipmentStatus.RETURN_FAILED]: [],
  [ReturnShipmentStatus.RETURN_TIME_OUT]: []

};

export function canReturnTransition(from: ReturnShipmentStatus, to: ReturnShipmentStatus) {
  return RETURN_ALLOW_NEXT[from]?.includes(to) ?? false;
}

// ───────────────────────────────────────────────────────────────────────────────
// Helpers

async function moveOrderStatus(order: Order, to: OrderStatus, t: Transaction, reason?: string) {
  const from = order.status as OrderStatus;
  await order.update({ status: to } as any, { transaction: t });
  await OrderStatusHistory.create({
    orderId: order.id,
    fromStatus: from,
    toStatus: to,
    changedByType: "SYSTEM",
    changedById: 0,
    reason: reason ?? null,
    source: "SYSTEM",
    correlationId: null,
    metadata: {},
  } as any, { transaction: t });
}

// ───────────────────────────────────────────────────────────────────────────────
// Controller: webhook (ใช้ร่วมกับ middleware ชุด returnCarrierMiddleware)

export async function returnCarrierWebhook(req: Request, res: Response) {
  try {
    const ctx = req.returnCarrierCtx!;
    const {
      carrierCode,
      payload,
      trackingNumber,
      eventTime,
      nextReturnStatus,
      returnShipment,
      isDuplicateEvent,
      orderRecord,
      nextOrderStatus,
    } = ctx;

    if (isDuplicateEvent) {
      return res.json({ ok: true, skipped: "duplicate_event" });
    }

    await sequelize.transaction(async (t) => {
      // 1) log event
      await ReturnShipmentEvent.create({
        returnShipmentId: returnShipment!.id,
        fromStatus: (ctx.lastEventStatus) as ReturnShipmentStatus,
        toStatus: nextReturnStatus,
        occurredAt: eventTime,
        description: payload?.description || null,
        location: payload?.location || null,
        payload,
      } as any, { transaction: t });

      // 2) transition RS (ตาม allowed map)
      const from = returnShipment!.status as ReturnShipmentStatus;
      if (canReturnTransition(from, nextReturnStatus)) {
        const patch: any = { status: nextReturnStatus };
        if (nextReturnStatus === ReturnShipmentStatus.RETURN_IN_TRANSIT && !returnShipment!.trackingNumber) {
          patch.trackingNumber = trackingNumber;
        }
        if (nextReturnStatus === ReturnShipmentStatus.DELIVERED_BACK && !returnShipment!.deliveredBackAt) {
          patch.deliveredBackAt = eventTime;
        }
        if (!returnShipment!.carrier) {
          patch.carrier = carrierCode;
        }
        await returnShipment!.update(patch, { transaction: t });
      }

      // 3) side-effects ต่อ Order
      if (orderRecord && nextOrderStatus) {
        // DELIVERED_BACK -> RECEIVE_RETURN อีกเคสคือ time out
        await moveOrderStatus(
          orderRecord,
          nextOrderStatus,
          t,
          `Auto from return carrier (${carrierCode})`
        );
      }
    });

    return res.json({
      ok: true,
      updateReturnStatus: ReturnShipmentStatus[nextReturnStatus],
      updateOrderStatus: orderRecord ? OrderStatus[(req.returnCarrierCtx!.nextOrderStatus as OrderStatus) ?? (orderRecord.status as OrderStatus)] : null,
    });
  } catch (err) {
    console.error("returnCarrierWebhook error:", err);
    return res.status(500).json({ error: "Return webhook processing failed" });
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Controller: auto-timeout (worker/cron)

export async function markReturnFailed(req: Request, res: Response) {
  const id = Number(req.params.id);
  try {
    const rs = await ReturnShipment.findByPk(id);
    if (!rs) return res.status(404).json({ error: "return_shipment_not_found" });

    if (rs.status !== ReturnShipmentStatus.AWAITING_DROP) {
      return res.status(409).json({ error: "invalid_state" });
    }
    if (!rs.deadlineDropoffAt || rs.deadlineDropoffAt > new Date()) {
      return res.status(409).json({ error: "not_due_yet" });
    }

    await sequelize.transaction(async (t) => {
      // อัปเดต RS -> FAILED
      await rs.update({ status: ReturnShipmentStatus.RETURN_FAILED } as any, { transaction: t });

      // log event
      await ReturnShipmentEvent.create({
        returnShipmentId: rs.id,
        fromStatus: ReturnShipmentStatus.AWAITING_DROP,
        toStatus: ReturnShipmentStatus.RETURN_FAILED,
        occurredAt: new Date(),
        description: "Auto fail by deadline",
      } as any, { transaction: t });

      // Order side-effect
      const order = await Order.findByPk(rs.orderId, { transaction: t });
      if (order && order.status === OrderStatus.AWAITING_RETURN) {
        await moveOrderStatus(order, OrderStatus.RETURN_FAIL, t, "Deadline missed");
      }
    });

    res.json({ ok: true });
  } catch (e) {
    console.error("markReturnFailed error:", e);
    res.status(500).json({ error: "mark_return_failed" });
  }
}
