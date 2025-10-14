import { Request, Response } from "express";
import { Op, col, where as sqWhere } from "sequelize";
import { RefundOrder } from "@digishop/db/src/models/RefundOrder";
import { Order } from "@digishop/db/src/models/Order";
import { CheckOut } from "@digishop/db/src/models/CheckOut";

const asInt = (v: any, d: number) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.floor(n) : d; };
const asDate = (v?: string) => (v && !Number.isNaN(new Date(v).getTime())) ? new Date(v) : null;

export async function adminListRefunds(req: Request, res: Response) {
  try {
    const {
      q,
      orderCode,
      status,
      dateFrom,
      dateTo,
      sortBy = "createdAt", sortDir = "desc" } =
      req.query as Record<string, string | undefined>;

    const page = Math.max(asInt(req.query.page, 1), 1);
    const pageSize = Math.min(Math.max(asInt(req.query.pageSize, 20), 1), 100);
    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    const whereRefund: any = {};
    if (status && status !== "ALL") whereRefund.status = status;

    const from = asDate(dateFrom);
    const to = asDate(dateTo);
    console.log("refund order from: ", from, "to: ", to)
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

    // customer name
    if (q && q.trim()) {
      const t = `%${q.trim().replace(/[%_]/g, "\\$&")}%`;
      // const maybeId = Number(q);
      whereRefund[Op.and] = [
        {
          [Op.or]: [
            // Number.isFinite(maybeId) ? sqWhere(col("order.id"), { [Op.eq]: maybeId }) : { id: -1 },
            sqWhere(col("order.customer_name_snapshot"), { [Op.like]: t }),
          ],
        },
      ];
    }

    // ── ช่อง Suggest (เฉพาะ order_code)
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

    const { rows, count } = await RefundOrder.findAndCountAll({
      where: whereRefund,
      include,
      attributes: [
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
      ],
      order: orderBy,
      offset, limit,
      subQuery: false,
      distinct: true,
    });

    const total = Array.isArray(count) ? count.length : (count as number);
    return res.json({
      data: rows,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  } catch (e) {
    console.error("adminListRefunds error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}
