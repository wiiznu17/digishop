import { Request, Response } from "express";
import { Op, col, fn, where as sqWhere } from "sequelize";
import { Order } from "@digishop/db/src/models/Order";
import { OrderItem } from "@digishop/db/src/models/OrderItem";
import { CheckOut } from "@digishop/db/src/models/CheckOut";
import { ShippingInfo } from "@digishop/db/src/models/ShippingInfo";
import { ShippingType } from "@digishop/db/src/models/ShippingType";
import { Address } from "@digishop/db/src/models/Address";
import { Payment } from "@digishop/db/src/models/Payment";
import { Review } from "@digishop/db/src/models/Review";
import { OrderStatusHistory } from "@digishop/db/src/models/OrderStatusHistory";
import { Product } from "@digishop/db/src/models/Product";
import { ProductItem } from "@digishop/db/src/models/ProductItem";
import { Store } from "@digishop/db/src/models/Store";

import { ProductConfiguration } from "@digishop/db/src/models/ProductConfiguration";
import { VariationOption } from "@digishop/db/src/models/VariationOption";
import { Variation } from "@digishop/db/src/models/Variation";
import { ProductItemImage } from "@digishop/db/src/models/ProductItemImage";
import { RefundOrder } from "@digishop/db/src/models/RefundOrder";
import { RefundStatusHistory } from "@digishop/db/src/models/RefundStatusHistory";
import { ProductImage } from "@digishop/db/src/models/ProductImage";
import { ReturnShipmentStatus, ShippingStatus } from "@digishop/db/src/types/enum";
import { User } from "@digishop/db/src/models/User";
import { ShipmentEvent } from "@digishop/db/src/models/ShipmentEvent";
import { ReturnShipment } from "@digishop/db/src/models/ReturnShipment";
import { ReturnShipmentEvent } from "@digishop/db/src/models/ReturnShipmentEvent";

const asInt = (v: any, d: number) => {
  const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.floor(n) : d;
};
const asDate = (v?: string) => v && !Number.isNaN(new Date(v).getTime()) ? new Date(v) : null;

