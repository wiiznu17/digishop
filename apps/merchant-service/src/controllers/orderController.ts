import { Request, Response } from "express"
import axios from "axios"
import crypto from "crypto"
import { IncludeOptions, Op, WhereOptions, literal, Transaction } from "sequelize"

import { Order } from "@digishop/db/src/models/Order"
import { OrderItem } from "@digishop/db/src/models/OrderItem"
import { OrderStatusHistory } from "@digishop/db/src/models/OrderStatusHistory"
import { Payment } from "@digishop/db/src/models/Payment"
import { Product } from "@digishop/db/src/models/Product"
import { ShippingInfo } from "@digishop/db/src/models/ShippingInfo"
import { User } from "@digishop/db/src/models/User"
import { RefundOrder } from "@digishop/db/src/models/RefundOrder"
import { RefundStatusHistory } from "@digishop/db/src/models/RefundStatusHistory"
import { CheckOut } from "@digishop/db/src/models/CheckOut"
import { ShipmentEvent } from "@digishop/db/src/models/ShipmentEvent"
import { ReturnShipment } from "@digishop/db/src/models/ReturnShipment"
import { ReturnShipmentEvent } from "@digishop/db/src/models/ReturnShipmentEvent"
import { PaymentGatewayEvent } from "@digishop/db/src/models/PaymentGatewayEvent"

import {
  ReturnShipmentStatus,
  ShippingStatus,
  OrderStatus,
  RefundStatus,
  ActorType,
} from "@digishop/db/src/types/enum"
import sequelize from "@digishop/db"

// ───────────────────────────────────────────────────────────────────────────────
// Helpers

const toInt = (v: unknown, def: number) => (Number.isFinite(Number(v)) ? Number(v) : def)
const toNum = (v: unknown, def = 0) => (v == null ? def : Number(v))
const minorTo = (n?: number | string | null, dp = 2) => {
  const x = Number(n ?? 0)
  return Number((x / 100).toFixed(dp))
}

/** อ่านค่าได้ทั้ง camelCase/snake_case และทั้ง property/get() */
function read<T = any>(obj: any, ...keys: string[]): T | undefined {
  for (const k of keys) {
    if (!obj) continue
    const viaGet = typeof obj.get === "function" ? obj.get(k) : undefined
    if (viaGet !== undefined && viaGet !== null) return viaGet as T
    if (obj[k] !== undefined && obj[k] !== null) return obj[k] as T
  }
  return undefined
}

const SORT_WHITELIST = new Set<"id" | "createdAt" | "updatedAt" | "grandTotalMinor">([
  "id",
  "createdAt",
  "updatedAt",
  "grandTotalMinor",
])

// ───────────────────────────────────────────────────────────────────────────────
// PGW (Payment Gateway)

const PGW_BASE = process.env.PGW_BASE ?? "http://localhost:4002"
const PGW_API_ID = process.env.MERCHANRT_API_ID ?? ""
const PGW_API_KEY = process.env.MERCHANRT_API_KEY ?? ""
const PGW_PARTNER_ID = process.env.MERCHANRT_PARTNER_ID ?? ""
const PGW_LANG = (process.env.PGW_LANG ?? "en") as "en" | "th"

const pathTxnDetail = (ref: string) => `/transaction/${encodeURIComponent(ref)}`
const pathVoid = (ref: string) => `/transaction/${encodeURIComponent(ref)}/void`
const pathRefund = (ref: string) => `/transaction/${encodeURIComponent(ref)}/refund`

type PgwVoidRefundResp = { request_uid?: string; res_code?: string; res_desc?: string }
type PgwDetailResp = { status?: string; [k: string]: any }

function pgwHeaders(correlationId?: string) {
  return {
    "X-API-ID": PGW_API_ID,
    "X-API-Key": PGW_API_KEY,
    "X-Partner-ID": PGW_PARTNER_ID,
    "Accept-Language": PGW_LANG,
    ...(correlationId ? { "X-Request-Id": correlationId } : {}),
  }
}

function normalizeDetailStatus(s?: string) {
  const v = (s ?? "").toLowerCase().replace(/\s+|_/g, "")
  if (v === "approved") return "APPROVED"
  if (v === "presettled") return "PRE_SETTLED"
  if (v === "settled") return "SETTLED"
  return "UNKNOWN"
}

function sanitizeReason(input?: string | null): string {
  const s = (input ?? "").toString().trim()
  if (!s) return "Refund requested by merchant"
  return s.length > 255 ? s.slice(0, 255) : s
}

async function pgwGetDetail(reference: string, correlationId?: string) {
  const url = `${PGW_BASE}${pathTxnDetail(reference)}`
  const { data } = await axios.get<PgwDetailResp>(url, { headers: pgwHeaders(correlationId), timeout: 15000 })
  return data
}

async function pgwVoid(reference: string, reason: string, correlationId?: string) {
  const url = `${PGW_BASE}${pathVoid(reference)}`
  const { data } = await axios.post<PgwVoidRefundResp>(
    url,
    { reason: sanitizeReason(reason) },
    { headers: pgwHeaders(correlationId), timeout: 15000 }
  )
  return data
}

async function pgwRefund(reference: string, reason: string, correlationId?: string) {
  const url = `${PGW_BASE}${pathRefund(reference)}`
  const { data } = await axios.post<PgwVoidRefundResp>(
    url,
    { reason: sanitizeReason(reason) },
    { headers: pgwHeaders(correlationId), timeout: 15000 }
  )
  return data
}

