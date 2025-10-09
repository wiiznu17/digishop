import { NextFunction, Request, Response } from "express";
import crypto from "crypto";

import { ShippingInfo } from "@digishop/db/src/models/ShippingInfo";
import { ShipmentEvent } from "@digishop/db/src/models/ShipmentEvent";
import { Order } from "@digishop/db/src/models/Order";
import sequelize from "@digishop/db";

import { ShippingStatus, OrderStatus } from "@digishop/db/src/types/enum";

// ───────────────────────────────────────────────────────────────────────────────
// Types

export interface CarrierContext {
  carrierCode: string;
  payload: any;
  payloadRaw: string;
  signatureHeader?: string;

  trackingNumber: string;
  eventTime: Date;
  nextShippingStatus: ShippingStatus;

  shippingInfo?: any; // ShippingInfo instance
  lastEventStatus?: ShippingStatus | null;
  isDuplicateEvent?: boolean;

  orderRecord?: any; // Order instance
  nextOrderStatus?: OrderStatus | null; // computed next order status
}

declare module "express-serve-static-core" {
  interface Request {
    carrierCtx?: CarrierContext;
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// แมะสถานะการขนส่งกับระบบเรา ตอนนี้ให้มีค่าเหมือนกัน
function normalizeCarrierStatus(payload: any): ShippingStatus {
  const status = (payload.status)
    .toUpperCase()
    .trim();

  switch (status) {
    case "RECEIVE_PARCEL":
      return ShippingStatus.RECEIVE_PARCEL;
    case "ARRIVED_SORTING_CENTER":
      return ShippingStatus.ARRIVED_SORTING_CENTER;
    case "OUT_SORTING_CENTER":
      return ShippingStatus.OUT_SORTING_CENTER;
    case "ARRIVED_DESTINATION_STATION":
      return ShippingStatus.ARRIVED_DESTINATION_STATION;
    case "OUT_FOR_DELIVERY":
      return ShippingStatus.OUT_FOR_DELIVERY;
    case "DELIVERED":
      return ShippingStatus.DELIVERED;
    case "DELIVERY_FAILED":
      return ShippingStatus.DELIVERY_FAILED;
    case "RETURN_TO_SENDER_IN_TRANSIT":
      return ShippingStatus.RETURN_TO_SENDER_IN_TRANSIT;
    case "RETURNED_TO_SENDER":
      return ShippingStatus.RETURNED_TO_SENDER;
    case "TRANSIT_ISSUE":
      return ShippingStatus.TRANSIT_ISSUE;
    case "RE_TRANSIT":
      return ShippingStatus.RE_TRANSIT;
    default:
      return ShippingStatus.PENDING;
  }
}

// สรุปว่าจะเปลี่ยน Order ไปสถานะไหนจาก shipping status ปัจจุบัน
function computeNextOrderStatus(
  currentOrderStatus: OrderStatus,
  nextShippingStatus: ShippingStatus
): OrderStatus | null {
  switch (nextShippingStatus) {
    case ShippingStatus.RECEIVE_PARCEL:
      return currentOrderStatus === OrderStatus.READY_TO_SHIP
        ? OrderStatus.HANDED_OVER
        : null;
    case ShippingStatus.OUT_FOR_DELIVERY:
      return currentOrderStatus === OrderStatus.HANDED_OVER
        ? OrderStatus.SHIPPED
        : null;
    case ShippingStatus.DELIVERED:
      return [OrderStatus.SHIPPED, OrderStatus.RE_TRANSIT].includes(
        currentOrderStatus
      )
        ? OrderStatus.DELIVERED
        : null;
    case ShippingStatus.DELIVERY_FAILED:
      return currentOrderStatus === OrderStatus.SHIPPED
        ? OrderStatus.AWAITING_RETURN
        : null;
    case ShippingStatus.RETURNED_TO_SENDER:
      return currentOrderStatus === OrderStatus.AWAITING_RETURN
        ? OrderStatus.RECEIVE_RETURN
        : null;
    case ShippingStatus.TRANSIT_ISSUE:
      return [OrderStatus.SHIPPED, OrderStatus.RE_TRANSIT].includes(
        currentOrderStatus
      )
        ? OrderStatus.TRANSIT_LACK
        : null;
    case ShippingStatus.RE_TRANSIT:
      return currentOrderStatus === OrderStatus.TRANSIT_LACK
        ? OrderStatus.RE_TRANSIT
        : null;
    default:
      return null;
  }
}

// Middlewares

// 1) อ่านพารามิเตอร์พื้นฐาน + เก็บ payload raw
export function cmwParseBase(req: Request, _res: Response, next: NextFunction) {
  const carrierCode = String(req.params.carrier || "").toUpperCase();
  const payload = req.body ?? {};
  const payloadRaw = JSON.stringify(payload); // postman เซ็นจาก format นี้
  const signatureHeader = (req.headers["x-signature"] as string);
  req.carrierCtx = {
    carrierCode,
    payload,
    payloadRaw,
    signatureHeader,
    trackingNumber: "",
    eventTime: new Date(),
    nextShippingStatus: ShippingStatus.PENDING,
  };
  // console.log("cmwParseBase: ", req.carrierCtx)
  next();
}

// 2) ตรวจลายเซ็น (ถ้ามีการตั้งค่า secret) ยังไม่ใช้
export function cmwVerifySignature(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const secret = process.env.CARRIER_WEBHOOK_SECRET;
  if (!secret) return next();
  const canonical = req.carrierCtx?.payloadRaw || JSON.stringify(req.body ?? {});
  const mac = crypto
    .createHmac("sha256", secret)
    .update(canonical, "utf8")
    .digest(); // ได้ Buffer

  const sigHex = (req.carrierCtx!.signatureHeader || "").trim();
  const provided = Buffer.from(sigHex.replace(/^sha256=/i, ""), "hex");
  const ok = provided.length === mac.length && crypto.timingSafeEqual(mac, provided);
  if (!ok) return res.status(401).json({ error: "Bad signature" });

  next();
}

// 3) ดึงฟิลด์หลัก: trackingNumber / eventTime / nextShippingStatus
export function cmwExtractCoreFields(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const p = req.carrierCtx!.payload;
  // console.log("cmwExtractCoreFields: ", p)
  const trackingNumber = p.trackingNumber;
  if (!trackingNumber)
    return res.status(400).json({ error: "Missing tracking number" });

  const eventTime = new Date(p.occurredAt);
  const nextShippingStatus = normalizeCarrierStatus(p);

  req.carrierCtx!.trackingNumber = String(trackingNumber);
  req.carrierCtx!.eventTime = eventTime;
  req.carrierCtx!.nextShippingStatus = nextShippingStatus;
  // console.log("Final cmwExtractCoreFields: ", req.carrierCtx)
  next();
}

// 4) โหลด ShippingInfo (ถ้าไม่พบให้ตอบ 202)
export async function cmwLoadShippingInfo(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const shippingInfo = await ShippingInfo.findOne({
    where: { trackingNumber: req.carrierCtx!.trackingNumber },
  });
  if (!shippingInfo) return res.status(202).json({ ok: true }); // รับไว้แต่ไม่ทำอะไร
  req.carrierCtx!.shippingInfo = shippingInfo;
  console.log("cmwLoadShippingInfo: ", shippingInfo)
  next();
}

// กันเหตุการณ์ซ้ำ (สถานะเดียวกันภายใน 60 วินาที)
export async function cmwDeduplicateEvent(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const shippingInfo = req.carrierCtx!.shippingInfo!;
  const lastEvent = await ShipmentEvent.findOne({
    where: { shippingInfoId: shippingInfo.id },
    order: [
      ["occurredAt", "DESC"],
      ["id", "DESC"],
    ],
  });

  req.carrierCtx!.lastEventStatus =
    (lastEvent?.get("toStatus") as ShippingStatus) ??
    shippingInfo.shippingStatus ??
    null;

  if (
    lastEvent &&
    lastEvent.get("toStatus") === req.carrierCtx!.nextShippingStatus
  ) {
    const diffMs = Math.abs(
      new Date(lastEvent.get("occurredAt") as any).getTime() -
        req.carrierCtx!.eventTime.getTime()
    );
    if (diffMs < 60_000) req.carrierCtx!.isDuplicateEvent = true;
  }
  console.log("is duplicat event : ", req.carrierCtx!.isDuplicateEvent)
  next();
}

// 6) โหลด Order + คำนวณ nextOrderStatus ตามกติกา
export async function cmwComputeOrderTransition(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const shippingInfo = req.carrierCtx!.shippingInfo!;
  const orderRecord = await Order.findByPk(shippingInfo.orderId);
  req.carrierCtx!.orderRecord = orderRecord ?? undefined;

  if (orderRecord) {
    const currentOrderStatus = orderRecord.status as OrderStatus;
    console.log("Current order status: ", currentOrderStatus)
    req.carrierCtx!.nextOrderStatus = computeNextOrderStatus(
      currentOrderStatus,
      req.carrierCtx!.nextShippingStatus
    );
  }
  console.log("req.carrierCtx!.nextOrderStatus = ", req.carrierCtx!.nextOrderStatus)
  next();
}
