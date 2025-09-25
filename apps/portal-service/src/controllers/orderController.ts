import { Request, Response } from "express";
import { Op, col, where as sqWhere } from "sequelize";
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

export async function adminListOrders(req: Request, res: Response) {
  try {
    const {
      q, status, dateFrom, dateTo, sortBy = "createdAt", sortDir = "desc",
    } = req.query as Record<string, string | undefined>;

    const page = Math.max(asInt(req.query.page, 1), 1);
    const pageSize = Math.min(Math.max(asInt(req.query.pageSize, 20), 1), 100);
    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    const whereOrder: any = {};
    if (status) whereOrder.status = status;

    const from = asDate(dateFrom);
    const to = asDate(dateTo);
    if (from && to) whereOrder.createdAt = { [Op.between]: [from, to] };
    else if (from) whereOrder.createdAt = { [Op.gte]: from };
    else if (to) whereOrder.createdAt = { [Op.lte]: to };

    // base include
    const checkoutInclude: any = {
      model: CheckOut,
      as: "checkout",
      attributes: ["id", ["order_code", "orderCode"], ["customer_id", "customerId"]],
      required: false,
    };

    // ✅ ถ้ามี q ให้ filter ที่ CHECKOUT โดยตรง และตั้ง required: true เพื่อใช้ index
    if (q && q.trim()) {
      const likeStart = `${q.trim().replace(/[%_]/g, "\\$&")}%`;
      checkoutInclude.required = true;
      checkoutInclude.where = { order_code: { [Op.like]: likeStart } };
    }

    const include: any[] = [checkoutInclude];

    include.push({
      model: Review, as: "orderReviews", attributes: [], required: false,
      where: { orderId: col("Order.id") },
    });

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
      limit,
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
            ["shipping_type_name_snapshot","shippingTypeNameSnapshot"],
            ["shipping_price_minor_snapshot","shippingPriceMinorSnapshot"],
            ["address_snapshot","addressSnapshot"],
          ],
          include: [
            { model: ShippingType, as: "shippingType", attributes: ["id","name"], required: false },
            { model: Address, as: "address", attributes: ["id"], required: false },
          ],
          required: false,
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
            shippingPriceMinor: shippingInfo.get("shippingPriceMinorSnapshot") as number,
            shippedAt: shippingInfo.get("shippedAt") as Date | string | null,
            addressSnapshot: shippingInfo.get("addressSnapshot") || {},
          }
        : null,

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