function decidePgwAction(detailStatus: string): "VOID" | "REFUND" | "NONE" {
  const s = normalizeDetailStatus(detailStatus)
  if (s === "APPROVED") return "VOID"
  if (s === "PRE_SETTLED") return "REFUND"
  if (s === "SETTLED") return "REFUND"
  return "NONE"
}

function genRequestId() {
  return typeof (crypto as any).randomUUID === "function" ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex")
}

// ───────────────────────────────────────────────────────────────────────────────
// Includes — snapshot-first

const CHECKOUT_INCLUDE_BASE: IncludeOptions = {
  model: CheckOut,
  as: "checkout",
  attributes: ["id", "orderCode", "customerId"],
  paranoid: false,
  include: [
    {
      model: User,
      as: "customer",
      attributes: ["id", "email", "firstName", "lastName"],
    },
    {
      model: Payment,
      as: "payment",
      attributes: [
        "id",
        "paymentMethod",
        "status",
        "provider",
        "providerRef",
        "channel",
        "currencyCode",
        "amountAuthorizedMinor",
        "amountCapturedMinor",
        "amountRefundedMinor",
        "pgwStatus",
        "paidAt",
      ],
    },
  ],
}

const ORDER_BASE_INCLUDES: IncludeOptions[] = [
  CHECKOUT_INCLUDE_BASE,
  {
    model: ShippingInfo,
    as: "shippingInfo",
    attributes: [
      "id",
      "trackingNumber",
      "carrier",
      "shippingStatus",
      "shippedAt",
      "deliveredAt",
      "returnedToSenderAt",
      "createdAt",
      "updatedAt",
      "shipping_type_name_snapshot",
      "shipping_price_minor_snapshot",
      "address_snapshot",
    ],
    include: [
      {
        model: ShipmentEvent,
        as: "events",
        attributes: ["id", "fromStatus", "toStatus", "description", "location", "occurredAt", "createdAt"],
        separate: true,
        order: [["occurredAt", "ASC"], ["id", "ASC"]],
        required: false,
      },
    ],
    required: false,
  },
  {
    model: ReturnShipment,
    as: "returnShipments",
    attributes: [
      "id",
      "status",
      "carrier",
      "trackingNumber",
      "shippedAt",
      "deliveredBackAt",
      "fromAddressSnapshot",
      "toAddressSnapshot",
      "createdAt",
      "updatedAt",
    ],
    include: [
      {
        model: ReturnShipmentEvent,
        as: "events",
        attributes: ["id", "fromStatus", "toStatus", "description", "location", "occurredAt", "createdAt"],
        separate: true,
        order: [["occurredAt", "ASC"], ["id", "ASC"]],
        required: false,
      },
    ],
    required: false,
  },
  {
    model: OrderItem,
    as: "items",
    attributes: [
      "id",
      "quantity",
      "unit_price_minor",
      "discount_minor",
      "tax_rate",
      "product_name_snapshot",
      "product_sku_snapshot",
      "product_snapshot",
    ],
    include: [{ model: Product, as: "product", attributes: ["id", "name"] }],
    required: false,
  },
  {
    model: OrderStatusHistory,
    as: "statusHistory",
    attributes: ["id", "fromStatus", "toStatus", "reason", "createdAt"],
    separate: true,
    order: [["createdAt", "ASC"]],
    required: false,
  },
  {
    model: RefundOrder,
    as: "refundOrders",
    attributes: [
      "id",
      "reason",
      "amountMinor",
      "currencyCode",
      "status",
      "requestedBy",
      "requestedAt",
      "approvedAt",
      "refundedAt",
    ],
    required: false,
  },
]

// ───────────────────────────────────────────────────────────────────────────────
// Serializers

