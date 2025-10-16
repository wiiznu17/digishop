import { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import { Order, OrderStatus, ReturnShipment, ReturnShipmentEvent, ReturnShipmentStatus } from "@digishop/db";

// Types

// export interface ReturnCarrierContext {
//   carrierCode: string;
//   payload: any;
//   payloadRaw: string;
//   signatureHeader?: string;

//   trackingNumber: string;
//   eventTime: Date;
//   nextReturnStatus: ReturnShipmentStatus;

//   returnShipment?: any; // ReturnShipment instance
//   lastEventStatus?: ReturnShipmentStatus | null;
//   isDuplicateEvent?: boolean;

//   orderRecord?: any; // Order instance
//   nextOrderStatus?: OrderStatus | null; // computed next order status (based on return status)
// }

// declare module "express-serve-static-core" {
//   interface Request {
//     returnCarrierCtx?: ReturnCarrierContext;
//   }
// }

// mapping order status trigger
export function computeNextOrderFromReturn(
  currentOrderStatus: OrderStatus,
  nextReturnStatus: ReturnShipmentStatus
): OrderStatus | null {
  switch (nextReturnStatus) {
    case ReturnShipmentStatus.DELIVERED_BACK:
      return currentOrderStatus === OrderStatus.AWAITING_RETURN
        ? OrderStatus.RECEIVE_RETURN
        : null;
    // case ReturnShipmentStatus.RETURN_FAILED:
    //   return currentOrderStatus === OrderStatus.AWAITING_RETURN
    //     ? OrderStatus.RETURN_FAIL
    //     : null;
    default:
      return null;
  }
}

// Middlewares

// 1) เก็บฐานข้อมูลจาก path/headers/body
export function rcmwParseBase(req: Request, _res: Response, next: NextFunction) {
  const carrierCode = String(req.params.carrier || "").toUpperCase();
  const payload = req.body ?? {};
  const payloadRaw = JSON.stringify(payload);
  const signatureHeader = req.headers["x-signature"] as string | undefined;

  req.returnCarrierCtx = {
    carrierCode,
    payload,
    payloadRaw,
    signatureHeader,
    trackingNumber: "",
    eventTime: new Date(),
    nextReturnStatus: ReturnShipmentStatus.RETURN_IN_TRANSIT,
  };
  next();
}

/** 2) ตรวจลายเซ็น (optional) — ใช้ env แยกจาก shipping ได้ เช่น RETURN_CARRIER_WEBHOOK_SECRET */
export function rcmwVerifySignature(req: Request, res: Response, next: NextFunction) {
  const secret = process.env.RETURN_CARRIER_WEBHOOK_SECRET;
  if (!secret) return next();

  const canonical = req.returnCarrierCtx?.payloadRaw || JSON.stringify(req.body ?? {});
  const mac = crypto.createHmac("sha256", secret).update(canonical, "utf8").digest();

  const sigHex = (req.returnCarrierCtx!.signatureHeader || "").trim();
  const provided = Buffer.from(sigHex.replace(/^sha256=/i, ""), "hex");
  const ok = provided.length === mac.length && crypto.timingSafeEqual(mac, provided);
  if (!ok) return res.status(401).json({ error: "Bad signature" });

  next();
}

// 3) ดึงฟิลด์หลัก: trackingNumber / eventTime / nextReturnStatus
export function rcmwExtractCoreFields(req: Request, res: Response, next: NextFunction) {
  const p = req.returnCarrierCtx!.payload;

  const trackingNumber = p.trackingNumber
  if (!trackingNumber) return res.status(400).json({ error: "Missing tracking number" });

  const eventTime = new Date(p.occurredAt ?? p.timestamp ?? Date.now());
  const nextReturnStatus = p.status;

  req.returnCarrierCtx!.trackingNumber = String(trackingNumber);
  req.returnCarrierCtx!.eventTime = eventTime;
  req.returnCarrierCtx!.nextReturnStatus = nextReturnStatus;
  next();
}

// 4) โหลด ReturnShipment จาก orderid (ถ้าไม่พบ ตอบ 202 — รับไว้ก่อน)
export async function rcmwLoadReturnShipment(req: Request, res: Response, next: NextFunction) {
  const rs = await ReturnShipment.findOne({
    where: { orderId: req.returnCarrierCtx!.payload.orderId },
  });
  if (!rs) return res.status(202).json({ ok: true, skipped: "return_shipment_not_found" });

  req.returnCarrierCtx!.returnShipment = rs;
  next();
}

/** 5) กันเหตุการณ์ซ้ำ: สถานะเดียวกันภายใน 60 วินาที */
export async function rcmwDeduplicateEvent(req: Request, _res: Response, next: NextFunction) {
  const rs = req.returnCarrierCtx!.returnShipment!;
  const lastEvent = await ReturnShipmentEvent.findOne({
    where: { returnShipmentId: rs.id },
    order: [
      ["occurredAt", "DESC"],
      ["id", "DESC"],
    ],
  });

  req.returnCarrierCtx!.lastEventStatus =
    (lastEvent?.get("toStatus") as ReturnShipmentStatus | undefined) ?? (rs.status as ReturnShipmentStatus) ?? null;

  if (lastEvent && lastEvent.get("toStatus") === req.returnCarrierCtx!.nextReturnStatus) {
    const diffMs = Math.abs(
      new Date(lastEvent.get("occurredAt") as any).getTime() - req.returnCarrierCtx!.eventTime.getTime()
    );
    if (diffMs < 60_000) req.returnCarrierCtx!.isDuplicateEvent = true;
  }
  next();
}

/** 6) โหลด Order + คำนวณ nextOrderStatus จากสถานะขากลับ */
export async function rcmwComputeOrderTransition(req: Request, _res: Response, next: NextFunction) {
  const rs = req.returnCarrierCtx!.returnShipment!;
  const orderRecord = await Order.findByPk(rs.orderId);
  req.returnCarrierCtx!.orderRecord = orderRecord ?? undefined;

  if (orderRecord) {
    const currentOrderStatus = orderRecord.status as OrderStatus;
    req.returnCarrierCtx!.nextOrderStatus = computeNextOrderFromReturn(
      currentOrderStatus,
      req.returnCarrierCtx!.nextReturnStatus
    );
  }
  console.log("fianl req.rtCarrier: ", req.returnCarrierCtx)
  next();
}
