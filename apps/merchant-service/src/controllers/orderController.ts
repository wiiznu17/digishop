// src/controllers/orders.controller.ts
import { Request, Response } from "express"
import { Includeable, Op, Transaction, WhereOptions } from "sequelize"

import { Order } from "@digishop/db/src/models/Order"
import { OrderItem } from "@digishop/db/src/models/OrderItem"
import { OrderStatusHistory } from "@digishop/db/src/models/OrderStatusHistory"
import { Payment } from "@digishop/db/src/models/Payment"
import { Product } from "@digishop/db/src/models/Product"
import { ShippingInfo } from "@digishop/db/src/models/ShippingInfo"
import { ShippingType } from "@digishop/db/src/models/ShippingType"
import { User } from "@digishop/db/src/models/User"
import { Address } from "@digishop/db/src/models/Address"

const toInt = (v: unknown, def: number) =>
  (Number.isFinite(Number(v)) ? Number(v) : def)

const toNum = (v: unknown, def = 0) =>
  (v == null ? def : Number(v))

const SORT_WHITELIST = new Set<("id" | "createdAt" | "updatedAt" | "totalPrice")>([
  "id",
  "createdAt",
  "updatedAt",
  "totalPrice",
])

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
  | "REFUND_APPROVED"
  | "REFUND_SUCCESS"
  | "REFUND_FAIL"

// ───────────────────────────────────────────────────────────────────────────────
// Common includes

const ORDER_INCLUDES: Includeable[] = [
  {
    model: User,
    as: "customer",
    attributes: ["id", "email", "firstName", "lastName"],
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
        attributes: ["name", "price", "estimatedDays"],
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
    attributes: ["paymentMethod", "status", "paidAt"],
  },
  {
    model: OrderItem,
    as: "items",
    attributes: ["id", "quantity", "unitPrice"],
    include: [
      {
        model: Product,
        as: "product",
        attributes: ["id", "name", "price"],
      },
    ],
  },
  {
    model: OrderStatusHistory,
    as: "statusHistory",
    attributes: ["fromStatus", "toStatus", "reason", "createdAt"],
    separate: true,
    order: [["createdAt", "ASC"]],
  },
]

// ───────────────────────────────────────────────────────────────────────────────
// Serializer (DB -> UI)