function serializeOrder(order: any) {
  const checkout = order.checkout
  const customer = checkout?.customer
  const ship = order.shippingInfo
  const pay = checkout?.payment
  const items = (order.items ?? []) as Array<any>
  const histories = (order.statusHistory ?? []) as Array<any>
  const refundOrders = (order.refundOrders ?? []) as Array<any>

  const grandMinor = read<number>(order, "grand_total_minor", "grandTotalMinor") ?? 0
  const shippingSnap = read<number>(ship, "shipping_price_minor_snapshot", "shippingPriceMinorSnapshot")
  const currency =
    read<string>(order, "currency_code", "currencyCode") ??
    read<string>(pay, "currency_code", "currencyCode") ??
    "THB"

  const customerName =
    read<string>(order, "customer_name_snapshot", "customerNameSnapshot") ??
    [customer?.firstName, customer?.lastName].filter(Boolean).join(" ")

  const customerEmail =
    read<string>(order, "customer_email_snapshot", "customerEmailSnapshot") ?? (customer?.email ?? "")

  const addrSnap = read<any>(ship, "address_snapshot", "addressSnapshot")

  const shippingAddress = addrSnap
    ? {
        recipientName: addrSnap.recipientName ?? addrSnap.recipient_name ?? "",
        phone: addrSnap.phone ?? "",
        addressNumber: addrSnap.addressNumber ?? addrSnap.address_number ?? undefined,
        building: addrSnap.building ?? undefined,
        subStreet: addrSnap.subStreet ?? addrSnap.sub_street ?? undefined,
        street: addrSnap.street ?? "",
        subdistrict: addrSnap.subdistrict ?? addrSnap.sub_district ?? undefined,
        district: addrSnap.district ?? "",
        province: addrSnap.province ?? "",
        postalCode: addrSnap.postalCode ?? addrSnap.postal_code ?? "",
        country: addrSnap.country ?? "TH",
      }
    : {
        recipientName: "",
        phone: "",
        street: "",
        district: "",
        province: "",
        postalCode: "",
        country: "TH",
      }

  const shippingTypeName = read<string>(ship, "shipping_type_name_snapshot", "shippingTypeNameSnapshot")

  const orderItems = items.map((it) => ({
    id: String(it.id),
    sku: read<string>(it, "product_sku_snapshot", "productSkuSnapshot") ?? String(it.product?.id ?? ""),
    name: read<string>(it, "product_name_snapshot", "productNameSnapshot") ?? (it.product?.name ?? ""),
    quantity: toInt(it.quantity, 0),
    price: minorTo(read<number>(it, "unit_price_minor", "unitPriceMinor"), 2),
    discount: minorTo(read<number>(it, "discount_minor", "discountMinor"), 2),
    taxRate: toNum(read<number>(it, "tax_rate", "taxRate"), 0),
  }))

  return {
    id: String(order.id),
    orderCode: order.checkout.orderCode,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,

    status: order.status,
    statusHistory: histories.map((h) => h.toStatus),

    currency,
    subtotal: minorTo(read<number>(order, "subtotal_minor", "subtotalMinor"), 2),
    shippingCost: minorTo(shippingSnap ?? read<number>(order, "shipping_fee_minor", "shippingFeeMinor"), 2),
    tax: minorTo(read<number>(order, "tax_total_minor", "taxTotalMinor"), 2),
    discount: minorTo(read<number>(order, "discount_total_minor", "discountTotalMinor"), 2),
    grandTotal: minorTo(grandMinor, 2),

    paymentMethod: read<string>(pay, "payment_method", "paymentMethod") ?? "",

    payment: pay
      ? {
          provider: read<string>(pay, "provider", "provider") ?? undefined,
          providerRef: read<string>(pay, "provider_ref", "providerRef") ?? undefined,
          channel: read<string>(pay, "channel", "channel") ?? undefined,
          pgwStatus: read<string>(pay, "pgw_status", "pgwStatus") ?? undefined,
          paidAt: read<Date>(pay, "paid_at", "paidAt") ?? undefined,
          authorized: minorTo(read<number>(pay, "amount_authorized_minor", "amountAuthorizedMinor"), 2),
          captured: minorTo(read<number>(pay, "amount_captured_minor", "amountCapturedMinor"), 2),
          refunded: minorTo(read<number>(pay, "amount_refunded_minor", "amountRefundedMinor"), 2),
        }
      : undefined,

    shippingType: shippingTypeName ?? undefined,
    trackingNumber: read<string>(ship, "tracking_number", "trackingNumber"),
    carrier: read<string>(ship, "carrier", "carrier"),
    shippedAt: read<Date>(ship, "shipped_at", "shippedAt"),
    deliveredAt: read<Date>(ship, "delivered_at", "deliveredAt"),
    returnedToSenderAt: read<Date>(ship, "returned_to_sender_at", "returnedToSenderAt"),
    shippingStatus: read<string>(ship, "shipping_status", "shippingStatus"),
    shippingAddress,

    // Outbound timeline
    shipping: ship
      ? {
          events: Array.isArray(ship.events)
            ? ship.events.map((e: any) => ({
                id: e.id,
                fromStatus: e.fromStatus ?? null,
                toStatus: e.toStatus,
                description: e.description ?? null,
                location: e.location ?? null,
                occurredAt: e.occurredAt,
                createdAt: e.createdAt,
              }))
            : [],
        }
      : undefined,

    // Return logistics
    returnShipments: Array.isArray(order.returnShipments)
      ? order.returnShipments.map((rs: any) => ({
          id: rs.id,
          status: rs.status as ReturnShipmentStatus,
          carrier: rs.carrier ?? null,
          trackingNumber: rs.trackingNumber ?? null,
          shippedAt: rs.shippedAt ?? null,
          deliveredBackAt: rs.deliveredBackAt ?? null,
          fromAddressSnapshot: rs.fromAddressSnapshot ?? null,
          toAddressSnapshot: rs.toAddressSnapshot ?? null,
          events: Array.isArray(rs.events)
            ? rs.events.map((e: any) => ({
                id: e.id,
                fromStatus: e.fromStatus ?? null,
                toStatus: e.toStatus,
                description: e.description ?? null,
                location: e.location ?? null,
                occurredAt: e.occurredAt,
                createdAt: e.createdAt,
              }))
            : [],
        }))
      : [],

    customerName,
    customerEmail,
    customerPhone: shippingAddress.phone ?? "",

    orderItems,

    // Note แสดงได้จาก snapshot แต่จะไม่แก้ใน endpoint updateOrder
    notes: read<string>(order, "order_note", "orderNote") ?? undefined,

    refunds: refundOrders.map((r: any) => ({
      id: r.id,
      status: r.status,
      amountMinor: r.amountMinor,
      currencyCode: r.currencyCode,
      reason: r.reason,
      requestedBy: r.requestedBy,
      requestedAt: r.requestedAt,
      approvedAt: r.approvedAt,
      refundedAt: r.refundedAt,
    })),
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// GET /orders/summary

export async function getOrdersSummary(req: Request, res: Response) {
  try {
    const { storeId, startDate, endDate } = req.query as Record<string, string>

    const orderWhere: any = {}
    if (storeId) orderWhere.storeId = storeId
    if (startDate || endDate) {
      orderWhere.createdAt = {
        ...(startDate ? { [Op.gte]: new Date(startDate) } : {}),
        ...(endDate ? { [Op.lte]: new Date(endDate) } : {}),
      }
    }

    const totalOrders = await Order.count({ where: orderWhere })
    const pendingPayment = await Order.count({ where: { ...orderWhere, status: "PENDING" } })

    const paidOrders = await OrderStatusHistory.count({
      distinct: true,
      col: "orderId",
      where: {
        toStatus: "PAID",
        ...(storeId
          ? {
              orderId: literal(
                `EXISTS (SELECT 1 FROM ORDERS o WHERE o.id = "OrderStatusHistory"."orderId" AND o.store_id = ${storeId})`
              ),
            }
          : {}),
        ...(startDate || endDate
          ? {
              createdAt: {
                ...(startDate ? { [Op.gte]: new Date(startDate) } : {}),
                ...(endDate ? { [Op.lte]: new Date(endDate) } : {}),
              },
            }
          : {}),
      },
    })

    const processing = await OrderStatusHistory.count({
      distinct: true,
      col: "orderId",
      where: { toStatus: { [Op.in]: ["PROCESSING", "READY_TO_SHIP"] } },
    })

    const handedOver = await OrderStatusHistory.count({
      distinct: true,
      col: "orderId",
      where: { toStatus: "HANDED_OVER" },
    })

    const refunds = await OrderStatusHistory.count({
      distinct: true,
      col: "orderId",
      where: { toStatus: { [Op.like]: "REFUND%" } },
    })

    const revenueOrders = await Order.findAll({
      attributes: ["grandTotalMinor"],
      where: {
        ...orderWhere,
        status: { [Op.notIn]: ["CUSTOMER_CANCELED", "MERCHANT_CANCELED", "REFUND_SUCCESS"] },
      },
      raw: true,
    })
    const totalRevenueMinor = revenueOrders.reduce((sum, o: any) => sum + (o.grandTotalMinor || 0), 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const completedToday = await Order.count({
      where: {
        ...orderWhere,
        status: { [Op.in]: ["DELIVERED", "COMPLETE"] },
        createdAt: { [Op.gte]: today, [Op.lt]: tomorrow },
      },
    })

    return res.json({
      data: {
        totalOrders,
        pendingPayment,
        paidOrders,
        processing,
        handedOver,
        refundRequests: refunds,
        totalRevenueMinor,
        totalRevenue: minorTo(totalRevenueMinor, 2),
        completedToday,
      },
    })
  } catch (err) {
    console.error("❌ getOrdersSummary error:", err)
    return res.status(500).json({ error: "Failed to fetch order summary" })
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// GET /orders
// ค้นหาได้เฉพาะ orderId (ตัวเลข) หรือ orderCode (prefix)

export async function listOrders(req: Request, res: Response) {
  try {
    const {
      page = "1",
      pageSize = "20",
      status,
      storeId,
      q,
      startDate,
      endDate,
      sortBy = "createdAt",
      sortDir = "DESC",
    } = req.query as Record<string, string>

    const limit = toInt(page, 1) > 0 ? toInt(pageSize, 20) : 20
    const offset = (toInt(page, 1) - 1) * limit

    const orderField = SORT_WHITELIST.has(sortBy as any) ? (sortBy as any) : "createdAt"
    const orderDir = String(sortDir).toUpperCase() === "ASC" ? "ASC" : "DESC"

    const whereOrder: WhereOptions = {}
    if (status && status !== "ALL") Object.assign(whereOrder, { status })
    if (storeId) Object.assign(whereOrder, { storeId })
    if (startDate || endDate) {
      Object.assign(whereOrder, {
        createdAt: {
          ...(startDate ? { [Op.gte]: new Date(startDate) } : {}),
          ...(endDate ? { [Op.lte]: new Date(endDate) } : {}),
        },
      })
    }

    const isNumericQ = q?.trim() && !isNaN(Number(q))
    const escapeLike = (s: string) => s.replace(/[%_]/g, "\\$&")
    const orderOr: WhereOptions[] = []
    if (isNumericQ) orderOr.push({ id: Number(q) })

    const checkoutInclude: IncludeOptions = {
      model: CheckOut,
      as: "checkout",
      attributes: ["id", "orderCode", "customerId"],
      paranoid: false,
      required: !!(q && q.trim() && !isNumericQ),
      where:
        q && q.trim() && !isNumericQ
          ? { orderCode: { [Op.like]: `${escapeLike(q.trim())}%` } }
          : undefined,
      include: [
        {
          model: Payment,
          as: "payment",
          attributes: [
            "id",
            "paymentMethod",
            "status",
            "provider",
            "providerRef",
            "channel",
            "currencyCode",
            "amountAuthorizedMinor",
            "amountCapturedMinor",
            "amountRefundedMinor",
            "pgwStatus",
            "paidAt",
          ],
        },
      ],
    }

    const finalWhere: WhereOptions = { ...whereOrder, ...(orderOr.length ? { [Op.or]: orderOr } : {}) }
    const includes: IncludeOptions[] = [checkoutInclude, ...ORDER_BASE_INCLUDES.filter(i => i.as !== "checkout")]

    const { rows, count } = await Order.findAndCountAll({
      where: finalWhere,
      include: includes,
      order: [[orderField, orderDir]],
      limit,
      offset,
      distinct: true,
    })

    const data = rows.map(serializeOrder)
    return res.json({ data, meta: { page: toInt(page, 1), pageSize: limit, total: count } })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Failed to fetch orders" })
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// PATCH /orders/:orderId
//
// Side-effects: เขียน OrderStatusHistory / sync ShippingInfo(+ShipmentEvent) / RefundOrder
// และถ้ามีการยิง PGW จะบันทึก PaymentGatewayEvent + RefundStatusHistory ให้ด้วย
// 
export async function updateOrder(req: Request, res: Response) {
  const { orderId } = req.params;

  const {
    status: nextStatusRaw,
    trackingNumber,
    carrier,
    reason,
  }: {
    status?: OrderStatus | string;
    trackingNumber?: string;
    carrier?: string;
    reason?: string;
  } = req.body || {};

  if (!orderId) return res.status(400).json({ error: "Missing order id" });

  // actor
  const isService = Boolean((req as any)?.serviceAuth);
  const changedById = (req as any)?.user?.sub ?? (req as any)?.user?.id ?? null;
  const changedByType = isService ? "SYSTEM" : "MERCHANT";
  const correlationId =
    (req.headers["x-request-id"] as string | undefined) ??
    (req.headers["x-correlation-id"] as string | undefined) ??
    null;

  // แผนที่ ShippingStatus ที่สัมพันธ์กับ OrderStatus ที่ "ร้าน" แตะได้
  const mapShipping: Record<string, ShippingStatus | undefined> = {
    READY_TO_SHIP: ShippingStatus.READY_TO_SHIP,
    HANDED_OVER: ShippingStatus.RECEIVE_PARCEL,
    RECEIVE_RETURN: ShippingStatus.RETURNED_TO_SENDER,
    // (สถานะขนส่งอื่นให้ระบบขนส่ง/เว็บฮุคเป็นคนอัปเดต)
  };

  // ── Allowed transitions: เฉพาะที่ร้าน/ระบบของร้านทำได้ (จาก state diagram)
  const MERCHANT_ALLOWED_NEXT: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.MERCHANT_CANCELED],
    [OrderStatus.PROCESSING]: [OrderStatus.READY_TO_SHIP],
    [OrderStatus.READY_TO_SHIP]: [OrderStatus.HANDED_OVER],

    // คำขอรีฟันด์ที่ร้านเป็นคนตัดสินใจ
    [OrderStatus.REFUND_REQUEST]: [
      OrderStatus.REFUND_APPROVED, // manual-approve หรือ auto-approve ก็เข้ามาที่นี่เหมือนกัน
      OrderStatus.AWAITING_RETURN,
      OrderStatus.REFUND_REJECTED, // ควรปฏิเสธได้แค่หลังจาก Delivered ถ้าหลังจากพึ่งจ่ายเงินจะ auto approve
    ],

    // กระบวนการรับของคืน/ตรวจสอบ
    [OrderStatus.AWAITING_RETURN]: [OrderStatus.RECEIVE_RETURN, OrderStatus.RETURN_FAIL],
    [OrderStatus.RECEIVE_RETURN]: [OrderStatus.RETURN_VERIFIED],
    [OrderStatus.RETURN_VERIFIED]: [OrderStatus.REFUND_APPROVED],

    // กรณี PGW ล้มเหลว ให้ร้านกด retry ได้
    [OrderStatus.REFUND_FAIL]: [OrderStatus.REFUND_RETRY],
  } as any;

  const TERMINAL = new Set<OrderStatus>([
    OrderStatus.COMPLETE,
    OrderStatus.CUSTOMER_CANCELED,
    OrderStatus.REFUND_SUCCESS,
    OrderStatus.RETURN_FAIL,
  ]);

  const t = await sequelize.transaction();
  let postCommit: null | (() => Promise<void>) = null;

  try {
    const order = await Order.findByPk(orderId, { include: ORDER_BASE_INCLUDES, transaction: t });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ error: "Order not found" });
    }

    const current = order.status as OrderStatus;
    const nextStatus = (nextStatusRaw as OrderStatus) || undefined;

    // ── อัปเดตเลขพัสดุ/ขนส่ง (เฉพาะช่วงที่ร้านแก้ได้จริง) — อนุญาตแม้ไม่เปลี่ยนสถานะ
    if ((trackingNumber || carrier) && [OrderStatus.READY_TO_SHIP, OrderStatus.HANDED_OVER].includes(current)) {
      let ship: any = (order as any).shippingInfo;
      if (!ship) {
        ship = await ShippingInfo.create(
          {
            orderId: Number(order.id),
            trackingNumber: trackingNumber ?? null,
            carrier: carrier ?? null,
            shippingStatus: ShippingStatus.READY_TO_SHIP,
          } as any,
          { transaction: t }
        );
        (order as any).shippingInfo = ship;
      } else {
        await ship.update(
          { ...(trackingNumber ? { trackingNumber } : {}), ...(carrier ? { carrier } : {}) },
          { transaction: t }
        );
      }
    }

    // ถ้าไม่มีการขอเปลี่ยนสถานะ ก็รีเทิร์นแค่การอัปเดต tracking/carrier
    if (!nextStatus) {
      await order.reload({ include: ORDER_BASE_INCLUDES, transaction: t });
      const dto = serializeOrder(order);
      await t.commit();
      return res.json({ data: dto });
    }

    // ── Validate terminal
    if (TERMINAL.has(current)) {
      await t.rollback();
      return res.status(400).json({ error: `Order is terminal (${current}), cannot transition` });
    }

    // ── Validate allowed next (merchant/system)
    const allowed = MERCHANT_ALLOWED_NEXT[current] ?? [];
    if (!allowed.includes(nextStatus)) {
      await t.rollback();
      return res
        .status(400)
        .json({ error: `Invalid transition for merchant: ${current} -> ${nextStatus}`, allowedNext: allowed });
    }

    // ── Update order status
    await order.update({ status: nextStatus } as any, { transaction: t });

    await OrderStatusHistory.create(
      {
        orderId: Number(order.id),
        fromStatus: current,
        toStatus: nextStatus,
        changedByType,
        changedById,
        reason: reason ?? null,
        source: isService ? "SERVICE" : "WEB",
        correlationId,
        metadata: { ip: req.ip, ua: req.headers["user-agent"] ?? null },
      } as any,
      { transaction: t }
    );

    // ── Sync Shipping (เฉพาะสถานะที่ร้านแตะได้)
    const ship: any = (order as any).shippingInfo;
    const newShipStatus = mapShipping[nextStatus];
    if (ship && newShipStatus) {
      const now = new Date();
      const lastEvent = await ShipmentEvent.findOne({
        where: { shippingInfoId: ship.id },
        order: [
          ["occurredAt", "DESC"],
          ["id", "DESC"],
        ],
        transaction: t,
      });
      const fromStatus = (lastEvent?.get("toStatus") as ShippingStatus | undefined) ?? ship.shippingStatus ?? null;

      const patch: any = { shippingStatus: newShipStatus };
      if (nextStatus === OrderStatus.HANDED_OVER && !ship.shippedAt) patch.shippedAt = now;
      if (nextStatus === OrderStatus.RECEIVE_RETURN && !ship.returnedToSenderAt) patch.returnedToSenderAt = now;
      await ship.update(patch, { transaction: t });

      await ShipmentEvent.create(
        {
          shippingInfoId: ship.id,
          fromStatus,
          toStatus: newShipStatus,
          description: `Order status changed to ${nextStatus} by ${changedByType}`,
          location: null,
          rawPayload: null,
          occurredAt: now,
        } as any,
        { transaction: t }
      );
    }

    // ── Return logistics: เคลื่อนไหวฝั่งคืนของ (เฉพาะที่ร้านทำได้)
    if (nextStatus === OrderStatus.RECEIVE_RETURN) {
      const ret = await ReturnShipment.findOne({ where: { orderId: order.id }, transaction: t });
      if (ret) {
        const before = ret.status;
        await ret.update({ status: ReturnShipmentStatus.DELIVERED_BACK }, { transaction: t });
        await ReturnShipmentEvent.create(
          {
            returnShipmentId: ret.id,
            fromStatus: before,
            toStatus: ReturnShipmentStatus.DELIVERED_BACK,
            occurredAt: new Date(),
            description: "Merchant received returned parcel",
          } as any,
          { transaction: t }
        );
      }
    }
    // if (nextStatus === OrderStatus.RETURN_VERIFIED) {
    //   const ret = await ReturnShipment.findOne({ where: { orderId: order.id }, transaction: t });
    //   if (ret && ret.status !== ReturnShipmentStatus.VERIFIED) {
    //     const before = ret.status;
    //     await ret.update({ status: ReturnShipmentStatus.VERIFIED }, { transaction: t });
    //     await ReturnShipmentEvent.create(
    //       {
    //         returnShipmentId: ret.id,
    //         fromStatus: before,
    //         toStatus: ReturnShipmentStatus.VERIFIED,
    //         occurredAt: new Date(),
    //         description: "Merchant verified returned item",
    //       } as any,
    //       { transaction: t }
    //     );
    //   }
    // }

    // ── Refunds: สร้าง/อัปเดต RefundOrder + RefundStatusHistory
    if (
      [
        OrderStatus.REFUND_REQUEST,
        OrderStatus.REFUND_APPROVED,
        OrderStatus.MERCHANT_CANCELED,
        OrderStatus.REFUND_SUCCESS,
        OrderStatus.REFUND_FAIL,
        OrderStatus.REFUND_RETRY,
      ].includes(nextStatus)
    ) {
      let refund = await RefundOrder.findOne({ where: { orderId: order.id }, transaction: t });
      const beforeRefundStatus = refund?.status as RefundStatus | undefined;
      const orderGrandMinor = read<number>(order, "grand_total_minor", "grandTotalMinor") ?? 0;
      const currency = read<string>(order, "currency_code", "currencyCode") ?? "THB";

      // สร้าง record ครั้งแรก (มาจาก REFUND_REQUEST ของลูกค้า หรือ ร้านยกเลิกหลังชำระ)
      if (!refund && (nextStatus === OrderStatus.REFUND_REQUEST || nextStatus === OrderStatus.MERCHANT_CANCELED)) {
        refund = await RefundOrder.create(
          {
            orderId: order.id,
            reason: reason ?? null,
            amountMinor: orderGrandMinor,
            currencyCode: currency,
            status: nextStatus === OrderStatus.REFUND_REQUEST ? RefundStatus.REQUESTED : RefundStatus.APPROVED,
            requestedBy: nextStatus === OrderStatus.REFUND_REQUEST ? "CUSTOMER" : "MERCHANT",
            requestedAt: new Date(),
            approvedAt: nextStatus === OrderStatus.MERCHANT_CANCELED ? new Date() : null,
            metadata: { via: "updateOrder" },
          } as any,
          { transaction: t }
        );
        await RefundStatusHistory.create(
          {
            refundOrderId: Number(refund.id),
            fromStatus: null,
            toStatus: refund.status,
            reason: reason ?? null,
            changedByType,
            changedById,
            source: isService ? "SERVICE" : "WEB",
            correlationId,
            metadata: {},
          } as any,
          { transaction: t }
        );
      } else if (refund) {
        if (nextStatus === OrderStatus.REFUND_APPROVED && refund.status !== RefundStatus.APPROVED) {
          await refund.update({ status: RefundStatus.APPROVED, approvedAt: new Date() } as any, { transaction: t });
          await RefundStatusHistory.create(
            {
              refundOrderId: Number(refund.id),
              fromStatus: (beforeRefundStatus ?? null) as any,
              toStatus: RefundStatus.APPROVED,
              reason: reason ?? null,
              changedByType,
              changedById,
              source: isService ? "SERVICE" : "WEB",
              correlationId,
              metadata: {},
            } as any,
            { transaction: t }
          );
        } else if (nextStatus === OrderStatus.REFUND_SUCCESS && refund.status !== RefundStatus.SUCCESS) {
          await refund.update({ status: RefundStatus.SUCCESS, refundedAt: new Date() } as any, { transaction: t });
          await RefundStatusHistory.create(
            {
              refundOrderId: Number(refund.id),
              fromStatus: (beforeRefundStatus ?? null) as any,
              toStatus: RefundStatus.SUCCESS,
              reason: reason ?? null,
              changedByType,
              changedById,
              source: isService ? "SERVICE" : "WEB",
              correlationId,
              metadata: {},
            } as any,
            { transaction: t }
          );
        } else if (nextStatus === OrderStatus.REFUND_FAIL && refund.status !== RefundStatus.FAIL) {
          await refund.update({ status: RefundStatus.FAIL } as any, { transaction: t });
          await RefundStatusHistory.create(
            {
              refundOrderId: Number(refund.id),
              fromStatus: (beforeRefundStatus ?? null) as any,
              toStatus: RefundStatus.FAIL,
              reason: reason ?? null,
              changedByType,
              changedById,
              source: isService ? "SERVICE" : "WEB",
              correlationId,
              metadata: {},
            } as any,
            { transaction: t }
          );
        }
      }

      // ── Trigger PGW หลัง commit: REFUND_APPROVED / MERCHANT_CANCELED / REFUND_RETRY
      if ([OrderStatus.REFUND_APPROVED, OrderStatus.MERCHANT_CANCELED, OrderStatus.REFUND_RETRY].includes(nextStatus)) {
        const pay = (order as any).checkout?.payment;
        const paymentId = pay?.id as number | undefined;
        const providerRef = read<string>(pay, "provider_ref", "providerRef");
        const orderRef = read<string>(order, "reference", "reference");
        const reference = orderRef || providerRef;
        const refundRow = refund ?? (await RefundOrder.findOne({ where: { orderId: order.id }, transaction: t }));
        const refundOrderId: number | undefined = refundRow?.get("id") as any;
        const prev = nextStatus;
        const requestId = genRequestId();

        postCommit = async () => {
          if (!reference || !paymentId) {
            await Order.update({ status: OrderStatus.REFUND_FAIL } as any, { where: { id: orderId } });
            if (refundOrderId) {
              await RefundStatusHistory.create({
                refundOrderId,
                fromStatus: RefundStatus.APPROVED,
                toStatus: RefundStatus.FAIL,
                reason: "Missing payment reference",
                changedByType: "SYSTEM",
                changedById: 0,
                source: "PAYMENT_GATEWAY",
                correlationId,
                metadata: {},
              } as any);
            }
            return;
          }

          const amountMinor =
            (read<number>(pay, "amount_captured_minor", "amountCapturedMinor") ?? 0) ||
            (read<number>(pay, "amount_authorized_minor", "amountAuthorizedMinor") ?? 0) ||
            (read<number>(order, "grand_total_minor", "grandTotalMinor") ?? 0);

          try {
            // 1) ตรวจสถานะธุรกรรม
            const detail = await pgwGetDetail(reference, correlationId ?? undefined);
            const action = decidePgwAction(detail?.status ?? "");
            if (action === "NONE") {
              await Order.update({ status: OrderStatus.REFUND_FAIL } as any, { where: { id: orderId } });
              if (refundOrderId) {
                await RefundStatusHistory.create({
                  refundOrderId,
                  fromStatus: RefundStatus.APPROVED,
                  toStatus: RefundStatus.FAIL,
                  reason: `Unsupported PGW status: ${detail?.status ?? "unknown"}`,
                  changedByType: "SYSTEM",
                  changedById: 0,
                  source: "PAYMENT_GATEWAY",
                  correlationId,
                  metadata: { detail },
                } as any);
              }
              await PaymentGatewayEvent.create({
                checkoutId: (order as any).checkout?.id ?? null,
                paymentId,
                refundOrderId: refundOrderId ?? null,
                type: action,
                amountMinor,
                provider: pay?.provider ?? "UNKNOWN",
                providerRef: providerRef ?? null,
                status: "FAILED",
                requestId,
                reqJson: { step: "decide", detail },
                resJson: { reason: "UNSUPPORTED_STATUS" },
              } as any);
              return;
            }

            // 2) เรียก VOID/REFUND
            const payloadReason =
              reason ?? (nextStatus === OrderStatus.MERCHANT_CANCELED ? "Merchant canceled" : "Refund approved / retry");

            const resp =
              action === "VOID"
                ? await pgwVoid(reference, payloadReason, correlationId ?? undefined)
                : await pgwRefund(reference, payloadReason, correlationId ?? undefined);

            const ok = resp?.res_code === "0000";

            await PaymentGatewayEvent.create({
              checkoutId: (order as any).checkout?.id ?? null,
              paymentId,
              refundOrderId: refundOrderId ?? null,
              type: action,
              amountMinor,
              provider: pay?.provider ?? "UNKNOWN",
              providerRef: providerRef ?? null,
              status: ok ? "SUCCESS" : "FAILED",
              requestId,
              reqJson: { action, reason: payloadReason },
              resJson: resp,
            } as any);

            if (ok) {
              await Order.update({ status: OrderStatus.REFUND_PROCESSING } as any, { where: { id: orderId } });
              await OrderStatusHistory.create({
                orderId: Number(orderId),
                fromStatus: prev,
                toStatus: OrderStatus.REFUND_PROCESSING,
                changedByType: "SYSTEM",
                changedById: 0,
                reason: `${action} accepted by PGW`,
                source: "PAYMENT_GATEWAY",
                correlationId,
                metadata: { response: resp, retry: nextStatus === OrderStatus.REFUND_RETRY },
              } as any);
              if (refundOrderId) {
                await RefundStatusHistory.create({
                  refundOrderId,
                  fromStatus: RefundStatus.APPROVED,
                  toStatus: RefundStatus.APPROVED, // คงไว้ระหว่างรอ PGW โอน
                  reason: `${action} accepted by PGW`,
                  changedByType: "SYSTEM",
                  changedById: 0,
                  source: "PAYMENT_GATEWAY",
                  correlationId,
                  metadata: { response: resp },
                } as any);
              }
            } else {
              await Order.update({ status: OrderStatus.REFUND_FAIL } as any, { where: { id: orderId } });
              await OrderStatusHistory.create({
                orderId: Number(orderId),
                fromStatus: prev,
                toStatus: OrderStatus.REFUND_FAIL,
                changedByType: "SYSTEM",
                changedById: 0,
                reason: `${action} failed: ${resp?.res_desc ?? "unknown"}`,
                source: "PAYMENT_GATEWAY",
                correlationId,
                metadata: { response: resp, retry: nextStatus === OrderStatus.REFUND_RETRY },
              } as any);
              if (refundOrderId) {
                await RefundStatusHistory.create({
                  refundOrderId,
                  fromStatus: RefundStatus.APPROVED,
                  toStatus: RefundStatus.FAIL,
                  reason: `${action} failed: ${resp?.res_desc ?? "unknown"}`,
                  changedByType: "SYSTEM",
                  changedById: 0,
                  source: "PAYMENT_GATEWAY",
                  correlationId,
                  metadata: { response: resp, retry: nextStatus === OrderStatus.REFUND_RETRY },
                } as any);
              }
            }
          } catch (e: any) {
            await Order.update({ status: OrderStatus.REFUND_FAIL } as any, { where: { id: orderId } });
            await OrderStatusHistory.create({
              orderId: Number(orderId),
              fromStatus: prev,
              toStatus: OrderStatus.REFUND_FAIL,
              changedByType: "SYSTEM",
              changedById: 0,
              reason: "PGW API error",
              source: "PAYMENT_GATEWAY",
              correlationId,
              metadata: { error: e?.response?.data ?? e?.message, retry: nextStatus === OrderStatus.REFUND_RETRY },
            } as any);
            if (refundOrderId) {
              await RefundStatusHistory.create({
                refundOrderId,
                fromStatus: RefundStatus.APPROVED,
                toStatus: RefundStatus.FAIL,
                reason: "PGW API error",
                changedByType: "SYSTEM",
                changedById: 0,
                source: "PAYMENT_GATEWAY",
                correlationId,
                metadata: { error: e?.response?.data ?? e?.message, retry: nextStatus === OrderStatus.REFUND_RETRY },
              } as any);
            }
            await PaymentGatewayEvent.create({
              checkoutId: (order as any).checkout?.id ?? null,
              paymentId,
              refundOrderId: refundOrderId ?? null,
              type: "ERROR",
              amountMinor,
              provider: (order as any).checkout?.payment?.provider ?? "UNKNOWN",
              providerRef: providerRef ?? null,
              status: "FAILED",
              requestId,
              reqJson: { note: "PGW API error" },
              resJson: e?.response?.data ?? { message: e?.message ?? "unknown" },
            } as any);
          }
        };
      }
    }

    await order.reload({ include: ORDER_BASE_INCLUDES, transaction: t });
    await t.commit();

    if (postCommit) await postCommit();

    const fresh = await Order.findByPk(orderId, { include: ORDER_BASE_INCLUDES });
    return res.json({ data: serializeOrder(fresh ?? order) });
  } catch (err) {
    await t.rollback();
    console.error("updateOrder error:", err);
    return res.status(500).json({ error: "Failed to update order" });
  }
}



// ───────────────────────────────────────────────────────────────────────────────

export default {
  getOrdersSummary,
  listOrders,
  updateOrder
}