export async function adminSuggestOrders(req: Request, res: Response) {
  try {
    const raw = String(req.query.q || "").trim();
    if (!raw) return res.json([]);

    // ใช้ prefix เพื่อให้ btree index ทำงาน (เช่น DSG2025%)
    // escape %/_ ป้องกันกลายเป็น pattern ไม่ตั้งใจ
    const likeStart = `${raw.replace(/[%_]/g, "\\$&")}%`;

    const rows = await Order.findAll({
      include: [
        {
          model: CheckOut,
          as: "checkout",
          attributes: [["order_code", "orderCode"]],
          required: true, // ให้ optimizer เริ่มจาก CHECKOUT (ใช้ ix_checkout_order_code)
          where: { order_code: { [Op.like]: likeStart } },
        },
      ],
      attributes: [
        "id",
        ["status", "status"],
        ["grand_total_minor", "grandTotalMinor"],
        ["created_at", "createdAt"],
        ["customer_name_snapshot", "customerName"],
        ["customer_email_snapshot", "customerEmail"],
        [col("checkout.order_code"), "orderCode"],
      ],
      order: [["created_at", "DESC"]],
      limit: 8,
      subQuery: false,
    });

    return res.json(rows);
  } catch (e) {
    console.error("adminSuggestOrders error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}

function escapeLike(s: string) {
  return s.replace(/[%_]/g, "\\$&")
}

type SnapshotStat = { email: string; orderCount: number; lastOrderedAt: Date | null }
type SuggestEmail = {
  customerId: number
  currentEmail: string
  customerName: string | null
  snapshotsEmail: string[]                      // all distinct snapshot emails for this user
  snapshotStats: SnapshotStat[]            // same but with counts & last time used
  totalOrderCount: number
  lastOrderedAt: Date | null
}

export async function adminSuggestCustomerEmails(req: Request, res: Response) {
  try {
    const raw = String(req.query.q || "").trim()
    if (!raw) return res.json([])

    const likeStart = `${escapeLike(raw)}%`
    const LIMIT = 8

    // 1) Match current emails
    const users = await User.findAll({
      where: { email: { [Op.like]: likeStart } }, // Postgres? use Op.iLike
      attributes: [
        // ["id", "customerId"],
        "id",
        ["email", "currentEmail"],
        "firstName",
        "middleName",
        "lastName",
        ["updated_at", "updatedAt"]
      ],
      order: [["updated_at", "DESC"]],
      limit: LIMIT,
      raw: true
    })
    console.log("user match : ", users)

    if (!users.length) return res.json([])

    const userIds = users.map(u => Number(u.id))
    console.log("userIDs: ", userIds)
    // 2) Aggregate ALL snapshot emails for these users (no per-user limit)
    const perEmailAgg = await Order.findAll({
      attributes: [
        [col("checkout.customer_id"), "customerId"],
        ["customer_email_snapshot", "email"],
        [fn("COUNT", col("Order.id")), "orderCount"],
        [fn("MAX", col("Order.created_at")), "lastOrderedAt"]
      ],
      include: [
        {
          model: CheckOut,
          as: "checkout",
          attributes: [],
          required: true,
          where: { customerId: { [Op.in]: userIds } }
        }
      ],
      group: [col("checkout.customer_id"), col("Order.customer_email_snapshot")],
      raw: true
    })
    console.log("Per email agg: ", perEmailAgg)
    // 3) Also compute totals per user
    const perUserTotals = await Order.findAll({
      attributes: [
        [col("checkout.customer_id"), "customerId"],
        [fn("COUNT", col("Order.id")), "totalOrderCount"],
        [fn("MAX", col("Order.created_at")), "lastOrderedAt"]
      ],
      include: [
        {
          model: CheckOut,
          as: "checkout",
          attributes: [],
          required: true,
          where: { customerId: { [Op.in]: userIds } }
        }
      ],
      group: [col("checkout.customer_id")],
      raw: true
    })
    console.log("Per user total: ", perUserTotals)
    const totalsMap = new Map<number, { totalOrderCount: number; lastOrderedAt: Date | null }>(
      perUserTotals.map((t: any) => [Number(t.customerId), {
        totalOrderCount: Number(t.totalOrderCount ?? 0),
        lastOrderedAt: (t.lastOrderedAt as Date) ?? null
      }])
    )
    console.log("total map: ", totalsMap)

    // 4) Build map: userId -> snapshot stats[]
    const statsMap = new Map<number, SnapshotStat[]>()
    for (const r of perEmailAgg as any[]) {
      const cid = Number(r.customerId)
      const arr = statsMap.get(cid) ?? []
      arr.push({
        email: String(r.email),
        orderCount: Number(r.orderCount ?? 0),
        lastOrderedAt: (r.lastOrderedAt as Date) ?? null
      })
      statsMap.set(cid, arr)
    }

    console.log("stats map: ", statsMap)

    // 5) Shape response
    const result: SuggestEmail[] = (users as any[]).map(u => {
      const cid = Number(u.id)
      const stats = (statsMap.get(cid) ?? []).sort((a, b) => {
        const ta = a.lastOrderedAt ? new Date(a.lastOrderedAt).getTime() : 0
        const tb = b.lastOrderedAt ? new Date(b.lastOrderedAt).getTime() : 0
        return tb - ta
      })
      const totals = totalsMap.get(cid) ?? { totalOrderCount: 0, lastOrderedAt: null }
      return {
        customerId: cid,
        currentEmail: String(u.currentEmail),
        customerName: [u.firstName, u.middleName, u.lastName].filter(Boolean).join(" ") || null,
        snapshotsEmail: stats.map(s => s.email),        // all distinct snapshot emails
        snapshotStats: stats,                      // with counts + last used
        totalOrderCount: totals.totalOrderCount,
        lastOrderedAt: totals.lastOrderedAt
      }
    })
    console.log("result before sort: ", result)
    // Optional: sort by lastOrderedAt desc so most active users appear first
    result.sort((a, b) => {
      const ta = a.lastOrderedAt ? new Date(a.lastOrderedAt).getTime() : 0
      const tb = b.lastOrderedAt ? new Date(b.lastOrderedAt).getTime() : 0
      return tb - ta
    })
    console.log("suggest email: ", result)
    return res.json(result)
  } catch (e) {
    console.error("adminSuggestCustomerEmails error:", e)
    return res.status(500).json({ error: "Internal server error" })
  }
}


export async function adminSuggestStoreName(req: Request, res: Response) {
  try {
    const raw = String(req.query.q || "").trim();
    if (!raw) return res.json([]);

    // Prefix match for store name
    const likeStart = `${raw.replace(/[%_]/g, "\\$&")}%`;

    // 1. Find matching stores
    const stores = await Store.findAll({
      where: { storeName: { [Op.like]: likeStart } },
      attributes: [
        "id",
        ["store_name", "currentStoreName"]
      ],
      limit: 16,
      raw: true,
    });
    if (!stores.length) return res.json([]);

    const storeIds = stores.map((s: any) => s.id);

    // 2. Find orders for those stores
    const rows = await Order.findAll({
      where: { storeId: { [Op.in]: storeIds } },
      attributes: [
        "storeNameSnapshot",
        [fn("COUNT", col("Order.id")), "orderCount"],
        [fn("MAX", col("Order.created_at")), "lastOrderedAt"],
        "storeId",
      ],
      group: [
        col("Order.store_name_snapshot"),
        col("Order.store_id"),
      ],
      order: [[fn("MAX", col("Order.created_at")), "DESC"]],
      limit: 8,
      raw: true,
      subQuery: false,
    });

    // 3. Map store name from Store table
    const storeMap = new Map(stores.map((s: any) => [s.id, s.currentStoreName]));
    const result = rows.map((row: any) => ({
      storeNameSnapshot: row.storeNameSnapshot,
      orderCount: row.orderCount,
      lastOrderedAt: row.lastOrderedAt,
      storeId: row.storeId,
      currentStoreName: storeMap.get(row.storeId) ?? null,
    }));
    console.log("adminSuggestStoreName result=", result);
    return res.json(result);
  } catch (e) {
    console.error("adminSuggestStoreName error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function adminListOrders(req: Request, res: Response) {
  try {
    const {
      q,
      status,
      dateFrom,
      dateTo,
      sortBy = "createdAt",
      sortDir = "desc",
      customerEmail,
      storeName,
    } = req.query as Record<string, string | undefined>;

    const page = Math.max(asInt(req.query.page, 1), 1);
    const pageSize = Math.min(Math.max(asInt(req.query.pageSize, 20), 1), 100);
    const offset = (page - 1) * pageSize;

    const whereOrder: any = {};
    if (status) whereOrder.status = status;

    const from = asDate(dateFrom);
    const to = asDate(dateTo);
    if (from && to) whereOrder.createdAt = { [Op.between]: [from, to] };
    else if (from) whereOrder.createdAt = { [Op.gte]: from };
    else if (to) whereOrder.createdAt = { [Op.lte]: to };

    // ถ้ามี customerEmail → หา user id ก่อน แล้วหา checkout.id แล้วใช้ id หา order
    let checkoutIds: number[] | null = null;
    if (customerEmail && customerEmail.trim()) {
      const likeStart = `${customerEmail.trim().replace(/[%_]/g, "\\$&")}%`;
      const users = await User.findAll({
        where: { email: { [Op.like]: likeStart } },
        attributes: ["id"],
        raw: true,
      });
      const userIds = users.map((u: any) => u.id);
      if (userIds.length) {
        const checkouts = await CheckOut.findAll({
          where: { customerId: { [Op.in]: userIds } },
          attributes: ["id"],
          raw: true,
        });
        checkoutIds = checkouts.map((c: any) => c.id);
        if (!checkoutIds.length) {
          // ถ้าไม่เจอ checkout เลย ให้ return ว่าง
          return res.json({ data: [], meta: { page, pageSize, total: 0, totalPages: 0 } });
        }
      } else {
        // ถ้าไม่เจอ user เลย ให้ return ว่าง
        return res.json({ data: [], meta: { page, pageSize, total: 0, totalPages: 0 } });
      }
    }

    // ถ้ามี storeName → หา store id ก่อน แล้วใช้ id หา order
    if (storeName && storeName.trim()) {
      const likeStart = `${storeName.trim().replace(/[%_]/g, "\\$&")}%`;
      const stores = await Store.findAll({
        where: { storeName: { [Op.like]: likeStart } },
        attributes: ["id"],
        raw: true,
      });
      const storeIds = stores.map((s: any) => s.id);
      if (storeIds.length) {
        whereOrder.storeId = { [Op.in]: storeIds };
      } else {
        // ถ้าไม่เจอ store เลย ให้ return ว่าง
        return res.json({ data: [], meta: { page, pageSize, total: 0, totalPages: 0 } });
      }
    }

    // include checkout สำหรับ q (order code) หรือ customerEmail
    const checkoutInclude: any = {
      model: CheckOut,
      as: "checkout",
      attributes: ["id", ["order_code", "orderCode"], ["customer_id", "customerId"]],
      required: false,
    };
    if (q && q.trim()) {
      const likeStart = `${q.trim().replace(/[%_]/g, "\\$&")}%`;
      checkoutInclude.required = true;
      checkoutInclude.where = { order_code: { [Op.like]: likeStart } };
    }
    // ถ้ามี customerEmail ให้ filter ด้วย checkout.id
    if (checkoutIds && checkoutIds.length) {
      checkoutInclude.required = true;
      checkoutInclude.where = {
        ...(checkoutInclude.where || {}),
        id: { [Op.in]: checkoutIds }
      };
    }

    const include: any[] = [checkoutInclude];

    const dir = String(sortDir).toUpperCase() === "ASC" ? "ASC" : "DESC";
    const orderBy: any[] = [];
    if (sortBy === "grandTotal") orderBy.push([col("Order.grand_total_minor"), dir]);
    else if (sortBy === "status") orderBy.push([col("Order.status"), dir]);
    else orderBy.push([col("Order.created_at"), dir]);

    const group: any[] = [
      col("Order.id"),
      col("checkout.id"), col("checkout.order_code"), col("checkout.customer_id"),
    ];

    const { rows, count } = await Order.findAndCountAll({
      where: whereOrder,
      include,
      attributes: [
        "id",
        ["currency_code", "currencyCode"],
        ["grand_total_minor", "grandTotalMinor"],
        ["status", "status"],
        ["created_at", "createdAt"],
        ["customer_name_snapshot", "customerName"],
        ["customer_email_snapshot", "customerEmail"],
        ["store_name_snapshot", "storeName"],
        [col("checkout.order_code"), "orderCode"],
      ],
      group,
      order: orderBy,
      offset,
      limit: pageSize,
      distinct: true,
      subQuery: false,
    });

    const total = Array.isArray(count) ? count.length : (count as number);
    return res.json({
      data: rows,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (e) {
    console.error("adminListOrders error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function adminGetOrderDetail(req: Request, res: Response) {
  try {
    console.log("adminGetOrderDetail id=", req.params.id);
    const id = Number((req.params as { id: string }).id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

    const order = await Order.findOne({
      where: { id },
      attributes: [
        "id",
        ["status","status"],
        ["currency_code","currencyCode"],
        ["subtotal_minor","subtotalMinor"],
        ["shipping_fee_minor","shippingFeeMinor"],
        ["tax_total_minor","taxTotalMinor"],
        ["discount_total_minor","discountTotalMinor"],
        ["grand_total_minor","grandTotalMinor"],
        ["created_at","createdAt"],
        ["updated_at","updatedAt"],
        ["customer_name_snapshot","customerNameSnapshot"],
        ["customer_email_snapshot","customerEmailSnapshot"],
        ["store_name_snapshot","storeNameSnapshot"],
      ],
      include: [
        {
          model: CheckOut, as: "checkout",
          attributes: ["id", ["order_code","orderCode"], ["customer_id","customerId"]],
          required: false,
          include: [
            {
              model: Payment, as: "payment",
              attributes: [
                "id",
                ["status","status"],
                ["provider","provider"],
                ["channel","channel"],
                ["currency_code","currencyCode"],
                ["amount_authorized_minor","amountAuthorizedMinor"],
                ["amount_captured_minor","amountCapturedMinor"],
                ["amount_refunded_minor","amountRefundedMinor"],
                ["paid_at","paidAt"],
              ],
              required: false,
            },
          ],
        },
        {
          model: OrderItem, as: "items",
          attributes: [
            "id","quantity",
            ["unit_price_minor","unitPriceMinor"],
            ["line_total_minor","lineTotalMinor"],
            ["product_name_snapshot","productName"],     // fallback
            ["product_sku_snapshot","productSku"],       // fallback
            ["product_image_snapshot","productImage"],   // fallback
            ["options_text","optionsText"],              // fallback
          ],
          include: [
            { model: Product, as: "product",
              attributes: ["id", "uuid", "name"],
              required: false,
              include: [
                { model: ProductImage, as: "images",
                  attributes: ["url"],
                  where: { isMain: true },
                  required: false,
                  limit: 1
                },
              ],
            },
            {
              model: ProductItem, as: "productItem",
              required: false,
              attributes: ["uuid", "sku", "priceMinor"],
              include: [
                { model: ProductItemImage, as: "productItemImage", attributes: ["url"], required: false },
                {
                  model: ProductConfiguration, as: "configurations", required: false,
                  attributes: ["id"],
                  include: [
                    {
                      model: VariationOption, as: "variationOption", required: false,
                      attributes: ["id", "value"],
                      include: [{ model: Variation, as: "variation", attributes: ["id", "name"], required: false }],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          model: ShippingInfo, as: "shippingInfo",
          attributes: [
            "trackingNumber",
            "carrier",
            "shippedAt",
            "deliveredAt",
            "returnedToSenderAt", 
            "shippingStatus",
            ["shipping_type_name_snapshot","shippingTypeNameSnapshot"],
            ["shipping_price_minor_snapshot","shippingPriceMinorSnapshot"],
            ["address_snapshot","addressSnapshot"],
          ],
          include: [
            { model: ShippingType, as: "shippingType", attributes: ["id","name"], required: false },
            { model: Address, as: "address", attributes: ["id"], required: false },
            {
              model: ShipmentEvent, as: "events", required: false, separate: true,
              attributes: [
                "id",
                ["from_status","fromStatus"],
                ["to_status","toStatus"],
                "description","location",
                ["occurred_at","occurredAt"],
                ["created_at","createdAt"],
              ],
              order: [["occurred_at","ASC"],["id","ASC"]],
            }
          ],
          required: false,
        },
        {
          model: ReturnShipment, as: "returnShipments", required: false,
          attributes: [
            "id",
            "status",
            "carrier",
            "trackingNumber",
            "shippedAt",
            "deliveredBackAt",
            ["from_address_snapshot","fromAddressSnapshot"],
            ["to_address_snapshot","toAddressSnapshot"],
            ["created_at","createdAt"],
            ["updated_at","updatedAt"],
          ],
          include: [
            {
              model: ReturnShipmentEvent, as: "events", required: false, separate: true,
              attributes: [
                "id",
                ["from_status","fromStatus"],
                ["to_status","toStatus"],
                "description","location",
                ["occurred_at","occurredAt"],
                ["created_at","createdAt"],
              ],
              order: [["occurred_at","ASC"],["id","ASC"]],
            },
          ],
        },

        {
          model: OrderStatusHistory, as: "statusHistory",
          required: false, separate: true,
          attributes: [
            "id",
            ["from_status","fromStatus"],
            ["to_status","toStatus"],
            ["changed_by_type","changedByType"],
            ["reason","reason"],
            ["source","source"],
            ["created_at","createdAt"],
          ],
          order: [["created_at","ASC"]],
        },
        // Refund + timeline
        {
          model: RefundOrder, as: "refundOrders", required: false,
          attributes: [
            "id",
            "status",
            ["amount_minor","amountMinor"],
            ["currency_code","currencyCode"],
            "reason",
            "refundChannel",
            "refundRef",
            "requestedBy",
            "requestedAt",
            "approvedAt",
            "refundedAt",
            "description",
            "contactEmail",
            ["created_at","createdAt"],
            ["updated_at","updatedAt"],
          ],
          include: [
            {
              model: RefundStatusHistory, as: "statusHistory", required: false, separate: true,
              attributes: [
                "id",
                ["from_status","fromStatus"],
                ["to_status","toStatus"],
                "reason",
                ["changed_by_type","changedByType"],
                "source",
                ["created_at","createdAt"],
              ],
              order: [["created_at","ASC"]],
            },
          ],
        },
        { model: Store, as: "store", attributes: ["uuid", ["store_name","storeName"]], required: false },
      ],
    });

    if (!order) return res.status(404).json({ error: "Order not found" });

    const checkout = (order as any).checkout;
    const shippingInfo = (order as any).shippingInfo;
    const items = (order as any).items ?? [];
    console.log("items =", items.map((it: any) => it.toJSON()));
    const store = (order as any).store;
    const statusHistory = (order as any).statusHistory ?? [];
    const refundOrders = (order as any).refundOrders ?? [];

    const payload = {
      id: order.get("id") as number,
      orderCode: checkout?.get("orderCode") ?? "",

      status: order.get("status") as string,
      currencyCode: order.get("currencyCode") as string,
      subtotalMinor: order.get("subtotalMinor") as number,
      shippingFeeMinor: order.get("shippingFeeMinor") as number,
      taxTotalMinor: order.get("taxTotalMinor") as number,
      discountTotalMinor: order.get("discountTotalMinor") as number,
      grandTotalMinor: order.get("grandTotalMinor") as number,

      createdAt: order.get("createdAt") as Date | string,
      updatedAt: order.get("updatedAt") as Date | string,

      customer: order.get("customerEmailSnapshot")
        ? {
            id: checkout?.get("customerId") ?? null,
            name: order.get("customerNameSnapshot") as string,
            email: order.get("customerEmailSnapshot") as string,
          }
        : null,

      store: store ? { uuid: store.get("uuid"), name: store.get("storeName") } : null,

      shipping: shippingInfo
    ? {
        trackingNumber: shippingInfo.get("trackingNumber") as string | null,
        carrier: shippingInfo.get("carrier") as string | null,
        shippingTypeName: shippingInfo.get("shippingTypeNameSnapshot") as string,
        shippingStatus: shippingInfo.get("shippingStatus") as string,
        shippingPriceMinor: shippingInfo.get("shippingPriceMinorSnapshot") as number,
        shippedAt: shippingInfo.get("shippedAt") as Date | string | null,
        deliveredAt: shippingInfo.get("deliveredAt") as Date | string | null,                 // ✅ ใหม่
        returnedToSenderAt: shippingInfo.get("returnedToSenderAt") as Date | string | null,   // ✅ ใหม่
        addressSnapshot: shippingInfo.get("addressSnapshot") || {},
        events: Array.isArray(shippingInfo.events)
          ? shippingInfo.events.map((e: any) => ({
              id: e.id as number,
              fromStatus: e.fromStatus as string | null,
              toStatus: e.toStatus as string,
              description: e.description as string | null,
              location: e.location as string | null,
              occurredAt: e.occurredAt as Date | string,
              createdAt: e.createdAt as Date | string,
            }))
          : []
      }
    : null,
    // frontend ต้องไปแก้ type
      returnShipments: Array.isArray((order as any).returnShipments)
        ? (order as any).returnShipments.map((rs: any) => ({
            id: rs.id as number,
            status: rs.status as ReturnShipmentStatus,
            carrier: rs.carrier as string | null,
            trackingNumber: rs.trackingNumber as string | null,
            shippedAt: rs.shippedAt as Date | string | null,
            deliveredBackAt: rs.deliveredBackAt as Date | string | null,
            fromAddressSnapshot: rs.fromAddressSnapshot ?? null,
            toAddressSnapshot: rs.toAddressSnapshot ?? null,
            createdAt: rs.createdAt as Date | string,
            updatedAt: rs.updatedAt as Date | string,
            events: Array.isArray(rs.events)
              ? rs.events.map((e: any) => ({
                  id: e.id as number,
                  fromStatus: e.fromStatus as string | null,
                  toStatus: e.toStatus as string,
                  description: e.description as string | null,
                  location: e.location as string | null,
                  occurredAt: e.occurredAt as Date | string,
                  createdAt: e.createdAt as Date | string,
                }))
              : []
          }))
        : [],

      payment: checkout?.payment
        ? {
            id: checkout.payment.get("id") as number,
            status: checkout.payment.get("status") as string,
            provider: checkout.payment.get("provider") as string,
            channel: checkout.payment.get("channel") as string,
            currencyCode: checkout.payment.get("currencyCode") as string,
            amountAuthorizedMinor: checkout.payment.get("amountAuthorizedMinor") as number,
            amountCapturedMinor: checkout.payment.get("amountCapturedMinor") as number,
            amountRefundedMinor: checkout.payment.get("amountRefundedMinor") as number,
            paidAt: checkout.payment.get("paidAt") as Date | string | null,
          }
        : null,

      items: items.map((it: any) => {
        // Build options text from latest configurations
        const cfgs = (it.productItem?.configurations ?? []) as any[];
        const optionPairs = cfgs.map((c) => {
          const vo = c.variationOption;
          const vName = vo?.variation?.name || "";
          const oName = vo?.value || "";
          return vName && oName ? `${vName}: ${oName}` : (oName || "");
        }).filter(Boolean);
        const optionsTextLatest = optionPairs.join(", ");

        // const latestImage = it.productItem?.productItemImage?.url ?? null; // รูปจาก SKU
        const latestImage = it.product?.images[0]?.url ?? null; // รูปจาก main product
        console.log("latestImage =", it.product?.images[0]?.url);
        const latestSku = it.productItem?.sku ?? null;
        const latestName = it.product?.name ?? null;

        return {
          id: it.id as number,
          productUuid: it.product?.uuid ?? null,
          productItemUuid: it.productItem?.uuid ?? null,
          quantity: it.quantity as number,
          unitPriceMinor: it.unitPriceMinor as number,
          lineTotalMinor: it.lineTotalMinor as number,
          productName: latestName || (it.productName as string),
          productSku: latestSku ?? (it.productSku as string | null),
          productImage: (it.productImage as string | null) ?? latestImage, // รูปจาก snapshot ,จากรูปล่าสุด
          optionsText: optionsTextLatest || (it.optionsText as string | null),
        };
      }),

      timeline: statusHistory.map((h: any) => ({
        id: h.id as number,
        fromStatus: h.fromStatus as string | null,
        toStatus: h.toStatus as string,
        changedByType: h.changedByType as string,
        reason: h.reason as string | null,
        source: h.source as string | null,
        createdAt: h.createdAt as Date | string,
      })),

      refunds: refundOrders.map((r: any) => ({
        id: r.id as number,
        status: r.status as string,
        amountMinor: r.amountMinor as number,
        currencyCode: r.currencyCode as string,
        reason: r.reason as string | null,
        refundChannel: r.refundChannel as string | null,
        refundRef: r.refundRef as string | null,
        requestedBy: r.requestedBy as ("CUSTOMER" | "MERCHANT" | null),
        requestedAt: r.requestedAt as Date | string | null,
        approvedAt: r.approvedAt as Date | string | null,
        refundedAt: r.refundedAt as Date | string | null,
        description: r.description as string | null,
        contactEmail: r.contactEmail as string | null,
        createdAt: r.createdAt as Date | string,
        updatedAt: r.updatedAt as Date | string,
        timeline: (r.statusHistory ?? []).map((h: any) => ({
          id: h.id as number,
          fromStatus: h.fromStatus as string | null,
          toStatus: h.toStatus as string,
          reason: h.reason as string | null,
          changedByType: h.changedByType as string | null,
          source: h.source as string | null,
          createdAt: h.createdAt as Date | string,
        })),
      })),
    };

    return res.json(payload);
  } catch (e) {
    console.error("adminGetOrderDetail error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}
