import { Request, Response } from "express"
import axios from "axios"
import { Includeable, Op, WhereOptions } from "sequelize"

import { Order } from "@digishop/db/src/models/Order"
import { OrderItem } from "@digishop/db/src/models/OrderItem"
import { OrderStatusHistory } from "@digishop/db/src/models/OrderStatusHistory"
import { Payment } from "@digishop/db/src/models/Payment"
import { Product } from "@digishop/db/src/models/Product"
import { ShippingInfo } from "@digishop/db/src/models/ShippingInfo"
import { ShippingType } from "@digishop/db/src/models/ShippingType"
import { User } from "@digishop/db/src/models/User"
import { Address } from "@digishop/db/src/models/Address"
import { RefundOrder } from "@digishop/db/src/models/RefundOrder"
import { RefundStatusHistory } from "@digishop/db/src/models/RefundStatusHistory"

const toInt = (v: unknown, def: number) =>
  (Number.isFinite(Number(v)) ? Number(v) : def)
const toNum = (v: unknown, def = 0) => (v == null ? def : Number(v))

const SORT_WHITELIST = new Set<("id" | "createdAt" | "updatedAt" | "totalPrice")>([
  "id",
  "createdAt",
  "updatedAt",
  "totalPrice",
])

// ───────────────────────────────────────────────────────────────────────────────
// Order statuses (รวมสถานะใหม่ตาม flow ล่าสุด)
type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "READY_TO_SHIP"
  | "HANDED_OVER"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETE"
  | "CUSTOMER_CANCELED"
  | "MERCHANT_CANCELED"
  | "TRANSIT_LACK"
  | "RE_TRANSIT"
  | "REFUND_REQUEST"
  | "AWAITING_RETURN"
  | "RECEIVE_RETURN"
  | "RETURN_VERIFIED"
  | "RETURN_FAIL"
  | "REFUND_REJECTED"
  | "REFUND_APPROVED"
  | "REFUND_PROCESSING"
  | "REFUND_SUCCESS"
  | "REFUND_FAIL"

// ───────────────────────────────────────────────────────────────────────────────
// PGW (Payment Gateway) config
const PGW_BASE       = process.env.PGW_BASE       ?? "https://pgw.example.com"
const PGW_API_ID     = process.env.PGW_API_ID     ?? ""
const PGW_API_KEY    = process.env.PGW_API_KEY    ?? ""
const PGW_PARTNER_ID = process.env.PGW_PARTNER_ID ?? ""
const PGW_LANG       = (process.env.PGW_LANG ?? "en") as "en" | "th"

// endpoints (ปรับได้ตามเอกสารจริง)
const pathTxnDetail = (ref: string) => `/v2/transaction/${encodeURIComponent(ref)}`
const pathVoid      = (ref: string) => `/v2/transaction/${encodeURIComponent(ref)}/void`
const pathRefund    = (ref: string) => `/v2/transaction/${encodeURIComponent(ref)}/refund`

type PgwVoidRefundResp = { request_uid?: string; res_code?: string; res_desc?: string }
type PgwDetailResp = {
  status?: string // "Approved" | "Pre settled" | "Settled" | ...
  [k: string]: any
}

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
  const { data } = await axios.post<PgwVoidRefundResp>(url, { reason: sanitizeReason(reason) }, { headers: pgwHeaders(correlationId), timeout: 15000 })
  return data
}

async function pgwRefund(reference: string, reason: string, correlationId?: string) {
  const url = `${PGW_BASE}${pathRefund(reference)}`
  const { data } = await axios.post<PgwVoidRefundResp>(url, { reason: sanitizeReason(reason) }, { headers: pgwHeaders(correlationId), timeout: 15000 })
  return data
}

// ยิงอะไรดีจากสถานะ detail?
function decidePgwAction(detailStatus: string): "VOID" | "REFUND" | "NONE" {
  const s = normalizeDetailStatus(detailStatus)
  if (s === "APPROVED") return "VOID"
  if (s === "PRE_SETTLED" || s === "SETTLED") return "REFUND"
  return "NONE"
}

// ───────────────────────────────────────────────────────────────────────────────
// Common includes

