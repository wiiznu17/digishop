import { StoreStatus } from "@digishop/db";
import { Op, col, fn, where as sqlWhere, WhereOptions } from "sequelize";
import { AppError, BadRequestError, NotFoundError, ConflictError } from "../errors/AppError";
import { storeRepository } from "../repositories/storeRepository";

const asInt = (v: any, d: number) => {
  const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.floor(n) : d;
};
const asDate = (v?: string) => v && !Number.isNaN(new Date(v).getTime()) ? new Date(v) : null;
const likeify = (q: string) => `%${q.replace(/[%_]/g, "\\$&")}%`;
const asMoneyMinor = (v: any) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
};

/** YYYY-MM */
function lastNMonthsLabels(n: number) {
  const res: string[] = [];
  const base = new Date();
  base.setDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setMonth(d.getMonth() - i);
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    res.push(`${y}-${m}`);
  }
  return res;
}

export class StoreService {
  async listStores(params: Record<string, string | undefined>) {
    const {
      q = "", status, dateFrom, dateTo, sortBy = "createdAt", sortDir = "desc",
      salesMin, salesMax, orderCountMin, orderCountMax,
    } = params;

    const page = Math.max(asInt(params.page, 1), 1);
    const pageSize = Math.min(Math.max(asInt(params.pageSize, 20), 1), 100);
    const offset = (page - 1) * pageSize;

    const storeWhere: WhereOptions = {};
    if (status && status.trim()) (storeWhere as any)["status"] = status;

    const from = asDate(dateFrom); const to = asDate(dateTo);
    if (from && to) (storeWhere as any)["createdAt"] = { [Op.between]: [from, to] };
    else if (from) (storeWhere as any)["createdAt"] = { [Op.gte]: from };
    else if (to) (storeWhere as any)["createdAt"] = { [Op.lte]: to };

    if (q && q.trim()) {
      const t = likeify(q.trim());
      Object.assign(storeWhere, {
        [Op.and]: [{ [Op.or]: [{ storeName: { [Op.like]: t } }, { email: { [Op.like]: t } }] }],
      });
    }

    const orderTotalExpr = fn("COALESCE", fn("SUM", col("storeOrders.grand_total_minor")), 0);
    const orderCountExpr = fn("COUNT", col("storeOrders.id"));

    const havingAnd: any[] = [];
    const salesMinMinor = asMoneyMinor(salesMin);
    const salesMaxMinor = asMoneyMinor(salesMax);
    if (salesMinMinor !== null) havingAnd.push(sqlWhere(orderTotalExpr, { [Op.gte]: salesMinMinor }));
    if (salesMaxMinor !== null) havingAnd.push(sqlWhere(orderTotalExpr, { [Op.lte]: salesMaxMinor }));

    const orderCountMinInt = asInt(orderCountMin, -1);
    const orderCountMaxInt = asInt(orderCountMax, -1);
    if (orderCountMin && orderCountMinInt >= 0) havingAnd.push(sqlWhere(orderCountExpr, { [Op.gte]: orderCountMinInt }));
    if (orderCountMax && orderCountMaxInt >= 0) havingAnd.push(sqlWhere(orderCountExpr, { [Op.lte]: orderCountMaxInt }));

    const dir = String(sortDir).toUpperCase() === "ASC" ? "ASC" : "DESC";
    const orderBy: any[] = [];
    if (sortBy === "status")       orderBy.push([col("Store.status"), dir]);
    else if (sortBy === "storeName") orderBy.push([col("Store.store_name"), dir]);
    else                            orderBy.push([col("Store.created_at"), dir]);

    const { rows, count } = await storeRepository.findAndCountStores(
      storeWhere, havingAnd, orderBy, offset, pageSize, orderTotalExpr, orderCountExpr
    );

    const storeIdsOnPage = rows.map((s: any) => Number(s.get("id"))).filter(Boolean);
    const productCountsRaw = await storeRepository.getProductCountsForStores(storeIdsOnPage);

    const productCountMap = new Map<number, number>();
    for (const r of productCountsRaw as any[]) {
      productCountMap.set(Number(r.storeId), Number(r.productCount ?? 0));
    }

    const data = rows.map((s: any) => ({
      id:              s.get("id"),
      uuid:            s.get("uuid"),
      storeName:       s.get("storeName"),
      email:           s.get("email"),
      status:          s.get("status"),
      createdAt:       s.get("createdAt"),
      orderTotalMinor: Number(s.get("orderTotalMinor") ?? 0),
      orderCount:      Number(s.get("orderCount") ?? 0),
      productCount:    productCountMap.get(Number(s.get("id"))) ?? 0,
      ownerName:       [s.owner?.get("firstName"), s.owner?.get("lastName")].filter(Boolean).join(" "),
      ownerEmail:      s.owner?.get("email") ?? "",
    }));

    const total = Array.isArray(count) ? count.length : (count as number);
    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async suggestStores(q: string) {
    const trimmed = String(q || "").trim();
    if (!trimmed) return [];
    const t = likeify(trimmed);
    const stores = await storeRepository.suggestStores(t);
    return stores.map((s: any) => ({ id: s.get("id"), storeName: s.get("storeName") }));
  }

  async getStoreDetail(id: number) {
    if (!Number.isFinite(id)) throw new BadRequestError("Invalid id");

    const s: any = await storeRepository.getStoreDetail(id);
    if (!s) throw new NotFoundError("Store not found");

    const aggRaw = await storeRepository.getOrderSummary(id);
    const agg = (aggRaw as any[])[0] || { totalOrders: 0, totalSalesMinor: 0, averageOrderMinor: 0, lastOrderAt: null };

    const monthExpr = fn("DATE_FORMAT", col("Order.created_at"), "%Y-%m");
    const monthlyRaw = await storeRepository.getMonthlySales(id, monthExpr);
    const monthlyMap = new Map<string, { totalSalesMinor: number; orderCount: number }>();
    for (const r of monthlyRaw as any[]) {
      monthlyMap.set(String(r.month), {
        totalSalesMinor: Number(r.totalSalesMinor ?? 0),
        orderCount: Number(r.orderCount ?? 0),
      });
    }
    const labels = lastNMonthsLabels(12);
    const monthly = labels.map((label) => ({
      month: label,
      totalSalesMinor: monthlyMap.get(label)?.totalSalesMinor ?? 0,
      orderCount: monthlyMap.get(label)?.orderCount ?? 0,
    }));

    const recentOrders = await storeRepository.getRecentOrders(id);
    const recentOrderIds = recentOrders.map((o: any) => o.get("id"));
    const recentItems = await storeRepository.getRecentOrderItems(recentOrderIds);

    const itemsByOrder = new Map<number, Array<{ productId: number; productName: string; uuid: string }>>();
    for (const it of recentItems as any[]) {
      const oid = Number(it.get("orderId"));
      const list = itemsByOrder.get(oid) ?? [];
      if (it.product) {
        list.push({
          productId: it.product.get("id"),
          productName: it.product.get("name"),
          uuid: it.product.get("uuid")
        });
      }
      itemsByOrder.set(oid, list);
    }

    return {
      id: s.get("id"),
      uuid: s.get("uuid"),
      storeName: s.get("storeName"),
      email: s.get("email"),
      status: s.get("status"),
      createdAt: s.get("createdAt"),
      productCount: Number(s.get("productCount") ?? 0),
      orderTotalMinor: Number(s.get("orderTotalMinor") ?? 0),
      orderCount: Number(s.get("orderCount") ?? 0),
      ownerName: [s.owner?.get("firstName"), s.owner?.get("lastName")].filter(Boolean).join(" "),
      ownerEmail: s.owner?.get("email") ?? "",
      orders: {
        summary: {
          totalOrders: Number(agg?.totalOrders ?? 0),
          totalSalesMinor: Number(agg?.totalSalesMinor ?? 0),
          averageOrderMinor: Number(agg?.averageOrderMinor ?? 0),
          lastOrderAt: agg?.lastOrderAt ?? null,
        },
        monthly,
        latest: recentOrders.map((o: any) => {
          const customer = (o as any).checkout?.customer;
          const customerName = [customer?.get("firstName"), customer?.get("lastName")].filter(Boolean).join(" ");
          return {
            id: o.get("id"),
            reference: o.get("reference"),
            orderCode: o.checkout.get("orderCode"),
            status: o.get("status"),
            grandTotalMinor: Number(o.get("grandTotalMinor") ?? 0),
            currencyCode: o.get("currencyCode"),
            createdAt: o.get("createdAt"),
            customer: {
              id: customer?.get("id"),
              name: customerName,
              email: customer?.get("email"),
            },
            items: (itemsByOrder.get(Number(o.get("id"))) ?? []).slice(0, 5),
          };
        }),
      },
    };
  }

  async approveStore(id: number) {
    if (!Number.isFinite(id)) throw new BadRequestError("Invalid id");

    const existing: any = await storeRepository.findStoreById(id);
    if (!existing) throw new NotFoundError("Not found");

    const currentStatus = String(existing.get("status")) as StoreStatus;
    if (currentStatus === StoreStatus.BANNED) {
      throw new ConflictError("Store is BANNED and cannot be approved");
    }
    if (currentStatus === StoreStatus.APPROVED) {
      return {
        message: "Store already approved",
        store: {
          id: existing.get("id"),
          uuid: existing.get("uuid"),
          storeName: existing.get("storeName"),
          email: existing.get("email"),
          status: existing.get("status"),
          createdAt: existing.get("createdAt"),
        },
      };
    }

    const [affected] = await storeRepository.approveStore(id);

    if (affected === 0) {
      const after: any = await storeRepository.findStoreById(id);
      if (!after) throw new NotFoundError("Not found");

      const st = String(after.get("status")) as StoreStatus;
      if (st === StoreStatus.APPROVED) {
        return {
          message: "Store already approved",
          store: {
            id: after.get("id"),
            uuid: after.get("uuid"),
            storeName: after.get("storeName"),
            email: after.get("email"),
            status: after.get("status"),
            createdAt: after.get("createdAt"),
          },
        };
      }
      if (st === StoreStatus.BANNED) {
        throw new ConflictError("Store is BANNED and cannot be approved");
      }
      throw new ConflictError("Store status is not eligible for approval");
    }

    const updated: any = await storeRepository.findStoreById(id);

    return {
      message: "Store approved",
      store: {
        id: updated?.get("id"),
        uuid: updated?.get("uuid"),
        storeName: updated?.get("storeName"),
        email: updated?.get("email"),
        status: updated?.get("status"),
        createdAt: updated?.get("createdAt"),
      },
    };
  }
}

export const storeService = new StoreService();
