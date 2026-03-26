import { Op, WhereOptions } from "sequelize";
import { cacheGet, cacheSet } from "../lib/cache";
import { analyticsRepository } from "../repositories/analyticsRepository";

type MaybeDate = string | undefined;

const asDate = (v?: MaybeDate) => (v && !Number.isNaN(new Date(v).getTime()) ? new Date(v) : null);
const asInt  = (v: unknown, d = 0) => {
  const n = Number(v); return Number.isFinite(n) ? Math.trunc(n) : d;
};
const toNumber = (v: unknown) => Number.isFinite(Number(v ?? 0)) ? Number(v) : 0;

function buildOrderWhere(q: Record<string, string | undefined>): WhereOptions {
  const from = asDate(q.from);
  const to   = asDate(q.to);
  const where: WhereOptions = {};
  if (from && to) (where as any).createdAt = { [Op.between]: [from, to] };
  else if (from) (where as any).createdAt = { [Op.gte]: from };
  else if (to)   (where as any).createdAt = { [Op.lte]: to };
  return where;
}

function buildRefundWhere(q: Record<string, string | undefined>): WhereOptions {
  return buildOrderWhere(q);
}

export class AnalyticsService {
  async getKpis(query: Record<string, string | undefined>) {
    const where = buildOrderWhere(query);
    const cacheKey = `ana:kpis:${query.from || ""}:${query.to || ""}`;
    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) return cached;

    const totals: any = await analyticsRepository.getKpisTotals(where);
    const t = totals?.[0] as Record<string, unknown> | undefined;
    const gmvMinor = toNumber(t?.gmvMinor);
    const orders = toNumber(t?.orders);
    const aovMinor = orders > 0 ? Math.round(gmvMinor / orders) : 0;
    const paidOrders = toNumber(t?.paidOrders);
    const cancelOrders = toNumber(t?.cancelOrders);

    const refunds: any = await analyticsRepository.getKpisRefunds(buildRefundWhere(query));
    const refundCount = toNumber(refunds?.[0]?.refunds);

    const repeatRows: any = await analyticsRepository.getKpisRepeatRows(where);
    const usersWith2Plus = repeatRows.filter((r: any) => toNumber(r.c) >= 2).length;
    const repeatRate = usersWith2Plus / Math.max(1, repeatRows.length);

    const payload = {
      gmvMinor,
      orders,
      aovMinor,
      paidRate: orders > 0 ? paidOrders / orders : 0,
      cancelRate: orders > 0 ? cancelOrders / orders : 0,
      refundRate: orders > 0 ? refundCount / orders : 0,
      repeatRate,
    };

    await cacheSet(cacheKey, payload, 120);
    return payload;
  }

  async getTrends(query: Record<string, string | undefined>) {
    const where = buildOrderWhere(query);
    const cacheKey = `ana:trends:${query.from || ""}:${query.to || ""}`;
    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) return cached;

    const rows: any = await analyticsRepository.getTrends(where);

    const out = rows.map((r: any) => {
      const gmv = toNumber(r.gmvMinor);
      const orders = toNumber(r.orders);
      const aov = orders > 0 ? Math.round(gmv / orders) : 0;
      return { date: String(r.day), gmvMinor: gmv, orders, aovMinor: aov };
    });

    await cacheSet(cacheKey, out, 180);
    return out;
  }

  async getStatusDist(query: Record<string, string | undefined>) {
    const where = buildOrderWhere(query);
    const cacheKey = `ana:status:${query.from || ""}:${query.to || ""}`;
    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) return cached;

    const rows: any = await analyticsRepository.getStatusDist(where);

    const names: Array<"PENDING"|"PAID"|"PROCESSING"|"SHIPPED"|"DELIVERED"|"CANCELLED"> =
      ["PENDING","PAID","PROCESSING","SHIPPED","DELIVERED","CANCELLED"];

    const map = new Map<string, number>();
    rows.forEach((r: any) => map.set(String(r.name), toNumber(r.value)));

    const out = names.map(n => ({ name: n, value: map.get(n) ?? 0 }));
    await cacheSet(cacheKey, out, 180);
    return out;
  }

  async getStoreLeaderboard(query: Record<string, string | undefined>) {
    const where = buildOrderWhere(query);
    const q = String(query.q ?? "").trim();
    const segment = (query.segment as "ALL"|"TOP"|"LOW" | undefined) ?? "ALL";
    const page = Math.max(1, asInt(query.page, 1));
    const pageSize = Math.min(100, Math.max(1, asInt(query.pageSize, 20)));

    const cacheKey = `ana:stores:${query.from || ""}:${query.to || ""}:${q}:${segment}:${page}:${pageSize}`;
    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) return cached;

    const baseWhere = { ...where };

    const nameFilter: WhereOptions | undefined = q
      ? {
          [Op.or]: [
            { "$store.store_name$": { [Op.like]: `%${q}%` } },
            { store_name_snapshot: { [Op.like]: `%${q}%` } },
          ]
        }
      : undefined;

    const allRows: any = await analyticsRepository.getStoreLeaderboard(baseWhere, nameFilter);

    const materialized = allRows.map((r: any) => {
      const gmv = toNumber(r.gmvMinor);
      const orders = toNumber(r.orders);
      const aov = orders > 0 ? Math.round(gmv / orders) : 0;
      return {
        storeId: r.storeId === null ? null : toNumber(r.storeId),
        name: String(r.name ?? "Unknown"),
        gmvMinor: gmv,
        orders,
        aovMinor: aov
      };
    });

    let sorted: typeof materialized;
    if (segment === "TOP") {
      sorted = [...materialized].sort((a,b)=> b.gmvMinor - a.gmvMinor).slice(0, 10);
    } else if (segment === "LOW") {
      sorted = [...materialized].sort((a,b)=> a.gmvMinor - b.gmvMinor).slice(0, 10);
    } else {
      sorted = [...materialized].sort((a,b)=> b.gmvMinor - a.gmvMinor);
    }

    const total = sorted.length;
    const start = (page - 1) * pageSize;
    const rows = sorted.slice(start, start + pageSize);

    const payload = { total, rows };
    await cacheSet(cacheKey, payload, 300);
    return payload;
  }
}

export const analyticsService = new AnalyticsService();
