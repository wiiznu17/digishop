import { Request, Response } from "express"
import axios from "axios"
import {
  Includeable,
  literal,
  Op,
  WhereOptions,
} from "sequelize"

import { Order } from "@digishop/db/src/models/Order"
import { OrderItem } from "@digishop/db/src/models/OrderItem"
import { OrderStatusHistory } from "@digishop/db/src/models/OrderStatusHistory"
import { Payment } from "@digishop/db/src/models/Payment"
import { Product } from "@digishop/db/src/models/Product"
import { ShippingInfo } from "@digishop/db/src/models/ShippingInfo"
import { User } from "@digishop/db/src/models/User"
import { RefundOrder } from "@digishop/db/src/models/RefundOrder"
import { RefundStatusHistory } from "@digishop/db/src/models/RefundStatusHistory"
import { ShippingStatus } from "@digishop/db/src/types/enum"

// ───────────────────────────────────────────────────────────────────────────────
// Helpers

const toInt = (v: unknown, def: number) =>
  (Number.isFinite(Number(v)) ? Number(v) : def)

const toNum = (v: unknown, def = 0) =>
  (v == null ? def : Number(v))

const minorTo = (n?: number | string | null, dp = 2) => {
  const x = Number(n ?? 0)
  return Number((x / 100).toFixed(dp))
}

/** อ่านค่าได้ทั้ง camelCase/snake_case และทั้ง property/get() */
function read<T = any>(obj: any, ...keys: string[]): T | undefined {
  for (const k of keys) {
    if (!obj) continue

    const viaGet =
      typeof obj.get === "function" ? obj.get(k) : undefined

    if (viaGet !== undefined && viaGet !== null) {
      return viaGet as T
    }

    if (obj[k] !== undefined && obj[k] !== null) {
      return obj[k] as T
    }
  }
  return undefined
}

const SORT_WHITELIST = new Set<
  "id" | "createdAt" | "updatedAt" | "grandTotalMinor"
>([
  "id",
  "createdAt",
  "updatedAt",
  "grandTotalMinor",
])

// ───────────────────────────────────────────────────────────────────────────────
// PGW (Payment Gateway)

const PGW_BASE =
  process.env.PGW_BASE ?? "http://localhost:4002"

const PGW_API_ID =
  process.env.MERCHANRT_API_ID ?? ""

const PGW_API_KEY =
  process.env.MERCHANRT_API_KEY ?? ""

const PGW_PARTNER_ID =
  process.env.MERCHANRT_PARTNER_ID ?? ""

const PGW_LANG =
  (process.env.PGW_LANG ?? "en") as "en" | "th"

const pathTxnDetail = (ref: string) =>
  `/v2/transaction/${encodeURIComponent(ref)}`

const pathVoid = (ref: string) =>
  `/v2/transaction/${encodeURIComponent(ref)}/void`

const pathRefund = (ref: string) =>
  `/v2/transaction/${encodeURIComponent(ref)}/refund`

type PgwVoidRefundResp = {
  request_uid?: string
  res_code?: string
  res_desc?: string
}

type PgwDetailResp = {
  status?: string
  [k: string]: any
}

function pgwHeaders(correlationId?: string) {
  return {
    "X-API-ID":      PGW_API_ID,
    "X-API-Key":     PGW_API_KEY,
    "X-Partner-ID":  PGW_PARTNER_ID,
    "Accept-Language": PGW_LANG,
    ...(correlationId
      ? { "X-Request-Id": correlationId }
      : {}),
  }
}

function normalizeDetailStatus(s?: string) {
  const v = (s ?? "")
    .toLowerCase()
    .replace(/\s+|_/g, "")

  if (v === "approved")     return "APPROVED"
  if (v === "presettled")   return "PRE_SETTLED"
  if (v === "settled")      return "SETTLED"
  return "UNKNOWN"
}

