import { Request, Response } from "express";
import { Transaction } from "sequelize";

import { Order } from "@digishop/db/src/models/Order";
import { OrderStatusHistory } from "@digishop/db/src/models/OrderStatusHistory";
import { ShipmentEvent } from "@digishop/db/src/models/ShipmentEvent";
import { ShippingStatus, OrderStatus } from "@digishop/db/src/types/enum";
import sequelize from "@digishop/db";
import type { CarrierContext } from "../middlewares/carrierMiddleware";

// Allowed Next Status Maps

const SHIP_ALLOW_NEXT: Record<ShippingStatus, ReadonlyArray<ShippingStatus>> = {
  [ShippingStatus.READY_TO_SHIP]: [ShippingStatus.RECEIVE_PARCEL],
  [ShippingStatus.RECEIVE_PARCEL]: [ShippingStatus.ARRIVED_SORTING_CENTER],
  [ShippingStatus.ARRIVED_SORTING_CENTER]: [ShippingStatus.OUT_SORTING_CENTER],
  [ShippingStatus.OUT_SORTING_CENTER]: [ShippingStatus.ARRIVED_DESTINATION_STATION],
  [ShippingStatus.ARRIVED_DESTINATION_STATION]: [ShippingStatus.OUT_FOR_DELIVERY],
  [ShippingStatus.OUT_FOR_DELIVERY]: [ShippingStatus.DELIVERED, ShippingStatus.DELIVERY_FAILED, ShippingStatus.TRANSIT_ISSUE],
  [ShippingStatus.DELIVERED]: [],
  [ShippingStatus.DELIVERY_FAILED]: [ShippingStatus.RETURN_TO_SENDER_IN_TRANSIT],
  [ShippingStatus.RETURN_TO_SENDER_IN_TRANSIT]: [ShippingStatus.RETURNED_TO_SENDER],
  [ShippingStatus.RETURNED_TO_SENDER]: [],
  [ShippingStatus.TRANSIT_ISSUE]: [ShippingStatus.RE_TRANSIT, ShippingStatus.RETURN_TO_SENDER_IN_TRANSIT],
  [ShippingStatus.RE_TRANSIT]: [ShippingStatus.OUT_FOR_DELIVERY],
} as any;

const ORDER_ALLOW_NEXT: Record<OrderStatus, ReadonlyArray<OrderStatus>> = {
  [OrderStatus.READY_TO_SHIP]: [OrderStatus.HANDED_OVER],
  [OrderStatus.HANDED_OVER]: [OrderStatus.SHIPPED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.TRANSIT_LACK],
  [OrderStatus.TRANSIT_LACK]: [OrderStatus.RE_TRANSIT],
  [OrderStatus.RE_TRANSIT]: [OrderStatus.DELIVERED, OrderStatus.TRANSIT_LACK],
  [OrderStatus.AWAITING_RETURN]: [OrderStatus.RECEIVE_RETURN],
} as any;

function canShipTransition(from: ShippingStatus | null, to: ShippingStatus): boolean {
  if (from === null) return true; // อนุญาตเริ่มต้นกรณีไม่ทราบสถานะก่อนหน้า
  const allowed = SHIP_ALLOW_NEXT[from];
  if (!allowed) return true; // ถ้าไม่ตั้งแมป ให้ถือว่าอนุญาต (ปรับได้)
  return allowed.includes(to);
}

function canOrderTransition(from: OrderStatus, to: OrderStatus): boolean {
  const allowed = ORDER_ALLOW_NEXT[from];
  if (!allowed) return true; // ถ้าไม่ตั้งแมป ให้ถือว่าอนุญาต (ปรับได้)
  return allowed.includes(to);
}

