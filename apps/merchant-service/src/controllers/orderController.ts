// apps/merchant-service/src/controllers/orderController.ts
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
  const { orderId } = req.params

  const {
    status: nextStatus,
    trackingNumber,
    carrier,
    reason,
    // orderNote —> ถูกเมินใน endpoint นี้แล้ว
  }: {
    status?: OrderStatus | string
    trackingNumber?: string
    carrier?: string
    reason?: string
  } = req.body || {}
  console.log("body: ", req.body)
  if (!orderId) return res.status(400).json({ error: "Missing order id" })
  const nothingToUpdate = !nextStatus && !trackingNumber && !carrier
  if (nothingToUpdate) return res.status(400).json({ error: "Nothing to update" })

  const mapShipping: Record<string, ShippingStatus | undefined> = {
    HANDED_OVER: ShippingStatus.READY_TO_SHIP,
    SHIPPED: ShippingStatus.IN_TRANSIT,
    DELIVERED: ShippingStatus.DELIVERED,
    AWAITING_RETURN: ShippingStatus.RETURN_TO_SENDER_IN_TRANSIT,
    RECEIVE_RETURN:  ShippingStatus.RETURNED_TO_SENDER,
    RETURN_FAIL:     ShippingStatus.DELIVERY_FAILED,
    TRANSIT_LACK: ShippingStatus.TRANSIT_ISSUE,
    RE_TRANSIT:   ShippingStatus.IN_TRANSIT,
  }

  const ALLOWED_NEXT: Record<string, string[]> = {
    PENDING: ["CUSTOMER_CANCELED", "PAID"],
    PAID: ["PROCESSING", "MERCHANT_CANCELED", "REFUND_REQUEST"],
    PROCESSING: ["READY_TO_SHIP"],
    READY_TO_SHIP: ["HANDED_OVER"],
    HANDED_OVER: ["SHIPPED"],
    SHIPPED: ["DELIVERED", "TRANSIT_LACK", "AWAITING_RETURN"],
    TRANSIT_LACK: ["RE_TRANSIT"],
    RE_TRANSIT: ["SHIPPED"],
    DELIVERED: ["COMPLETE", "REFUND_REQUEST"],
    COMPLETE: [],
    CUSTOMER_CANCELED: [],
    MERCHANT_CANCELED: ["REFUND_PROCESSING", "REFUND_FAIL"],
    REFUND_REQUEST: ["REFUND_APPROVED", "AWAITING_RETURN", "REFUND_REJECTED"],
    AWAITING_RETURN: ["RECEIVE_RETURN", "RETURN_FAIL"],
    RECEIVE_RETURN: ["RETURN_VERIFIED"],
    RETURN_VERIFIED: ["REFUND_APPROVED"],
    RETURN_FAIL: [],
    REFUND_REJECTED: ["PROCESSING", "COMPLETE"],
    REFUND_APPROVED: ["REFUND_PROCESSING", "REFUND_FAIL"],
    REFUND_PROCESSING: ["REFUND_SUCCESS"],
    REFUND_SUCCESS: [],
    REFUND_FAIL: ["REFUND_RETRY", "REFUND_PROCESSING"],
    REFUND_RETRY: [],
  }

  const TERMINAL = new Set<string>(["COMPLETE", "CUSTOMER_CANCELED", "REFUND_SUCCESS", "RETURN_FAIL"])

  const t = await sequelize.transaction()
  let postCommit: null | (() => Promise<void>) = null

  try {
    const order = await Order.findByPk(orderId, { include: ORDER_BASE_INCLUDES, transaction: t })
    if (!order) {
      await t.rollback()
      return res.status(404).json({ error: "Order not found" })
    }

    // (ตัด logic อัปเดต order_note ออก)

    // tracking/carrier
    if (trackingNumber || carrier) {
      let ship: any = (order as any).shippingInfo
      if (!ship) {
        ship = await ShippingInfo.create(
          { orderId: Number(order.id), trackingNumber: trackingNumber ?? null, carrier: carrier ?? null } as any,
          { transaction: t }
        )
        ;(order as any).shippingInfo = ship
      } else {
        await ship.update(
          { ...(trackingNumber ? { trackingNumber } : {}), ...(carrier ? { carrier } : {}) },
          { transaction: t }
        )
      }
    }

    const current = order.status as string

    if (!nextStatus) {
      await order.reload({ include: ORDER_BASE_INCLUDES, transaction: t })
      const dto = serializeOrder(order)
      await t.commit()
      return res.json({ data: dto })
    }

    if (TERMINAL.has(current)) {
      await t.rollback()
      return res.status(400).json({ error: `Order is terminal (${current}), cannot transition` })
    }

    const allowed = ALLOWED_NEXT[current] ?? []
    if (!allowed.includes(nextStatus)) {
      await t.rollback()
      return res.status(400).json({ error: `Invalid transition: ${current} -> ${nextStatus}`, allowedNext: allowed })
    }

    await order.update({ status: nextStatus } as any, { transaction: t })

    const changedById = (req as any)?.user?.sub ?? (req as any)?.user?.id ?? null
    const correlationId =
      (req.headers["x-request-id"] as string | undefined) ??
      (req.headers["x-correlation-id"] as string | undefined) ??
      null

    await OrderStatusHistory.create(
      {
        orderId: Number(order.id),
        fromStatus: current as OrderStatus,
        toStatus: nextStatus as OrderStatus,
        changedByType: "MERCHANT",
        changedById,
        reason: reason ?? null,
        source: "WEB",
        correlationId,
        metadata: { ip: req.ip, ua: req.headers["user-agent"] ?? null },
      } as any,
      { transaction: t }
    )

    // ── Sync shipping + ShipmentEvent
    const ship: any = (order as any).shippingInfo
    const newShipStatus = mapShipping[nextStatus]
    if (ship && newShipStatus) {
      const now = new Date()
      const lastEvent = await ShipmentEvent.findOne({
        where: { shippingInfoId: ship.id },
        order: [["occurredAt", "DESC"], ["id", "DESC"]],
        transaction: t,
      })
      const fromStatus = (lastEvent?.get("toStatus") as ShippingStatus | undefined) ?? ship.shippingStatus ?? null

      const patch: any = { shippingStatus: newShipStatus }
      if (nextStatus === "SHIPPED" && !ship.shippedAt) patch.shippedAt = now
      if (nextStatus === "DELIVERED" && !ship.deliveredAt) patch.deliveredAt = now
      if (nextStatus === "RECEIVE_RETURN" && !ship.returnedToSenderAt) patch.returnedToSenderAt = now

      await ship.update(patch, { transaction: t })

      await ShipmentEvent.create(
        {
          shippingInfoId: ship.id,
          fromStatus,
          toStatus: newShipStatus,
          description: `Order status changed to ${nextStatus} by MERCHANT`,
          location: null,
          rawPayload: null,
          occurredAt: now,
        } as any,
        { transaction: t }
      )
    }

    // ── Reflect RefundOrder (+ RefundStatusHistory ภายในทรานแซกชัน)
    if (
      [
        OrderStatus.REFUND_REQUEST,
        OrderStatus.REFUND_APPROVED,
        OrderStatus.MERCHANT_CANCELED,
        OrderStatus.REFUND_SUCCESS,
        OrderStatus.REFUND_FAIL,
        OrderStatus.REFUND_RETRY,
      ].includes(nextStatus as OrderStatus)
    ) {
      let refund = await RefundOrder.findOne({ where: { orderId: order.id }, transaction: t })
      const beforeRefundStatus = refund?.status as RefundStatus | undefined
      const orderGrandMinor = read<number>(order, "grand_total_minor", "grandTotalMinor") ?? 0
      const currency = read<string>(order, "currency_code", "currencyCode") ?? "THB"

      if (!refund && (nextStatus === "REFUND_REQUEST" || nextStatus === "MERCHANT_CANCELED")) {
        refund = await RefundOrder.create(
          {
            orderId: order.id,
            reason: reason ?? null,
            amountMinor: orderGrandMinor,
            currencyCode: currency,
            status: nextStatus === "REFUND_REQUEST" ? "REQUESTED" : "APPROVED",
            requestedBy: nextStatus === "REFUND_REQUEST" ? "CUSTOMER" : "MERCHANT",
            requestedAt: new Date(),
            approvedAt: nextStatus === "MERCHANT_CANCELED" ? new Date() : null,
            metadata: { via: "updateOrder" },
          } as any,
          { transaction: t }
        )
        // history: CREATED -> REQUESTED/APPROVED
        await RefundStatusHistory.create(
          {
            refundOrderId: Number(refund.id),
            fromStatus: null,
            toStatus: refund.status as RefundStatus,
            reason: reason ?? null,
            changedByType: "MERCHANT",
            changedById,
            source: "WEB",
            correlationId,
            metadata: {},
          } as any,
          { transaction: t }
        )
      } else if (refund) {
        if (nextStatus === "REFUND_APPROVED" && refund.status !== "APPROVED") {
          console.log("Start to API refund")
          await refund.update({ status: "APPROVED", approvedAt: new Date() } as any, { transaction: t })
          await RefundStatusHistory.create(
            {
              refundOrderId: Number(refund.id),
              fromStatus: (beforeRefundStatus ?? null) as any,
              toStatus: RefundStatus.APPROVED,
              reason: reason ?? null,
              changedByType: "MERCHANT",
              changedById,
              source: "WEB",
              correlationId,
              metadata: {},
            } as any,
            { transaction: t }
          )
        } else if (nextStatus === "REFUND_SUCCESS" && refund.status !== "SUCCESS") {
          console.log("nextStatus === REFUND_SUCCESS && refund.status !== SUCCESS")
          await refund.update({ status: "SUCCESS", refundedAt: new Date() } as any, { transaction: t })
          await RefundStatusHistory.create(
            {
              refundOrderId: Number(refund.id),
              fromStatus: (beforeRefundStatus ?? null) as any,
              toStatus: "SUCCESS",
              reason: reason ?? null,
              changedByType: "MERCHANT",
              changedById,
              source: "WEB",
              correlationId,
              metadata: {},
            } as any,
            { transaction: t }
          )
        } else if (nextStatus === "REFUND_FAIL" && refund.status !== "FAIL") {
          console.log("nextStatus === REFUND_FAIL && refund.status !== FAIL")
          await refund.update({ status: "FAIL" } as any, { transaction: t })
          await RefundStatusHistory.create(
            {
              refundOrderId: Number(refund.id),
              fromStatus: (beforeRefundStatus ?? null) as any,
              toStatus: "FAIL",
              reason: reason ?? null,
              changedByType: "MERCHANT",
              changedById,
              source: "WEB",
              correlationId,
              metadata: {},
            } as any,
            { transaction: t }
          )
        }
      }

      // ── PGW (do after commit)
      if ([OrderStatus.REFUND_APPROVED, OrderStatus.MERCHANT_CANCELED, OrderStatus.REFUND_RETRY].includes(nextStatus as OrderStatus)) {
        console.log("Start to yingggggggg")
        const pay = (order as any).checkout?.payment
        const paymentId = pay?.id as number | undefined
        const providerRef = read<string>(pay, "provider_ref", "providerRef")
        const orderRef = read<string>(order, "reference", "reference")
        const reference = orderRef || providerRef
        const refundRow = refund ?? (await RefundOrder.findOne({ where: { orderId: order.id }, transaction: t }))
        const refundOrderId: number | undefined = refundRow?.get("id") as any
        const prev = nextStatus as OrderStatus
        const requestId = genRequestId()
        console.log("Payment id: ", paymentId)
        console.log("ref: ", providerRef)
        console.log("ref: ", orderRef)
        postCommit = async () => {
          if (!reference || !paymentId) {
            console.log("!reference || !paymentId")
            await Order.update({ status: OrderStatus.REFUND_FAIL } as any, { where: { id: orderId } })
            if (refundOrderId) {
              await RefundStatusHistory.create({
                refundOrderId,
                fromStatus: "APPROVED",
                toStatus: "FAIL",
                reason: "Missing payment reference",
                changedByType: "SYSTEM",
                changedById: 0,
                source: "PAYMENT_GATEWAY",
                correlationId,
                metadata: {},
              } as any)
            }
            return
          }

          const amountMinor =
            (read<number>(pay, "amount_captured_minor", "amountCapturedMinor") ?? 0) ||
            (read<number>(pay, "amount_authorized_minor", "amountAuthorizedMinor") ?? 0) ||
            (read<number>(order, "grand_total_minor", "grandTotalMinor") ?? 0)

          try {
            // 1) detail
            const detail = await pgwGetDetail(reference, correlationId ?? undefined)
            console.log("detail payment of gateway: ", detail)
            const action = decidePgwAction(detail?.status ?? "")
            if (action === "NONE") {
              await Order.update({ status: OrderStatus.REFUND_FAIL } as any, { where: { id: orderId } })
              if (refundOrderId) {
                await RefundStatusHistory.create({
                  refundOrderId,
                  fromStatus: "APPROVED",
                  toStatus: "FAIL",
                  reason: `Unsupported PGW status: ${detail?.status ?? "unknown"}`,
                  changedByType: "SYSTEM",
                  changedById: 0,
                  source: "PAYMENT_GATEWAY",
                  correlationId,
                  metadata: { detail },
                } as any)
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
              } as any)
              return
            }

            // 2) call VOID/REFUND
            const payloadReason =
              reason ?? (nextStatus === "MERCHANT_CANCELED" ? "Merchant canceled" : "Refund approved / retry")

            const reqBody = { action, reason: payloadReason }
            const resp =
              action === "VOID"
                ? await pgwVoid(reference, payloadReason, correlationId ?? undefined)
                : await pgwRefund(reference, payloadReason, correlationId ?? undefined)

            const ok = resp?.res_code === "0000"

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
              reqJson: reqBody,
              resJson: resp,
            } as any)

            if (refundOrderId) {
              await RefundStatusHistory.create({
                refundOrderId,
                fromStatus: "APPROVED",
                toStatus: ok ? "APPROVED" : "FAIL",
                reason: ok ? `${action} accepted by PGW` : `${action} failed: ${resp?.res_desc ?? "unknown"}`,
                changedByType: "SYSTEM",
                changedById: 0,
                source: "PAYMENT_GATEWAY",
                correlationId,
                metadata: { response: resp, action, retry: nextStatus === OrderStatus.REFUND_RETRY },
              } as any)
            }

            const prevStatus = prev
            if (ok) {
              await Order.update({ status: OrderStatus.REFUND_PROCESSING } as any, { where: { id: orderId } })
              await OrderStatusHistory.create({
                orderId: Number(orderId),
                fromStatus: prevStatus,
                toStatus: OrderStatus.REFUND_PROCESSING,
                changedByType: "SYSTEM",
                changedById: 0,
                reason: `${action} accepted by PGW`,
                source: "PAYMENT_GATEWAY",
                correlationId,
                metadata: { response: resp, retry: nextStatus === OrderStatus.REFUND_RETRY },
              } as any)
            } else {
              await Order.update({ status: OrderStatus.REFUND_FAIL } as any, { where: { id: orderId } })
              await OrderStatusHistory.create({
                orderId: Number(orderId),
                fromStatus: prevStatus,
                toStatus: OrderStatus.REFUND_FAIL,
                changedByType: "SYSTEM",
                changedById: 0,
                reason: `${action} failed: ${resp?.res_desc ?? "unknown"}`,
                source: "PAYMENT_GATEWAY",
                correlationId,
                metadata: { response: resp, retry: nextStatus === OrderStatus.REFUND_RETRY },
              } as any)
            }
          } catch (e: any) {
            console.log("order id when fail: ", orderId)
            // const detail = await pgwGetDetail(reference, correlationId ?? undefined)
            // const action = decidePgwAction(detail?.status ?? "")
            await Order.update({ status: OrderStatus.REFUND_FAIL } as any, { where: { id: orderId } })
            await OrderStatusHistory.create({
                orderId: Number(orderId),
                fromStatus: prev,
                toStatus: OrderStatus.REFUND_FAIL,
                changedByType: "SYSTEM",
                changedById: 0,
                reason: "Fail to get detail from payment gateway action",
                source: "PAYMENT_GATEWAY",
                correlationId,
                metadata: { response: "Fail to get detail payment from PGW", retry: nextStatus === OrderStatus.REFUND_RETRY },
              } as any)
            if (refundOrderId) {
              await RefundStatusHistory.create({
                refundOrderId,
                fromStatus: "APPROVED",
                toStatus: "FAIL",
                reason: "PGW API error",
                changedByType: "SYSTEM",
                changedById: 0,
                source: "PAYMENT_GATEWAY",
                correlationId,
                metadata: { error: e?.response?.data ?? e?.message, retry: nextStatus === OrderStatus.REFUND_RETRY },
              } as any)
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
            } as any)
          }
        }
      }
    }

    await order.reload({ include: ORDER_BASE_INCLUDES, transaction: t })
    await t.commit()

    if (postCommit) await postCommit()

    const fresh = await Order.findByPk(orderId, { include: ORDER_BASE_INCLUDES })
    const dto = serializeOrder(fresh ?? order)
    return res.json({ data: dto })
  } catch (err) {
    console.error(err)
    await t.rollback()
    return res.status(500).json({ error: "Failed to update order" })
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// POST /webhooks/carriers/:carrier

export async function carrierWebhook(req: Request, res: Response) {
  try {
    const carrier = String(req.params.carrier || "").toUpperCase()
    const raw = req.body ?? {}
    const rawStr = JSON.stringify(raw)

    // 1) Verify signature (optional in dev)
    const secret = process.env.CARRIER_WEBHOOK_SECRET || ""
    const sigHeader = (req.headers["x-signature"] as string) || ""
    if (secret) {
      const mac = crypto.createHmac("sha256", secret).update(rawStr).digest("hex")
      if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(sigHeader || "", "hex"))) {
        return res.status(401).json({ error: "Bad signature" })
      }
    }

    // 2) Normalize fields
    const tracking = raw.trackingNo || raw.tracking_no || raw.trackingNumber || raw.tracking || ""
    if (!tracking) return res.status(400).json({ error: "Missing tracking number" })

    const occurredAt = new Date(raw.occurredAt || raw.occurred_at || raw.scanTime || raw.timestamp || Date.now())
    const toShipStatus = normalizeCarrierStatus(raw, carrier)

    // 3) Find shipping info
    const ship = await ShippingInfo.findOne({ where: { trackingNumber: tracking } })
    if (!ship) return res.status(202).json({ ok: true })

    // 4) Upsert shipment event + patch shipping + safe transition
    await sequelize.transaction(async (t: any) => {
      const lastEvent = await ShipmentEvent.findOne({
        where: { shippingInfoId: ship.id },
        order: [["occurredAt", "DESC"], ["id", "DESC"]],
        transaction: t,
      })
      const fromStatus = (lastEvent?.get("toStatus") as ShippingStatus | undefined) ?? ship.shippingStatus ?? null

      if (lastEvent && lastEvent.get("toStatus") === toShipStatus) {
        const dt = Math.abs(new Date(lastEvent.get("occurredAt") as any).getTime() - occurredAt.getTime())
        if (dt < 60_000) return
      }

      await ShipmentEvent.create(
        {
          shippingInfoId: ship.id,
          fromStatus,
          toStatus: toShipStatus,
          description: raw.description || raw.status_text || raw.message || null,
          location: raw.location || raw.facility || null,
          rawPayload: raw,
          occurredAt,
        } as any,
        { transaction: t }
      )

      const patch: any = { shippingStatus: toShipStatus }
      if (toShipStatus === ShippingStatus.DELIVERED && !ship.deliveredAt) patch.deliveredAt = occurredAt
      if (toShipStatus === ShippingStatus.RETURNED_TO_SENDER && !ship.returnedToSenderAt) patch.returnedToSenderAt = occurredAt
      await ship.update(patch, { transaction: t })

      const order = await Order.findByPk(ship.orderId, { transaction: t })
      if (!order) return

      const cur = order.status as OrderStatus
      if (toShipStatus === ShippingStatus.IN_TRANSIT && cur === OrderStatus.HANDED_OVER) {
        await slide(order, cur, OrderStatus.SHIPPED, t, "SYSTEM", `Carrier received parcel (${carrier})`)
      }
      if (toShipStatus === ShippingStatus.DELIVERED && (cur === OrderStatus.SHIPPED || cur === OrderStatus.RE_TRANSIT)) {
        await slide(order, cur, OrderStatus.DELIVERED, t, "SYSTEM", `Delivered by ${carrier}`)
      }

      if (toShipStatus === ShippingStatus.RETURN_TO_SENDER_IN_TRANSIT) {
        const hasRefundReq = await OrderStatusHistory.findOne({
          where: { orderId: order.id, toStatus: OrderStatus.REFUND_REQUEST },
          transaction: t,
        })
        const AUTO_RTS_TO_AWAIT = process.env.AUTO_RTS_TO_AWAIT === "true"
        if ((hasRefundReq || AUTO_RTS_TO_AWAIT) && cur !== OrderStatus.AWAITING_RETURN) {
          await slide(order, cur, OrderStatus.AWAITING_RETURN, t, "SYSTEM", `RTS started by ${carrier}`)
        }
      }

      if (toShipStatus === ShippingStatus.RETURNED_TO_SENDER) {
        const hadAwait = await OrderStatusHistory.findOne({
          where: { orderId: order.id, toStatus: OrderStatus.AWAITING_RETURN },
          transaction: t,
        })
        if (hadAwait && cur !== OrderStatus.RECEIVE_RETURN) {
          await slide(order, cur, OrderStatus.RECEIVE_RETURN, t, "SYSTEM", `RTS delivered back by ${carrier}`)
        }
      }
    })

    return res.json({ ok: true })
  } catch (err) {
    console.error("carrierWebhook error:", err)
    return res.status(500).json({ error: "Webhook processing failed" })
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Internal helpers

async function slide(
  order: any,
  from: OrderStatus,
  to: OrderStatus,
  t: Transaction,
  by: "SYSTEM" | "MERCHANT" | "CUSTOMER",
  reason?: string
) {
  await order.update({ status: to } as any, { transaction: t })
  await OrderStatusHistory.create(
    {
      orderId: order.id,
      fromStatus: from,
      toStatus: to,
      changedByType: by,
      changedById: 0,
      reason: reason ?? null,
      source: "SYSTEM",
      correlationId: null,
      metadata: {},
    } as any,
    { transaction: t }
  )
}

/** map สถานะจากผู้ให้บริการขนส่ง → ShippingStatus กลางของระบบ */
function normalizeCarrierStatus(raw: any, carrier: string): ShippingStatus {
  const text = (raw.status || raw.code || raw.description || raw.status_text || "").toString().toLowerCase()

  if (/out\s*for\s*delivery|กำลังนำจ่าย|courier out/.test(text)) return ShippingStatus.OUT_FOR_DELIVERY
  if (/delivered|สำเร็จ|รับของแล้ว|signed/i.test(text)) return ShippingStatus.DELIVERED
  if (/failed|ไม่สำเร็จ|unsuccessful|attempt/i.test(text)) return ShippingStatus.DELIVERY_FAILED
  if (/return\s*to\s*sender|rts|ตีกลับ/i.test(text)) {
    if (/delivered|ถึงผู้ส่ง|รับคืนแล้ว/i.test(text)) return ShippingStatus.RETURNED_TO_SENDER
    return ShippingStatus.RETURN_TO_SENDER_IN_TRANSIT
  }
  if (/received|picked\s*up|รับพัสดุ|รับเข้า/i.test(text)) return ShippingStatus.IN_TRANSIT
  if (/in\s*transit|ศูนย์คัดแยก|hub|arrival|departure/i.test(text)) return ShippingStatus.IN_TRANSIT
  if (/issue|ปัญหา|hold|exception/i.test(text)) return ShippingStatus.TRANSIT_ISSUE

  return ShippingStatus.IN_TRANSIT
}

// ───────────────────────────────────────────────────────────────────────────────

export default {
  getOrdersSummary,
  listOrders,
  updateOrder,
  carrierWebhook,
}