function sanitizeReason(input?: string | null): string {
  const s = (input ?? "")
    .toString()
    .trim()

  if (!s) return "Refund requested by merchant"
  return s.length > 255 ? s.slice(0, 255) : s
}

async function pgwGetDetail(reference: string, correlationId?: string) {
  const url = `${PGW_BASE}${pathTxnDetail(reference)}`
  console.log(`[detail] URL:`, url)
  const { data } = await axios.get<PgwDetailResp>(
    url,
    {
      headers: pgwHeaders(correlationId),
      timeout: 15000,
    },
  )

  return data
}

async function pgwVoid(reference: string, reason: string, correlationId?: string) {
  const url = `${PGW_BASE}${pathVoid(reference)}`
  console.log(`[void] URL:`, url)
  const { data } = await axios.post<PgwVoidRefundResp>(
    url,
    {
      reason: sanitizeReason(reason),
    },
    {
      headers: pgwHeaders(correlationId),
      timeout: 15000,
    },
  )

  return data
}

async function pgwRefund(reference: string, reason: string, correlationId?: string) {
  const url = `${PGW_BASE}${pathRefund(reference)}`
  console.log(`[refund] URL:`, url)
  const { data } = await axios.post<PgwVoidRefundResp>(
    url,
    {
      reason: sanitizeReason(reason),
    },
    {
      headers: pgwHeaders(correlationId),
      timeout: 15000,
    },
  )

  return data
}

function decidePgwAction(detailStatus: string): "VOID" | "REFUND" | "NONE" {
  const s = normalizeDetailStatus(detailStatus)

  if (s === "APPROVED")           return "VOID"
  if (s === "PRE_SETTLED")        return "REFUND"
  if (s === "SETTLED")            return "REFUND"
  return "NONE"
}

// ───────────────────────────────────────────────────────────────────────────────
// Includes — ใช้ snapshot เป็นหลัก, include live เท่าที่จำเป็น (customer + payment)