const ORDER_INCLUDES: Includeable[] = [
  {
    model: User,
    as: "customer",
    attributes: [
      "id",
      "email",
      "firstName",
      "lastName",
    ],
  },
  {
    model: ShippingInfo,
    as: "shippingInfo",
    attributes: [
      "trackingNumber",
      "carrier",
      "shippingStatus",
      "shippedAt",
      "createdAt",
      "updatedAt",
    ],
    include: [
      {
        model: ShippingType,
        as: "shippingType",
        attributes: [
          "name",
          "price",
          "estimatedDays",
        ],
      },
      {
        model: Address,
        as: "address",
        attributes: [
          "id",
          "recipientName",
          "phone",
          "addressNumber",
          "building",
          "subStreet",
          "street",
          "subdistrict",
          "district",
          "province",
          "postalCode",
          "country",
        ],
      },
    ],
  },
  {
    model: Payment,
    as: "payment",
    attributes: [
      "paymentMethod",
      "status",
      "paidAt",
    ],
  },
  {
    model: OrderItem,
    as: "items",
    attributes: [
      "id",
      "quantity",
      "unitPrice",
    ],
    include: [
      {
        model: Product,
        as: "product",
        attributes: [
          "id",
          "name",
          "price",
        ],
      },
    ],
  },
  {
    model: OrderStatusHistory,
    as: "statusHistory",
    attributes: [
      "fromStatus",
      "toStatus",
      "reason",
      "createdAt",
    ],
    separate: true,
    order: [["createdAt", "ASC"]],
  },
  {
    model: RefundOrder,
    as: "refundOrder",
    attributes: [
      "id",
      "reason",
      "amount",
      "status",
      "requestedAt",
      "approvedAt",
      "refundedAt",
    ],
  },
]

// ───────────────────────────────────────────────────────────────────────────────
// Serializer