function serializeOrder(o: any) {
  const customer   = o.customer
  const ship       = o.shippingInfo
  const shipType   = ship?.shippingType
  const addr       = ship?.address
  const pay        = o.payment
  const items      = (o.items ?? []) as Array<any>
  const histories  = (o.statusHistory ?? []) as Array<any>

  // หา reason ล่าสุดที่มีค่า
  let latestReason: string | undefined
  for (let i = histories.length - 1; i >= 0; i--) {
    const r = histories[i]?.reason
    if (r && String(r).trim().length > 0) {
      latestReason = String(r)
      break
    }
  }

  // เช็คว่ามีสถานะ REFUND_REQUEST อยู่ใน history หรือไม่
  const hasRefundRequest = histories.some(
    (h) => h.toStatus === "REFUND_REQUEST"
  )

  const totalPriceNum = toNum(o.totalPrice)

  return {
    id: String(o.id),

    customerName: [customer?.firstName, customer?.lastName]
      .filter(Boolean)
      .join(" "),

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
      : {
          recipientName: "",
          phone: "",
          street: "",
          district: "",
          province: "",
          postalCode: "",
          country: "TH",
        },

    orderItems: items.map((it) => ({
      id:       String(it.id),
      name:     it.product?.name ?? "",
      sku:      String(it.product?.id ?? ""),
      quantity: it.quantity,
      price:    toNum(it.unitPrice),
    })),

    // map refund fields/not refund fields
    notes:        !hasRefundRequest ? latestReason ?? undefined : undefined,
    refundReason: hasRefundRequest ? latestReason ?? undefined : undefined,
    refundAmount: hasRefundRequest ? totalPriceNum : undefined,
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// GET /orders

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
    console.log(">>> listOrders:", req.query)
    const limit      = toInt(pageSize, 20)
    const offset     = (toInt(page, 1) - 1) * limit
    const orderField = SORT_WHITELIST.has(sortBy as any)
      ? (sortBy as keyof Order)
      : "createdAt"
    const orderDir   = String(sortDir).toUpperCase() === "ASC" ? "ASC" : "DESC"

    // WHERE on Order
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

    // Numeric search by order id
    const orOnOrder: WhereOptions[] = []
    if (q?.trim() && !isNaN(Number(q))) {
      orOnOrder.push({ id: Number(q) })
    }

    const finalWhere: WhereOptions = {
      ...whereOrder,
      ...(orOnOrder.length ? { [Op.or]: orOnOrder } : {}),
    }

    // Text search on customer include
    const hasTextQuery = q?.trim() && isNaN(Number(q))
    const term = `%${q?.trim()}%`

    const customerInclude: Includeable = {
      model: User,
      as: "customer",
      attributes: ["id", "email", "firstName", "lastName"],
      required: !!hasTextQuery, // inner join only when searching text
      where: hasTextQuery
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
      ...ORDER_INCLUDES.filter((inc: any) => inc.as !== "customer"),
    ]

    const { rows, count } = await Order.findAndCountAll({
      where:   finalWhere,
      include: includes,
      order:  [[orderField, orderDir]],
      limit,
      offset,
      distinct: true,
      // logging: (sql) => console.log("SQL>", sql),
    })

    const data = rows.map(serializeOrder)
    console.log("<<< listOrders: found", data.length, "of", count)
    return res.json({
      data,
      meta: { page: toInt(page, 1), pageSize: limit, total: count },
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Failed to fetch orders" })
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// PATCH /orders/:orderId
// body: { status?: OrderStatus, trackingNumber?: string, carrier?: string, reason?: string }
// - Update tracking/carrier can occur without status change
// - Status transition is validated against ALLOWED_NEXT map
// - A full OrderStatusHistory record is created for every status change

export async function updateOrder(req: Request, res: Response) {
  console.log(">>> updateOrder:", req.params, req.body)

  const { orderId } = req.params

  const {
    status: nextStatus,
    trackingNumber,
    carrier,
    reason,
  }: {
    status?: OrderStatus
    trackingNumber?: string
    carrier?: string
    reason?: string
  } = req.body || {}

  if (!orderId) {
    return res.status(400).json({ error: "Missing order id" })
  }

  if (!nextStatus && !trackingNumber && !carrier) {
    return res.status(400).json({ error: "Nothing to update" })
  }

  // Status transition rules aligned with UI/business flow
  const ALLOWED_NEXT: Record<OrderStatus, OrderStatus[]> = {
    PENDING:            ["CUSTOMER_CANCELED", "PAID"],

    PAID:               ["PROCESSING", "MERCHANT_CANCELED"],

    PROCESSING:         ["READY_TO_SHIP"],

    READY_TO_SHIP:      ["HANDED_OVER"],

    HANDED_OVER:        ["SHIPPED"],

    SHIPPED:            ["DELIVERED", "TRANSIT_LACK", "AWAITING_RETURN"],

    TRANSIT_LACK:       ["RE_TRANSIT"],
    RE_TRANSIT:         ["SHIPPED"],

    DELIVERED:          ["COMPLETE", "REFUND_REQUEST"],

    COMPLETE:           [],

    CUSTOMER_CANCELED:  [],

    MERCHANT_CANCELED:  ["REFUND_APPROVED", "REFUND_FAIL"],

    REFUND_REQUEST:     ["REFUND_APPROVED", "AWAITING_RETURN"],

    AWAITING_RETURN:    ["RECEIVE_RETURN", "RETURN_FAIL"],

    RECEIVE_RETURN:     ["RETURN_VERIFIED", "RETURN_FAIL"],

    RETURN_VERIFIED:    ["REFUND_APPROVED"],

    RETURN_FAIL:        [],

    REFUND_APPROVED:    ["REFUND_SUCCESS", "REFUND_FAIL"],

    REFUND_SUCCESS:     [],

    REFUND_FAIL:        ["REFUND_SUCCESS"],
  }

  const TERMINAL = new Set<OrderStatus>([
    "COMPLETE",
    "CUSTOMER_CANCELED",
    "REFUND_SUCCESS",
    "REFUND_FAIL",
    "RETURN_FAIL",
  ])

  const t = await Order.sequelize!.transaction()

  try {
    // Load order + relations
    const order = await Order.findByPk(orderId, {
      include: ORDER_INCLUDES,
      transaction: t,
      // lock: t.LOCK.UPDATE, // enable if your dialect supports it
    })

    if (!order) {
      await t.rollback()
      return res.status(404).json({ error: "Order not found" })
    }

    const current = (order as any).status as OrderStatus

    // 1) Update tracking/carrier first (independent from status)
    if (trackingNumber || carrier) {
      let ship: any = (order as any).shippingInfo

      if (!ship) {
        ship = await ShippingInfo.create(
          {
            orderId: Number((order as any).id),
            trackingNumber: trackingNumber ?? null,
            carrier: carrier ?? null,
          } as any,
          { transaction: t }
        )
        ;(order as any).shippingInfo = ship
      } else {
        await ship.update(
          {
            ...(trackingNumber ? { trackingNumber } : {}),
            ...(carrier ? { carrier } : {}),
          },
          { transaction: t }
        )
      }
    }

    // 2) If no status change, just return after shipping update
    if (!nextStatus) {
      await order.reload({ include: ORDER_INCLUDES, transaction: t })
      const dto = serializeOrder(order)
      await t.commit()
      return res.json({ data: dto })
    }

    // 3) Validate transition
    if (TERMINAL.has(current)) {
      await t.rollback()
      return res
        .status(400)
        .json({ error: `Order is terminal (${current}), cannot transition` })
    }

    const allowed = ALLOWED_NEXT[current] ?? []
    if (!allowed.includes(nextStatus)) {
      await t.rollback()
      return res.status(400).json({
        error: `Invalid transition: ${current} -> ${nextStatus}`,
        allowedNext: allowed,
      })
    }

    // 4) Apply status change
    ;(order as any).set("status", nextStatus)
    await (order as any).save({ transaction: t })

    // 5) Append full status history (all fields)
    const changedById =
      // prefer authenticated user id if available
      (req as any)?.user?.sub ??
      (req as any)?.user?.id ??
      null

    const correlationId =
      (req.headers["x-request-id"] as string | undefined) ??
      (req.headers["x-correlation-id"] as string | undefined) ??
      null

    await OrderStatusHistory.create(
      {
        orderId:       Number((order as any).id),
        fromStatus:    current,
        toStatus:      nextStatus,
        changedByType: "MERCHANT",                 // this endpoint is merchant-driven
        changedById:   changedById,
        reason:        reason ?? null,             // optional reason from body
        source:        "WEB",                      // or "API" if you prefer
        correlationId: correlationId,
        metadata:      { ip: req.ip, ua: req.headers["user-agent"] ?? null },
      } as any,
      { transaction: t }
    )

    // 6) Reflect shipping status for shipping-related states
    const ship: any = (order as any).shippingInfo
    if (ship && ["HANDED_OVER", "SHIPPED", "DELIVERED"].includes(nextStatus)) {
      await ship.update(
        {
          shippingStatus: nextStatus,
          ...(nextStatus === "SHIPPED" && !ship.shippedAt
            ? { shippedAt: new Date() }
            : {}),
        },
        { transaction: t }
      )
    }

    // 7) Reload and return DTO
    await order.reload({ include: ORDER_INCLUDES, transaction: t })
    const dto = serializeOrder(order)

    await t.commit()
    return res.json({ data: dto })
  } catch (err) {
    console.error(err)
    await t.rollback()
    return res.status(500).json({ error: "Failed to update order" })
  }
}
