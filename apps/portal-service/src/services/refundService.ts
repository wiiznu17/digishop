import { Op, col, where as sqWhere } from "sequelize";
import { CheckOut, Order } from "@digishop/db";
import { refundRepository } from "../repositories/refundRepository";

const asInt = (v: any, d: number) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.floor(n) : d; };
const asDate = (v?: string) => (v && !Number.isNaN(new Date(v).getTime())) ? new Date(v) : null;

export class RefundService {
  async listRefunds(params: Record<string, string | undefined>) {
    const {
      q,
      orderCode,
      status,
      dateFrom,
      dateTo,
      sortBy = "createdAt", sortDir = "desc" } = params;

    const page = Math.max(asInt(params.page, 1), 1);
    const pageSize = Math.min(Math.max(asInt(params.pageSize, 20), 1), 100);
    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    const whereRefund: any = {};
    if (status && status !== "ALL") whereRefund.status = status;

    const from = asDate(dateFrom);
    const to = asDate(dateTo);
    if (from && to) whereRefund.createdAt = { [Op.between]: [from, to] };
    else if (from) whereRefund.createdAt = { [Op.gte]: from };
    else if (to) whereRefund.createdAt = { [Op.lte]: to };

    const include: any[] = [
      {
        model: Order, as: "order", required: true,
        attributes: [],
        include: [{ model: CheckOut, as: "checkout", required: true, attributes: [] }],
      },
    ];

    if (q && q.trim()) {
      const t = `%${q.trim().replace(/[%_]/g, "\\$&")}%`;
      whereRefund[Op.and] = [
        {
          [Op.or]: [
            sqWhere(col("order.customer_name_snapshot"), { [Op.like]: t }),
          ],
        },
      ];
    }

    if (orderCode && orderCode.trim()) {
      const t = `%${orderCode.trim().replace(/[%_]/g, "\\$&")}%`;
      whereRefund[Op.and] = (whereRefund[Op.and] || []).concat([
        sqWhere(col("order->checkout.order_code"), { [Op.like]: t }),
      ]);
    }

    const dir = String(sortDir).toUpperCase() === "ASC" ? "ASC" : "DESC";
    const orderBy: any[] = [];
    if (sortBy === "status") orderBy.push([col("RefundOrder.status"), dir]);
    else if (sortBy === "amount") orderBy.push([col("RefundOrder.amount_minor"), dir]);
    else orderBy.push([col("RefundOrder.created_at"), dir]);

    const attributes = [
      "id",
      ["status", "status"],
      ["amount_minor", "amountMinor"],
      ["currency_code", "currencyCode"],
      ["requested_at", "requestedAt"],
      ["approved_at", "approvedAt"],
      ["refunded_at", "refundedAt"],
      ["created_at", "createdAt"],
      [col("order.id"), "orderId"],
      [col("order.customer_name_snapshot"), "customerName"],
      [col("order.customer_email_snapshot"), "customerEmail"],
      [col("order.store_name_snapshot"), "storeName"],
      [col("order->checkout.order_code"), "orderCode"],
    ];

    const { rows, count } = await refundRepository.findAndCountRefunds(
      whereRefund, include, orderBy, offset, limit, attributes
    );

    const total = Array.isArray(count) ? count.length : (count as number);
    return {
      data: rows,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    };
  }
}

export const refundService = new RefundService();