async function moveOrderStatus(
  orderRecord: any,
  fromStatus: OrderStatus,
  toStatus: OrderStatus,
  trx: Transaction,
  changedBy: "SYSTEM" | "MERCHANT" | "CUSTOMER",
  reason?: string
) {
  // กันพลาด: ตรวจการอนุญาตก่อน
  if (!canOrderTransition(fromStatus, toStatus)) {
    throw new Error(`[order] illegal transition ${OrderStatus[fromStatus]} -> ${OrderStatus[toStatus]}`);
  }

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

    if (isDuplicateEvent) {
      return res.json({ ok: true, skipped: "duplicate_event" });
    }

    // ตรวจ shipping transition “ก่อน” เริ่ม transaction (เร็วกว่า)
    const fromShip: ShippingStatus | null =
      (lastEventStatus as ShippingStatus | undefined) ??
      (shippingInfo!.shippingStatus as ShippingStatus | undefined) ??
      null;

    if (!canShipTransition(fromShip, nextShippingStatus)) {
      return res.status(409).json({
        ok: false,
        error: "illegal_shipping_transition",
        from: fromShip === null ? null : ShippingStatus[fromShip],
        to: ShippingStatus[nextShippingStatus],
      });
    }

    // ถ้ามี order ที่ต้องเลื่อนสถานะตาม mapping ก็ตรวจสิทธิ์ด้วย
    if (orderRecord && nextOrderStatus) {
      const fromOrder = orderRecord.status as OrderStatus;
      if (!canOrderTransition(fromOrder, nextOrderStatus)) {
        return res.status(409).json({
          ok: false,
          error: "illegal_order_transition",
          from: OrderStatus[fromOrder],
          to: OrderStatus[nextOrderStatus],
        });
      }
    }

    let shippingAutoChained: ShippingStatus | null = null;
    let orderAutoChained: { from: OrderStatus; to: OrderStatus } | null = null;

    await sequelize.transaction(async (trx) => {
      // 1) บันทึก ShipmentEvent ปัจจุบัน
      await ShipmentEvent.create(
        {
          shippingInfoId: shippingInfo!.id,
          fromStatus: fromShip,
          toStatus: nextShippingStatus,
          description:
            payload.description || payload.status_text || payload.message || null,
          location: payload.location || payload.facility || null,
          rawPayload: payload,
          occurredAt: eventTime,
        } as any,
        { transaction: trx }
      );

      // 2) อัปเดต ShippingInfo เป็นสถานะที่เข้ามา
      const shippingPatch: any = { shippingStatus: nextShippingStatus };
      if (nextShippingStatus === ShippingStatus.DELIVERED && !shippingInfo!.deliveredAt) {
        shippingPatch.deliveredAt = eventTime;
      }
      if (
        nextShippingStatus === ShippingStatus.RETURNED_TO_SENDER &&
        !shippingInfo!.returnedToSenderAt
      ) {
        shippingPatch.returnedToSenderAt = eventTime;
      }
      await shippingInfo!.update(shippingPatch, { transaction: trx });

      // 2.1 กรณีพิเศษ: TRANSIT_ISSUE → ถ้า OUT_FOR_DELIVERY ครบ ≥ 3 ครั้ง ให้ chain เป็น RETURN_TO_SENDER_IN_TRANSIT
      if (nextShippingStatus === ShippingStatus.TRANSIT_ISSUE) {
        const oodCount = await ShipmentEvent.count({
          where: {
            shippingInfoId: shippingInfo!.id,
            toStatus: ShippingStatus.OUT_FOR_DELIVERY,
          },
          transaction: trx,
        });

        if (
          oodCount >= 3 &&
          shippingInfo!.shippingStatus !== ShippingStatus.RETURN_TO_SENDER_IN_TRANSIT
        ) {
          // ตรวจอนุญาต chain
          if (canShipTransition(ShippingStatus.TRANSIT_ISSUE, ShippingStatus.RETURN_TO_SENDER_IN_TRANSIT)) {
            await ShipmentEvent.create(
              {
                shippingInfoId: shippingInfo!.id,
                fromStatus: ShippingStatus.TRANSIT_ISSUE,
                toStatus: ShippingStatus.RETURN_TO_SENDER_IN_TRANSIT,
                description: "Auto transition after 3 OUT_FOR_DELIVERY attempts",
                location: null,
                rawPayload: { autoChained: true, carrierCode },
                occurredAt: eventTime, // หรือ new Date() ก็ได้
              } as any,
              { transaction: trx }
            );
            await shippingInfo!.update(
              { shippingStatus: ShippingStatus.RETURN_TO_SENDER_IN_TRANSIT },
              { transaction: trx }
            );
            shippingAutoChained = ShippingStatus.RETURN_TO_SENDER_IN_TRANSIT;
          }
        }
      }

      // 3) เลื่อนสถานะ Order ตาม mapping + กรณีพิเศษ TRANSIT_LACK
      if (orderRecord && nextOrderStatus) {
        const currentOrderStatus = orderRecord.status as OrderStatus;

        if (nextOrderStatus === OrderStatus.TRANSIT_LACK) {
          // นับ SHIPPED ใน OrderStatusHistory
          const shippedCount = await OrderStatusHistory.count({
            where: { orderId: orderRecord.id, toStatus: OrderStatus.SHIPPED },
            transaction: trx,
          });

          if (shippedCount >= 3) {
            // chain: current -> TRANSIT_LACK -> AWAITING_RETURN
            await moveOrderStatus(
              orderRecord,
              currentOrderStatus,
              OrderStatus.TRANSIT_LACK,
              trx,
              "SYSTEM",
              `Auto set TRANSIT_LACK from carrier ${carrierCode} (TRANSIT_ISSUE)`
            );
            if (canOrderTransition(OrderStatus.TRANSIT_LACK, OrderStatus.AWAITING_RETURN)) {
              await moveOrderStatus(
                orderRecord,
                OrderStatus.TRANSIT_LACK,
                OrderStatus.AWAITING_RETURN,
                trx,
                "SYSTEM",
                "Auto escalate to AWAITING_RETURN after 3 SHIPPED occurrences"
              );
              orderAutoChained = {
                from: OrderStatus.TRANSIT_LACK,
                to: OrderStatus.AWAITING_RETURN,
              };
            }
          } else {
            // ยังไม่ครบ 3 → ไป TRANSIT_LACK ตาม mapping ปกติ
            await moveOrderStatus(
              orderRecord,
              currentOrderStatus,
              nextOrderStatus,
              trx,
              "SYSTEM",
              `Auto transition from carrier ${carrierCode}`
            );
          }
        } else {
          // สถานะอื่น ๆ ใช้ mapping ปกติ
          await moveOrderStatus(
            orderRecord,
            currentOrderStatus,
            nextOrderStatus,
            trx,
            "SYSTEM",
            `Auto transition from carrier ${carrierCode}`
          );
        }
      }
    });

    return res.json({
      ok: true,
      updateShippingStatus: ShippingStatus[nextShippingStatus],
      shippingAutoChained: shippingAutoChained ? ShippingStatus[shippingAutoChained] : null,
      updateOrderStatus: orderRecord ? OrderStatus[(req.carrierCtx!.nextOrderStatus as OrderStatus) ?? (orderRecord.status as OrderStatus)] : null,
      orderAutoChained: orderAutoChained
        ? orderAutoChained
        : null
    });
  } catch (err) {
    console.error("carrierWebhook error:", err);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}