function serializeOrder(o: any) {
  const customer  = o.customer
  const ship      = o.shippingInfo
  const shipType  = ship?.shippingType
  const addr      = ship?.address
  const pay       = o.payment
  const items     = (o.items ?? []) as Array<any>
  const histories = (o.statusHistory ?? []) as Array<any>
  const refund    = (o as any).refundOrder as (undefined | { reason?: string | null; amount?: string | number | null })

  const totalPriceNum = toNum(o.totalPrice)

  return {
    id: String(o.id),
    customerName: [customer?.firstName, customer?.lastName].filter(Boolean).join(" "),
    customerEmail: customer?.email ?? "",
    customerPhone: addr?.phone ?? "",
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    status: o.status as OrderStatus,
    statusHistory: histories.map((h) => h.toStatus as OrderStatus),

    totalPrice: totalPriceNum,
    shippingCost: toNum(shipType?.price ?? 0),
    tax: 0,
    paymentMethod: pay?.paymentMethod ?? "",
    shippingType:   shipType?.name ?? undefined,
    trackingNumber: ship?.trackingNumber ?? undefined,

    shippingAddress: addr
      ? {
          recipientName: addr.recipientName ?? "",
          phone:         addr.phone ?? "",
          addressNumber: addr.addressNumber ?? undefined,
          building:      addr.building ?? undefined,
          subStreet:     addr.subStreet ?? undefined,
          street:        addr.street ?? "",
          subdistrict:   addr.subdistrict ?? undefined,
          district:      addr.district ?? "",
          province:      addr.province ?? "",
          postalCode:    addr.postalCode ?? "",
          country:       addr.country ?? "TH",
        }
      : { recipientName: "", phone: "", street: "", district: "", province: "", postalCode: "", country: "TH" },

    orderItems: items.map((it) => ({
      id: String(it.id),
      name: it.product?.name ?? "",
      sku: String(it.product?.id ?? ""),
      quantity: it.quantity,
      price: toNum(it.unitPrice),
    })),

    // ตาม requirement ใหม่
    notes:        (o as any).orderNote ?? undefined,                 // จาก Order.orderNote
    refundReason: refund?.reason ?? undefined,                        // จาก RefundOrder.reason
    refundAmount: refund?.amount != null ? toNum(refund.amount) : undefined,
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// GET /orders

export async function listOrders(req: Request, res: Response) {
  try {
    const {
      page = "1", pageSize = "20", status, storeId, q, startDate, endDate,
      sortBy = "createdAt", sortDir = "DESC",
    } = req.query as Record<string, string>

    const limit      = toInt(pageSize, 20)
    const offset     = (toInt(page, 1) - 1) * limit
    const orderField = SORT_WHITELIST.has(sortBy as any) ? (sortBy as keyof Order) : "createdAt"
    const orderDir   = String(sortDir).toUpperCase() === "ASC" ? "ASC" : "DESC"

    const whereOrder: WhereOptions = {}
    if (status && status !== "ALL") Object.assign(whereOrder, { status })
    if (storeId)                     Object.assign(whereOrder, { storeId })
    if (startDate || endDate) {
      Object.assign(whereOrder, {
        createdAt: {
          ...(startDate ? { [Op.gte]: new Date(startDate) } : {}),
          ...(endDate   ? { [Op.lte]: new Date(endDate)   } : {}),
        },
      })
    }

    const orOnOrder: WhereOptions[] = []
    if (q?.trim() && !isNaN(Number(q))) orOnOrder.push({ id: Number(q) })

    const finalWhere: WhereOptions = {
      ...whereOrder,
      ...(orOnOrder.length ? { [Op.or]: orOnOrder } : {}),
    }

    const hasTextQuery = q?.trim() && isNaN(Number(q))
    const term = `%${q?.trim()}%`
    const customerInclude: Includeable = {
      model: User,
      as: "customer",
      attributes: [
        "id",
        "email",
        "firstName",
        "lastName",
      ],
      required: !!hasTextQuery,
      where: hasTextQuery ? {
        [Op.or]: [
          { firstName: { [Op.like]: term } },
          { lastName:  { [Op.like]: term } },
          { email:     { [Op.like]: term } },
        ],
      } : undefined,
    }

    const includes: Includeable[] = [customerInclude, ...ORDER_INCLUDES.filter((inc: any) => inc.as !== "customer")]

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

export async function updateOrder(req: Request, res: Response) {
  const { orderId } = req.params
  const {
    status: nextStatus, trackingNumber, carrier, reason, orderNote,
  }: {
    status?: OrderStatus
    trackingNumber?: string
    carrier?: string
    reason?: string
    orderNote?: string
  } = req.body || {}

  if (!orderId) return res.status(400).json({ error: "Missing order id" })
  if (!nextStatus && !trackingNumber && !carrier && typeof orderNote !== "string") {
    return res.status(400).json({ error: "Nothing to update" })
  }

  // ALLOWED_NEXT ตาม diagram ล่าสุด
  const ALLOWED_NEXT: Record<OrderStatus, OrderStatus[]> = {
    PENDING:            ["CUSTOMER_CANCELED", "PAID"],
    PAID:               ["PROCESSING", "MERCHANT_CANCELED", "REFUND_REQUEST"],
    PROCESSING:         ["READY_TO_SHIP"],
    READY_TO_SHIP:      ["HANDED_OVER"],
    HANDED_OVER:        ["SHIPPED"],
    SHIPPED:            ["DELIVERED", "TRANSIT_LACK", "AWAITING_RETURN"],
    TRANSIT_LACK:       ["RE_TRANSIT"],
    RE_TRANSIT:         ["SHIPPED"],
    DELIVERED:          ["COMPLETE", "REFUND_REQUEST"],
    COMPLETE:           [],
    CUSTOMER_CANCELED:  [],
    MERCHANT_CANCELED:  ["REFUND_PROCESSING", "REFUND_FAIL"], // จะอัปเดตตามผล PGW
    REFUND_REQUEST:     ["REFUND_APPROVED", "AWAITING_RETURN", "REFUND_REJECTED"],
    AWAITING_RETURN:    ["RECEIVE_RETURN", "RETURN_FAIL"],
    RECEIVE_RETURN:     ["RETURN_VERIFIED", "RETURN_FAIL"],
    RETURN_VERIFIED:    ["REFUND_APPROVED"],
    RETURN_FAIL:        [],
    REFUND_REJECTED:    ["PROCESSING", "COMPLETE"], // ไปต่อขึ้นกับ origin
    REFUND_APPROVED:    ["REFUND_PROCESSING", "REFUND_FAIL"],
    REFUND_PROCESSING:  ["REFUND_SUCCESS"],         // รอ webhook/cron
    REFUND_SUCCESS:     [],
    REFUND_FAIL:        ["REFUND_PROCESSING", "REFUND_FAIL"], // retry
  }

  const TERMINAL = new Set<OrderStatus>([
    "COMPLETE",
    "CUSTOMER_CANCELED",
    "REFUND_SUCCESS",
    "RETURN_FAIL",
  ])

  const t = await Order.sequelize!.transaction()
  let postCommit: null | (() => Promise<void>) = null

  try {
    const order = await Order.findByPk(orderId, { include: ORDER_INCLUDES, transaction: t })
    if (!order) {
      await t.rollback()
      return res.status(404).json({ error: "Order not found" })
    }

    if (typeof orderNote === "string") {
      ;(order as any).set("orderNote", orderNote)
      await (order as any).save({ transaction: t })
    }

    // อัปเดต tracking/carrier
    if (trackingNumber || carrier) {
      let ship: any = (order as any).shippingInfo
      if (!ship) {
        ship = await ShippingInfo.create(
          { orderId: Number((order as any).id), trackingNumber: trackingNumber ?? null, carrier: carrier ?? null } as any,
          { transaction: t }
        )
        ;(order as any).shippingInfo = ship
      } else {
        await ship.update({ ...(trackingNumber ? { trackingNumber } : {}), ...(carrier ? { carrier } : {}) }, { transaction: t })
      }
    }

    const current = (order as any).status as OrderStatus
    if (!nextStatus) {
      await order.reload({ include: ORDER_INCLUDES, transaction: t })
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

    // เปลี่ยนสถานะหลัก
    ;(order as any).set("status", nextStatus)
    await (order as any).save({ transaction: t })

    const changedById = (req as any)?.user?.sub ?? (req as any)?.user?.id ?? null
    const correlationId =
      (req.headers["x-request-id"] as string | undefined) ??
      (req.headers["x-correlation-id"] as string | undefined) ?? null

    await OrderStatusHistory.create({
      orderId: Number((order as any).id),
      fromStatus: current,
      toStatus: nextStatus,
      changedByType: "MERCHANT",
      changedById,
      reason: reason ?? null,
      source: "WEB",
      correlationId,
      metadata: { ip: req.ip, ua: req.headers["user-agent"] ?? null },
    } as any, { transaction: t })

    // sync shipping status
    const ship: any = (order as any).shippingInfo
    if (ship && ["HANDED_OVER","SHIPPED","DELIVERED"].includes(nextStatus)) {
      await ship.update({
        shippingStatus: nextStatus,
        ...(nextStatus === "SHIPPED" && !ship.shippedAt ? { shippedAt: new Date() } : {}),
      }, { transaction: t })
    }

    // Reflect RefundOrder (สร้าง/อัปเดตเฉพาะ flow คืนเงิน)
    if (["REFUND_REQUEST","REFUND_APPROVED","MERCHANT_CANCELED","REFUND_SUCCESS","REFUND_FAIL"].includes(nextStatus)) {
      let refund = await RefundOrder.findOne({ where: { orderId: (order as any).id }, transaction: t })

      if (!refund && (nextStatus === "REFUND_REQUEST" || nextStatus === "MERCHANT_CANCELED")) {
        refund = await RefundOrder.create({
          orderId: (order as any).id,
          reason: reason ?? null,
          amount: toNum((order as any).totalPrice),
          status: nextStatus === "REFUND_REQUEST" ? "REQUESTED" : "APPROVED",
          requestedBy: nextStatus === "REFUND_REQUEST" ? "CUSTOMER" : "MERCHANT",
          requestedAt: new Date(),
          approvedAt: nextStatus === "MERCHANT_CANCELED" ? new Date() : null,
          metadata: { via: "updateOrder" },
        } as any, { transaction: t })
      }

      if (refund) {
        if (nextStatus === "REFUND_APPROVED") {
          await refund.update({ status: "APPROVED", approvedAt: new Date() } as any, { transaction: t })
        } else if (nextStatus === "REFUND_SUCCESS") {
          await refund.update({ status: "SUCCESS", refundedAt: new Date() } as any, { transaction: t })
        } else if (nextStatus === "REFUND_FAIL") {
          await refund.update({ status: "FAIL" } as any, { transaction: t })
        }
      }
    }

    // ต้องยิง PGW เมื่อเข้าสถานะ REFUND_APPROVED หรือ MERCHANT_CANCELED
    if (nextStatus === "REFUND_APPROVED" || nextStatus === "MERCHANT_CANCELED") {
      const reference = (order as any).reference as string | undefined
      const refundOrderRow = await RefundOrder.findOne({ where: { orderId: (order as any).id }, transaction: t })
      const refundOrderId: number | undefined = refundOrderRow?.get("id") as any

      postCommit = async () => {
        if (!reference) {
          console.warn(`[refund] skip: order ${orderId} has no reference`)
          return
        }

        try {
          // 1) ขอรายละเอียดก่อน
          const detail = await pgwGetDetail(reference, correlationId ?? undefined)
          const action = decidePgwAction(detail?.status ?? "")

          if (action === "NONE") {
            // ไม่รู้จะทำอะไรกับสถานะนี้ → mark FAIL
            await Order.update({ status: "REFUND_FAIL" } as any, { where: { id: orderId } })
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
            return
          }

          // 2) ยิง void หรือ refund ตามที่ตัดสินใจ
          const payloadReason =
            reason ??
            (nextStatus === "MERCHANT_CANCELED" ? "Merchant canceled" : "Refund approved")

          const resp = action === "VOID"
            ? await pgwVoid(reference, payloadReason, correlationId ?? undefined)
            : await pgwRefund(reference, payloadReason, correlationId ?? undefined)

          const ok = resp?.res_code === "0000"

          if (refundOrderId) {
            await RefundStatusHistory.create({
              refundOrderId,
              fromStatus: "APPROVED",
              toStatus: ok ? "APPROVED" : "FAIL", // หมายเหตุ: ใช้ชุดสถานะของตารางนี้ (ไม่มี PROCESSING)
              reason: ok ? `${action} accepted by PGW` : `${action} fail: ${resp?.res_desc ?? "unknown"}`,
              changedByType: "SYSTEM",
              changedById: 0,
              source: "PAYMENT_GATEWAY",
              correlationId,
              metadata: { response: resp, action, detail },
            } as any)
          }

          // 3) อัปเดต order ต่อ (ตามข้อกำหนดใหม่)
          if (ok) {
            // ไป REFUND_PROCESSING
            const prev = nextStatus
            await Order.update({ status: "REFUND_PROCESSING" } as any, { where: { id: orderId } })
            await OrderStatusHistory.create({
              orderId: Number(orderId),
              fromStatus: prev,
              toStatus: "REFUND_PROCESSING",
              changedByType: "SYSTEM",
              changedById: 0,
              reason: `${action} accepted by PGW`,
              source: "PAYMENT_GATEWAY",
              correlationId,
              metadata: { response: resp },
            } as any)
          } else {
            // ไป REFUND_FAIL
            const prev = nextStatus
            await Order.update({ status: "REFUND_FAIL" } as any, { where: { id: orderId } })
            await OrderStatusHistory.create({
              orderId: Number(orderId),
              fromStatus: prev,
              toStatus: "REFUND_FAIL",
              changedByType: "SYSTEM",
              changedById: 0,
              reason: `${action} failed: ${resp?.res_desc ?? "unknown"}`,
              source: "PAYMENT_GATEWAY",
              correlationId,
              metadata: { response: resp },
            } as any)
          }
        } catch (e: any) {
          console.error("[refund] PGW error:", e?.response?.data ?? e?.message)
          // เขียน FAIL เผื่อ audit
          const prev = nextStatus
          await Order.update({ status: "REFUND_FAIL" } as any, { where: { id: orderId } })
          await OrderStatusHistory.create({
            orderId: Number(orderId),
            fromStatus: prev,
            toStatus: "REFUND_FAIL",
            changedByType: "SYSTEM",
            changedById: 0,
            reason: "PGW API error",
            source: "PAYMENT_GATEWAY",
            correlationId,
            metadata: { error: e?.response?.data ?? e?.message },
          } as any)
        }
      }
    }

    // reload DTO
    await order.reload({ include: ORDER_INCLUDES, transaction: t })
    const dto = serializeOrder(order)
    await t.commit()

    if (postCommit) await postCommit()

    return res.json({ data: dto })
  } catch (err) {
    console.error(err)
    await t.rollback()
    return res.status(500).json({ error: "Failed to update order" })
  }
}
