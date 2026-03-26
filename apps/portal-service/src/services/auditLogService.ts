import { Op, col, WhereOptions } from "sequelize";
import { AdminUser } from "@digishop/db";
import { BadRequestError, NotFoundError } from "../errors/AppError";
import { auditLogRepository } from "../repositories/auditLogRepository";

const asInt = (v: any, d: number) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.floor(n) : d; };
const likeify = (q: string) => `%${q.replace(/[%_]/g, "\\$&")}%`;

const asDateStart = (d?: string) => {
  if (!d) return null;
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return null;
  x.setHours(0,0,0,0);
  return x;
};
const asDateEnd = (d?: string) => {
  if (!d) return null;
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return null;
  x.setHours(23,59,59,999);
  return x;
};

export class AuditLogService {
  async listAuditLogs(params: Record<string, string | undefined>) {
    const { q = "", action, dateFrom, dateTo, sortBy = "createdAt", sortDir = "desc" } = params;

    const page = Math.max(asInt(params.page, 1), 1);
    const pageSize = Math.min(Math.max(asInt(params.pageSize, 20), 1), 100);
    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    const where: WhereOptions = {};
    if (action && action !== "ALL") (where as any).action = action;

    const from = asDateStart(dateFrom);
    const to = asDateEnd(dateTo);
    if (from && to) (where as any).timestamp = { [Op.between]: [from, to] };
    else if (from)  (where as any).timestamp = { [Op.gte]: from };
    else if (to)    (where as any).timestamp = { [Op.lte]: to };

    const include = [{
      model: AdminUser, as: "admin",
      attributes: [["email", "actorEmail"], ["name", "actorName"]],
      required: false,
    }];

    if (q && q.trim()) {
      const t = likeify(q.trim());
      Object.assign(where, {
        [Op.or]: [
          { "$admin.email$": { [Op.like]: t } },
          { "$admin.name$":  { [Op.like]: t } },
          { targetEntity: { [Op.like]: t } },
          { correlationId: { [Op.like]: t } },
          { ip:           { [Op.like]: t } },
          { userAgent:    { [Op.like]: t } },
        ],
      });
    }

    const dir = String(sortDir).toUpperCase() === "ASC" ? "ASC" : "DESC";
    const orderBy: any[] = [];
    if (sortBy === "action") orderBy.push([col("AdminSystemLog.action"), dir]);
    else orderBy.push([col("AdminSystemLog.timestamp"), dir]);

    const attributes = [
      "id",
      ["action", "action"],
      ["target_entity", "targetEntity"],
      ["target_id", "targetId"],
      ["ip", "ip"],
      ["user_agent", "userAgent"],
      ["correlation_id", "correlationId"],
      ["metadata_json", "metadataJson"],
      ["timestamp", "createdAt"],
    ];

    const { rows, count } = await auditLogRepository.findAndCountAuditLogs(
      where, include, orderBy, offset, limit, attributes
    );

    const data = rows.map((r: any) => ({
      id: r.get("id"),
      action: r.get("action"),
      resource: r.get("targetEntity"),
      targetId: r.get("targetId"),
      ip: r.get("ip"),
      userAgent: r.get("userAgent"),
      correlationId: r.get("correlationId"),
      createdAt: r.get("createdAt"),
      actorEmail: r.admin?.get("actorEmail") ?? "",
      actorName:  r.admin?.get("actorName")  ?? "",
      meta: r.get("metadataJson") || null,
    }));
    const total = Array.isArray(count) ? count.length : (count as number);
    return { data, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  }

  async suggestAuditLogs(q: string) {
    const raw = String(q || "").trim();
    if (!raw) return [];

    const like = likeify(raw);
    const actors = await auditLogRepository.findActorsBySuggestion(like);
    const resources = await auditLogRepository.findResourcesBySuggestion(like);

    const items: Array<{ label: string; value: string }> = [
      ...actors.map((a: any) => ({
        label: `${a.get("name")} <${a.get("email")}>`,
        value: `${a.get("name")} <${a.get("email")}>`,
      })),
      ...resources.map((r: any) => ({
        label: r.get("resource") as string,
        value: r.get("resource") as string,
      })),
    ];
    return items;
  }

  async getAuditLogDetail(id: number) {
    if (!Number.isFinite(id)) throw new BadRequestError("Invalid id");

    const log = await auditLogRepository.findAuditLogById(id);
    if (!log) throw new NotFoundError("Not found");

    return {
      id: log.get("id"),
      action: log.get("action"),
      resource: log.get("targetEntity"),
      targetId: log.get("targetId"),
      ip: log.get("ip"),
      userAgent: log.get("userAgent"),
      correlationId: log.get("correlationId"),
      createdAt: log.get("createdAt") || log.get("dbCreatedAt"),
      meta: log.get("metadataJson") || null,
      actorEmail: (log as any).admin?.get("actorEmail") ?? "",
      actorName:  (log as any).admin?.get("actorName")  ?? "",
    };
  }
}

export const auditLogService = new AuditLogService();