const ORDER_INCLUDES: Includeable[] = [
  {
    model:      User,
    as:         "customer",
    attributes: [
      "id",
      "email",
      "firstName",
      "lastName",
    ],
  },
  {
    model:      ShippingInfo,
    as:         "shippingInfo",
    attributes: [
      "trackingNumber",
      "carrier",
      "shippingStatus",
      "shippedAt",
      "createdAt",
      "updatedAt",

      // snapshot ตาม ERD
      "shipping_type_name_snapshot",
      "shipping_price_minor_snapshot",
      "address_snapshot",
    ],
  },
  {
    model:      Payment,
    as:         "payment",
    attributes: [
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
  {
    model:      OrderItem,
    as:         "items",
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
    include: [
      {
        model:      Product,
        as:         "product",
        attributes: [
          "id",
          "name",
        ],
      },
    ],
  },
  {
    model:      OrderStatusHistory,
    as:         "statusHistory",
    attributes: [
      "fromStatus",
      "toStatus",
      "reason",
      "createdAt",
    ],
    separate: true,
    order:    [
      ["createdAt", "ASC"],
    ],
  },
  {
    model:      RefundOrder,
    as:         "refundOrders",
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
  },
]

// ───────────────────────────────────────────────────────────────────────────────
// Serializer — อ่านจาก snapshot ตาม ERD

function serializeOrder(order: any) {
  const customer  = order.customer
  const ship      = order.shippingInfo
  const pay       = order.payment
  const items     = (order.items ?? []) as Array<any>
  const histories = (order.statusHistory ?? []) as Array<any>
  const refund    =
    (order as any).refundOrder as (undefined | {
      reason?: string | null
      amountMinor?: number | null
      currencyCode?: string | null
    })

  // order-level (minor)
  const grandMinor =
    read<number>(order, "grand_total_minor", "grandTotalMinor") ?? 0

  const shippingSnap =
    read<number>(ship, "shipping_price_minor_snapshot", "shippingPriceMinorSnapshot")

  const currency =
    read<string>(order, "currency_code", "currencyCode")
    ?? read<string>(pay, "currency_code", "currencyCode")
    ?? "THB"

  // customer snapshot first
  const customerName =
    read<string>(order, "customer_name_snapshot", "customerNameSnapshot")
    ?? [customer?.firstName, customer?.lastName]
        .filter(Boolean)
        .join(" ")

  const customerEmail =
    read<string>(order, "customer_email_snapshot", "customerEmailSnapshot")
    ?? (customer?.email ?? "")

  // address snapshot
  const addrSnap =
    read<any>(ship, "address_snapshot", "addressSnapshot")

  const shippingAddress = addrSnap
    ? {
        recipientName: addrSnap.recipientName ?? "",
        phone:         addrSnap.phone ?? "",
        addressNumber: addrSnap.addressNumber ?? undefined,
        building:      addrSnap.building ?? undefined,
        subStreet:     addrSnap.subStreet ?? undefined,
        street:        addrSnap.street ?? "",
        subdistrict:   addrSnap.subdistrict ?? undefined,
        district:      addrSnap.district ?? "",
        province:      addrSnap.province ?? "",
        postalCode:    addrSnap.postalCode ?? "",
        country:       addrSnap.country ?? "TH",
      }
    : {
        recipientName: "",
        phone:         "",
        street:        "",
        district:      "",
        province:      "",
        postalCode:    "",
        country:       "TH",
      }

  // shipping type snapshot
  const shippingTypeName =
    read<string>(ship, "shipping_type_name_snapshot", "shippingTypeNameSnapshot")

  // items via snapshot
  const orderItems = items.map((it) => ({
    id:       String(it.id),
    sku:
      read<string>(it, "product_sku_snapshot", "productSkuSnapshot")
      ?? String(it.product?.id ?? ""),
    name:
      read<string>(it, "product_name_snapshot", "productNameSnapshot")
      ?? (it.product?.name ?? ""),
    quantity:  toInt(it.quantity, 0),
    price:     minorTo(read<number>(it, "unit_price_minor", "unitPriceMinor"), 2),
    discount:  minorTo(read<number>(it, "discount_minor", "discountMinor"), 2),
    taxRate:   toNum(read<number>(it, "tax_rate", "taxRate"), 0),
  }))

  return {
    id:        String(order.id),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,

    status:        order.status,
    statusHistory: histories.map((h) => h.toStatus),

    // amounts (major)
    currency,
    subtotal:
      minorTo(read<number>(order, "subtotal_minor", "subtotalMinor"), 2),
    shippingCost:
      minorTo(
        shippingSnap
          ?? read<number>(order, "shipping_fee_minor", "shippingFeeMinor"),
        2,
      ),
    tax:
      minorTo(read<number>(order, "tax_total_minor", "taxTotalMinor"), 2),
    discount:
      minorTo(read<number>(order, "discount_total_minor", "discountTotalMinor"), 2),
    grandTotal:
      minorTo(grandMinor, 2),

    paymentMethod:
      read<string>(pay, "payment_method", "paymentMethod") ?? "",

    payment: pay
      ? {
          provider:
            read<string>(pay, "provider", "provider") ?? undefined,
          providerRef:
            read<string>(pay, "provider_ref", "providerRef") ?? undefined,
          channel:
            read<string>(pay, "channel", "channel") ?? undefined,
          pgwStatus:
            read<string>(pay, "pgw_status", "pgwStatus") ?? undefined,
          paidAt:
            read<Date>(pay, "paid_at", "paidAt") ?? undefined,
          authorized:
            minorTo(
              read<number>(pay, "amount_authorized_minor", "amountAuthorizedMinor"),
              2,
            ),
          captured:
            minorTo(
              read<number>(pay, "amount_captured_minor", "amountCapturedMinor"),
              2,
            ),
          refunded:
            minorTo(
              read<number>(pay, "amount_refunded_minor", "amountRefundedMinor"),
              2,
            ),
        }
      : undefined,

    shippingType:   shippingTypeName ?? undefined,
    trackingNumber: read<string>(ship, "tracking_number", "trackingNumber"),
    carrier:        read<string>(ship, "carrier", "carrier"),
    shippedAt:      read<Date>(ship, "shipped_at", "shippedAt"),
    shippingStatus: read<string>(ship, "shipping_status", "shippingStatus"),

    customerName,
    customerEmail,
    customerPhone:  addrSnap?.phone ?? "",

    orderItems,

    notes:
      read<string>(order, "order_note", "orderNote") ?? undefined,

    refundReason:
      read<string>(refund, "reason", "reason") ?? undefined,

    refundAmount:
      refund?.amountMinor != null
        ? minorTo(refund.amountMinor, 2)
        : undefined,
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// GET /orders/summary — ใช้ทำการ์ดสรุปด้านบน

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

    // 1) Total Orders
    const totalOrders = await Order.count({ where: orderWhere })

    // 2) Pending Payment (current status = PENDING เท่านั้น)
    const pendingPayment = await Order.count({
      where: { ...orderWhere, status: "PENDING" },
    })

    // 3) Paid Orders (เคยผ่าน PAID)
    const paidOrders = await OrderStatusHistory.count({
      distinct: true,
      col: "orderId",
      where: {
        toStatus: "PAID",
        ...(storeId ? { orderId: literal(`EXISTS (SELECT 1 FROM ORDERS o WHERE o.id = "OrderStatusHistory"."orderId" AND o.store_id = ${storeId})`) } : {}),
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

    // 4) Processing (เคยผ่าน PROCESSING หรือ READY_TO_SHIP)
    const processing = await OrderStatusHistory.count({
      distinct: true,
      col: "orderId",
      where: {
        toStatus: { [Op.in]: ["PROCESSING", "READY_TO_SHIP"] },
      },
    })

    // 5) Handed Over (เคยผ่าน HANDED_OVER)
    const handedOver = await OrderStatusHistory.count({
      distinct: true,
      col: "orderId",
      where: { toStatus: "HANDED_OVER" },
    })

    // 6) Refund Requests (เคยเข้าสู่ REFUND_*)
    const refunds = await OrderStatusHistory.count({
      distinct: true,
      col: "orderId",
      where: { toStatus: { [Op.like]: "REFUND%" } },
    })

    // 7) Total Revenue (exclude canceled & refund-success)
    const revenueOrders = await Order.findAll({
      attributes: ["grandTotalMinor"],
      where: {
        ...orderWhere,
        status: { [Op.notIn]: ["CUSTOMER_CANCELED", "MERCHANT_CANCELED", "REFUND_SUCCESS"] },
      },
      raw: true,
    })
    const totalRevenueMinor = revenueOrders.reduce(
      (sum, o: any) => sum + (o.grandTotalMinor || 0),
      0
    )

    // 8) Completed Today
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
    console.log("completedToday:", { totalOrders, completedToday })
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

export async function listOrders(req: Request, res: Response) {
  try {
    const {
      page       = "1",
      pageSize   = "20",
      status,
      storeId,
      q,
      startDate,
      endDate,
      sortBy     = "createdAt",
      sortDir    = "DESC",
    } = req.query as Record<string, string>

    const limit =
      toInt(pageSize, 20)

    const offset =
      (toInt(page, 1) - 1) * limit

    const orderField =
      SORT_WHITELIST.has(sortBy as any)
        ? (sortBy as any)
        : "createdAt"

    const orderDir =
      String(sortDir).toUpperCase() === "ASC" ? "ASC" : "DESC"

    const whereOrder: WhereOptions = {}

    if (status && status !== "ALL") {
      Object.assign(
        whereOrder,
        { status },
      )
    }

    if (storeId) {
      Object.assign(
        whereOrder,
        { storeId },
      )
    }

    if (startDate || endDate) {
      Object.assign(
        whereOrder,
        {
          createdAt: {
            ...(startDate
              ? { [Op.gte]: new Date(startDate) }
              : {}),
            ...(endDate
              ? { [Op.lte]: new Date(endDate) }
              : {}),
          },
        },
      )
    }

    const orOnOrder: WhereOptions[] = []

    if (q?.trim() && !isNaN(Number(q))) {
      orOnOrder.push(
        { id: Number(q) },
      )
    }

    const finalWhere: WhereOptions = {
      ...whereOrder,
      ...(orOnOrder.length
        ? { [Op.or]: orOnOrder }
        : {}),
    }

    const hasTextQuery =
      q?.trim() && isNaN(Number(q))

    const term =
      `%${q?.trim()}%`

    const customerInclude: Includeable = {
      model:      User,
      as:         "customer",
      attributes: [
        "id",
        "email",
        "firstName",
        "lastName",
      ],
      required:   !!hasTextQuery,
      where:      hasTextQuery
        ? {
            [Op.or]: [
              { firstName: { [Op.like]: term } },
              { lastName:  { [Op.like]: term } },
              { email:     { [Op.like]: term } },
            ],
          }
        : undefined,
    }

    const includes: Includeable[] = [
      customerInclude,
      ...ORDER_INCLUDES.filter(
        (inc: any) => inc.as !== "customer",
      ),
    ]

    const { rows, count } =
      await Order.findAndCountAll({
        where:   finalWhere,
        include: includes,
        order:   [
          [orderField, orderDir],
        ],
        limit,
        offset,
        distinct: true,
      })

    const data =
      rows.map(serializeOrder)

    console.log(
      "listOrders: found",
      count,
      "orders",
    )

    console.log(
      "listOrders: query",
      {
        where: finalWhere,
        order: [[orderField, orderDir]],
        limit,
        offset,
      },
    )

    console.log(
      "list order: ",
      data.map((d) => d.id).join(", "),
    )

    return res.json({
      data,
      meta: {
        page:     toInt(page, 1),
        pageSize: limit,
        total:    count,
      },
    })
  } catch (err) {
    console.error(err)
    return res
      .status(500)
      .json({ error: "Failed to fetch orders" })
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// PATCH /orders/:orderId  — transitions + PGW VOID/REFUND

export async function updateOrder(req: Request, res: Response) {
  const { orderId } = req.params

  const {
    status:          nextStatus,
    trackingNumber,
    carrier,
    reason,
    orderNote,
  }: {
    status?:        string
    trackingNumber?: string
    carrier?:        string
    reason?:         string
    orderNote?:      string
  } = req.body || {}

  if (!orderId) {
    return res
      .status(400)
      .json({ error: "Missing order id" })
  }

  const nothingToUpdate =
    !nextStatus
    && !trackingNumber
    && !carrier
    && typeof orderNote !== "string"

  if (nothingToUpdate) {
    return res
      .status(400)
      .json({ error: "Nothing to update" })
  }

  // mapping สถานะ order → shipping_status (ตาม enum เดิมของระบบ)
  const mapShipping: Record<string, ShippingStatus | undefined> = {
    HANDED_OVER:   ShippingStatus.RECIEVE_PARCEL,
    SHIPPED:       ShippingStatus.IN_TRANSIT,
    DELIVERED:     ShippingStatus.DELIVERED,
    TRANSIT_LACK:  ShippingStatus.TRANSIT_ISSUE,
    RE_TRANSIT:    ShippingStatus.IN_TRANSIT,
  }

  // ALLOWED transitions
  const ALLOWED_NEXT: Record<string, string[]> = {
    PENDING:           ["CUSTOMER_CANCELED", "PAID"],
    PAID:              ["PROCESSING", "MERCHANT_CANCELED", "REFUND_REQUEST"],
    PROCESSING:        ["READY_TO_SHIP"],
    READY_TO_SHIP:     ["HANDED_OVER"],
    HANDED_OVER:       ["SHIPPED"],
    SHIPPED:           ["DELIVERED", "TRANSIT_LACK", "AWAITING_RETURN"],
    TRANSIT_LACK:      ["RE_TRANSIT"],
    RE_TRANSIT:        ["SHIPPED"],
    DELIVERED:         ["COMPLETE", "REFUND_REQUEST"],
    COMPLETE:          [],
    CUSTOMER_CANCELED: [],
    MERCHANT_CANCELED: ["REFUND_PROCESSING", "REFUND_FAIL"],
    REFUND_REQUEST:    ["REFUND_APPROVED", "AWAITING_RETURN", "REFUND_REJECTED"],
    AWAITING_RETURN:   ["RECEIVE_RETURN", "RETURN_FAIL"],
    RECEIVE_RETURN:    ["RETURN_VERIFIED", "RETURN_FAIL"],
    RETURN_VERIFIED:   ["REFUND_APPROVED"],
    RETURN_FAIL:       [],
    REFUND_REJECTED:   ["PROCESSING", "COMPLETE"],
    REFUND_APPROVED:   ["REFUND_PROCESSING", "REFUND_FAIL"],
    REFUND_PROCESSING: ["REFUND_SUCCESS"],
    REFUND_SUCCESS:    [],
    REFUND_FAIL:       ["REFUND_PROCESSING", "REFUND_FAIL"],
  }

  const TERMINAL = new Set<string>([
    "COMPLETE",
    "CUSTOMER_CANCELED",
    "REFUND_SUCCESS",
    "RETURN_FAIL",
  ])

  const t = await Order.sequelize!.transaction()
  let postCommit: null | (() => Promise<void>) = null

  try {
    const order =
      await Order.findByPk(
        orderId,
        {
          include:     ORDER_INCLUDES,
          transaction: t,
        },
      )

    if (!order) {
      await t.rollback()
      return res
        .status(404)
        .json({ error: "Order not found" })
    }

    // update note
    if (typeof orderNote === "string") {
      ;(order as any).set(
        "order_note",
        orderNote,
      )

      await (order as any).save({
        transaction: t,
      })
    }

    // update tracking/carrier
    if (trackingNumber || carrier) {
      let ship: any = (order as any).shippingInfo

      if (!ship) {
        ship = await ShippingInfo.create(
          {
            orderId:        Number((order as any).id),
            trackingNumber: trackingNumber ?? null,
            carrier:        carrier ?? null,
          } as any,
          {
            transaction: t,
          },
        )

        ;(order as any).shippingInfo = ship
      } else {
        await ship.update(
          {
            ...(trackingNumber ? { trackingNumber } : {}),
            ...(carrier        ? { carrier }        : {}),
          },
          {
            transaction: t,
          },
        )
      }
    }

    const current =
      (order as any).status as string

    if (!nextStatus) {
      await order.reload({
        include:     ORDER_INCLUDES,
        transaction: t,
      })

      const dto = serializeOrder(order)

      await t.commit()

      return res.json({ data: dto })
    }

    if (TERMINAL.has(current)) {
      await t.rollback()
      return res
        .status(400)
        .json({
          error: `Order is terminal (${current}), cannot transition`,
        })
    }

    const allowed =
      ALLOWED_NEXT[current] ?? []

    if (!allowed.includes(nextStatus)) {
      await t.rollback()
      return res
        .status(400)
        .json({
          error:       `Invalid transition: ${current} -> ${nextStatus}`,
          allowedNext: allowed,
        })
    }

    // เปลี่ยนสถานะหลัก
    ;(order as any).set("status", nextStatus)

    await (order as any).save({
      transaction: t,
    })

    const changedById =
      (req as any)?.user?.sub
      ?? (req as any)?.user?.id
      ?? null

    const correlationId =
      (req.headers["x-request-id"] as string | undefined)
      ?? (req.headers["x-correlation-id"] as string | undefined)
      ?? null

    await OrderStatusHistory.create(
      {
        orderId:       Number((order as any).id),
        fromStatus:    current,
        toStatus:      nextStatus,
        changedByType: "MERCHANT",
        changedById,
        reason:        reason ?? null,
        source:        "WEB",
        correlationId,
        metadata: {
          ip: req.ip,
          ua: req.headers["user-agent"] ?? null,
        },
      } as any,
      {
        transaction: t,
      },
    )

    // sync shipping_status
    const ship: any = (order as any).shippingInfo

    const newShipStatus =
      mapShipping[nextStatus]

    if (ship && newShipStatus) {
      await ship.update(
        {
          shippingStatus: newShipStatus,
          ...(nextStatus === "SHIPPED" && !ship.shippedAt
            ? { shippedAt: new Date() }
            : {}),
        },
        {
          transaction: t,
        },
      )
    }

    // Reflect RefundOrder (ใช้ amount_minor/currency_code)
    if (
      [
        "REFUND_REQUEST",
        "REFUND_APPROVED",
        "MERCHANT_CANCELED",
        "REFUND_SUCCESS",
        "REFUND_FAIL",
      ].includes(nextStatus)
    ) {
      let refund =
        await RefundOrder.findOne({
          where:       { orderId: (order as any).id },
          transaction: t,
        })

      const orderGrandMinor =
        read<number>(order, "grand_total_minor", "grandTotalMinor") ?? 0

      const currency =
        read<string>(order, "currency_code", "currencyCode") ?? "THB"

      if (
        !refund
        && (nextStatus === "REFUND_REQUEST" || nextStatus === "MERCHANT_CANCELED")
      ) {
        refund = await RefundOrder.create(
          {
            orderId:      (order as any).id,
            reason:       reason ?? null,
            amountMinor:  orderGrandMinor,
            currencyCode: currency,
            status:
              nextStatus === "REFUND_REQUEST"
                ? "REQUESTED"
                : "APPROVED",
            requestedBy:
              nextStatus === "REFUND_REQUEST"
                ? "CUSTOMER"
                : "MERCHANT",
            requestedAt: new Date(),
            approvedAt:
              nextStatus === "MERCHANT_CANCELED"
                ? new Date()
                : null,
            metadata:     { via: "updateOrder" },
          } as any,
          {
            transaction: t,
          },
        )
      }

      if (refund) {
        if (nextStatus === "REFUND_APPROVED") {
          await refund.update(
            {
              status:    "APPROVED",
              approvedAt: new Date(),
            } as any,
            { transaction: t },
          )
        } else if (nextStatus === "REFUND_SUCCESS") {
          await refund.update(
            {
              status:    "SUCCESS",
              refundedAt: new Date(),
            } as any,
            { transaction: t },
          )
        } else if (nextStatus === "REFUND_FAIL") {
          await refund.update(
            { status: "FAIL" } as any,
            { transaction: t },
          )
        }
      }
    }

    // ยิง PGW เมื่อ REFUND_APPROVED หรือ MERCHANT_CANCELED
    if (nextStatus === "REFUND_APPROVED" || nextStatus === "MERCHANT_CANCELED") {
      const pay       = (order as any).payment
      const providerRef =
        read<string>(pay, "provider_ref", "providerRef")

      const orderRef  =
        read<string>(order, "reference", "reference")

      const reference =
        providerRef || orderRef

      const refundOrderRow =
        await RefundOrder.findOne({
          where:       { orderId: (order as any).id },
          transaction: t,
        })

      const refundOrderId: number | undefined =
        (refundOrderRow?.get("id") as any)

      postCommit = async () => {
        if (!reference) {
          console.warn(
            `[refund] skip: order ${orderId} has no provider_ref/reference`,
          )
          return
        }

        try {
          const detail =
            await pgwGetDetail(reference, correlationId ?? undefined)

          const action =
            decidePgwAction(detail?.status ?? "")
          console.log(`[refund] order ${orderId} PGW detail status:`, detail?.status, "=> action:", action)

          if (action === "NONE") {
            await Order.update(
              { status: "REFUND_FAIL" } as any,
              { where: { id: orderId } },
            )

            if (refundOrderId) {
              await RefundStatusHistory.create({
                refundOrderId,
                fromStatus:    "APPROVED",
                toStatus:      "FAIL",
                reason:        `Unsupported PGW status: ${detail?.status ?? "unknown"}`,
                changedByType: "SYSTEM",
                changedById:   0,
                source:        "PAYMENT_GATEWAY",
                correlationId,
                metadata:      { detail },
              } as any)
            }

            return
          }

          const payloadReason =
            reason
            ?? (nextStatus === "MERCHANT_CANCELED"
                  ? "Merchant canceled"
                  : "Refund approved")

          const resp =
            action === "VOID"
              ? await pgwVoid(reference, payloadReason, correlationId ?? undefined)
              : await pgwRefund(reference, payloadReason, correlationId ?? undefined)

          const ok =
            resp?.res_code === "0000"

          if (refundOrderId) {
            await RefundStatusHistory.create({
              refundOrderId,
              fromStatus:    "APPROVED",
              toStatus:      ok ? "APPROVED" : "FAIL",
              reason:        ok
                ? `${action} accepted by PGW`
                : `${action} fail: ${resp?.res_desc ?? "unknown"}`,
              changedByType: "SYSTEM",
              changedById:   0,
              source:        "PAYMENT_GATEWAY",
              correlationId,
              metadata:      {
                response: resp,
                action,
                detail,
              },
            } as any)
          }

          const prev = nextStatus

          if (ok) {
            await Order.update(
              { status: "REFUND_PROCESSING" } as any,
              { where: { id: orderId } },
            )

            await OrderStatusHistory.create({
              orderId:       Number(orderId),
              fromStatus:    prev,
              toStatus:      "REFUND_PROCESSING",
              changedByType: "SYSTEM",
              changedById:   0,
              reason:        `${action} accepted by PGW`,
              source:        "PAYMENT_GATEWAY",
              correlationId,
              metadata:      { response: resp },
            } as any)
          } else {
            await Order.update(
              { status: "REFUND_FAIL" } as any,
              { where: { id: orderId } },
            )

            await OrderStatusHistory.create({
              orderId:       Number(orderId),
              fromStatus:    prev,
              toStatus:      "REFUND_FAIL",
              changedByType: "SYSTEM",
              changedById:   0,
              reason:        `${action} failed: ${resp?.res_desc ?? "unknown"}`,
              source:        "PAYMENT_GATEWAY",
              correlationId,
              metadata:      { response: resp },
            } as any)
          }
        } catch (e: any) {
          console.error("[refund] PGW error:", e?.response?.data ?? e?.message)

          const prev = nextStatus

          await Order.update(
            { status: "REFUND_FAIL" } as any,
            { where: { id: orderId } },
          )

          await OrderStatusHistory.create({
            orderId:       Number(orderId),
            fromStatus:    prev,
            toStatus:      "REFUND_FAIL",
            changedByType: "SYSTEM",
            changedById:   0,
            reason:        "PGW API error",
            source:        "PAYMENT_GATEWAY",
            correlationId,
            metadata:      { error: e?.response?.data ?? e?.message },
          } as any)
        }
      }
    }

    await order.reload({
      include:     ORDER_INCLUDES,
      transaction: t,
    })

    const dto =
      serializeOrder(order)

    await t.commit()

    if (postCommit) {
      await postCommit()
    }

    return res.json({ data: dto })
  } catch (err) {
    console.error(err)
    await t.rollback()
    return res
      .status(500)
      .json({ error: "Failed to update order" })
  }
}
