// src/controllers/orders.controller.ts
import { Request, Response } from "express"
import { Op, WhereOptions } from "sequelize"

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

    const limit = toInt(pageSize, 20)
    const offset = (toInt(page, 1) - 1) * limit
    const orderField = SORT_WHITELIST.has(sortBy as any)
      ? (sortBy as keyof Order)
      : "createdAt"
    const orderDir = String(sortDir).toUpperCase() === "ASC" ? "ASC" : "DESC"

    // -------- WHERE (ORDERS) --------
    const whereOrder: WhereOptions = {}

    if (status && status !== "ALL") {
      Object.assign(whereOrder, { status })
    }
    if (storeId) {
      Object.assign(whereOrder, { storeId })
    }
    if (startDate || endDate) {
      Object.assign(whereOrder, {
        createdAt: {
          ...(startDate ? { [Op.gte]: new Date(startDate) } : {}),
          ...(endDate ?   { [Op.lte]: new Date(endDate)   } : {}),
        },
      })
    }

    // ถ้า q เป็นตัวเลข ให้ค้นหาโดย id ของออเดอร์เพิ่มด้วย (ที่ตาราง ORDERS)
    const orOnOrder: WhereOptions[] = []
    if (q?.trim() && !isNaN(Number(q))) {
      orOnOrder.push({ id: Number(q) })
    }

    const finalWhere: WhereOptions = {
      ...whereOrder,
      ...(orOnOrder.length ? { [Op.or]: orOnOrder } : {}),
    }

    // -------- USER include (ย้าย search มาที่นี่) --------
    const hasTextQuery = q?.trim() && isNaN(Number(q))
    const term = `%${q?.trim()}%`

    const customerInclude = {
      model: User,
      as: "customer",
      attributes: [
        "id",
        "email",
        "firstName",
        "lastName",
      ],
      // ถ้ามี q เป็นข้อความ → ใช้ INNER JOIN + where ใน include ของ User
      required: !!hasTextQuery,
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

    // -------- QUERY --------
    const { rows, count } = await Order.findAndCountAll({
      where: finalWhere,
      include: [
        customerInclude,
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
            "createdAt",
          ],
          separate: true,
          order: [["createdAt", "ASC"]],
        },
      ],
      order: [[orderField, orderDir]],
      limit,
      offset,
      distinct: true,
      // logging: (sql) => console.log("SQL>", sql),
    })

    // -------- MAP → UI shape --------
    const data = rows.map((o) => {
      const customer = (o as any).customer
      const ship = (o as any).shippingInfo
      const shipType = ship?.shippingType
      const addr = ship?.address
      const pay = (o as any).payment
      const items = ((o as any).items ?? []) as Array<any>
      const histories = ((o as any).statusHistory ?? []) as Array<any>

      return {
        id: String((o as any).id),
        customerName: [customer?.firstName, customer?.lastName]
          .filter(Boolean)
          .join(" "),
        customerEmail: customer?.email ?? "",
        customerPhone: addr?.phone ?? "",

        createdAt: (o as any).createdAt,
        updatedAt: (o as any).updatedAt,

        status: (o as any).status,
        statusHistory: histories.map((h) => h.toStatus),

        totalPrice: toNum((o as any).totalPrice),
        shippingCost: toNum(shipType?.price ?? 0),
        tax: 0,

        paymentMethod: pay?.paymentMethod ?? "",

        shippingType:    shipType?.name ?? undefined,
        trackingNumber:  ship?.trackingNumber ?? undefined,

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

        notes: undefined,
        refundReason: undefined,
        refundAmount: undefined,
      }
    })

    // Debug fields ของ customer (ถ้าต้องการ)
    // console.log("=== DEBUG CUSTOMER FIELDS ===")
    // rows.forEach((o: any, i: number) => {
    //   console.log(`Order[${i}]`, Object.keys(o.customer?.dataValues || {}))
    // })
    // console.log("=============================")

    res.json({
      data,
      meta: {
        page: toInt(page, 1),
        pageSize: limit,
        total: count,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to fetch orders" })
  }
}
