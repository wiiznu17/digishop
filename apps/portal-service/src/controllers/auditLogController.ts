import { Request, Response } from "express"
import { Op, col, fn, WhereOptions } from "sequelize"
import { AdminSystemLog } from "@digishop/db/src/models/portal/AdminSystemLog"
import { AdminUser } from "@digishop/db/src/models/portal/AdminUser"

const asInt = (v: any, d: number) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.floor(n) : d }
const likeify = (q: string) => `%${q.replace(/[%_]/g, "\\$&")}%`

const asDateStart = (d?: string) => {
  if (!d) return null
  const x = new Date(d)
  if (Number.isNaN(x.getTime())) return null
  x.setHours(0,0,0,0)
  return x
}
const asDateEnd = (d?: string) => {
  if (!d) return null
  const x = new Date(d)
  if (Number.isNaN(x.getTime())) return null
  x.setHours(23,59,59,999)
  return x
}

// GET /api/admin/audit-logs/list
export async function adminListAuditLogs(req: Request, res: Response) {
  try {
    const { q = "", action, dateFrom, dateTo, sortBy = "createdAt", sortDir = "desc" } =
      req.query as Record<string, string | undefined>

    const page = Math.max(asInt(req.query.page, 1), 1)
    const pageSize = Math.min(Math.max(asInt(req.query.pageSize, 20), 1), 100)
    const offset = (page - 1) * pageSize
    const limit = pageSize

    const where: WhereOptions = {}
    if (action && action !== "ALL") (where as any).action = action

    const from = asDateStart(dateFrom)
    const to = asDateEnd(dateTo)
    if (from && to) (where as any).timestamp = { [Op.between]: [from, to] }
    else if (from)  (where as any).timestamp = { [Op.gte]: from }
    else if (to)    (where as any).timestamp = { [Op.lte]: to }

    const include = [{
      model: AdminUser, as: "admin",
      attributes: [["email","actorEmail"], ["name","actorName"]],
      required: false,
    }]

    // q: ค้นหา email / name / target_entity / correlation_id / ip / user_agent
    if (q && q.trim()) {
      const t = likeify(q.trim())
      Object.assign(where, {
        [Op.or]: [
          { "$admin.email$": { [Op.like]: t } },
          { "$admin.name$":  { [Op.like]: t } },
          { targetEntity: { [Op.like]: t } },
          { correlationId: { [Op.like]: t } },
          { ip:           { [Op.like]: t } },
          { userAgent:    { [Op.like]: t } },
        ],
      })
    }

    const dir = String(sortDir).toUpperCase() === "ASC" ? "ASC" : "DESC"
    const orderBy: any[] = []
    if (sortBy === "action") orderBy.push([col("AdminSystemLog.action"), dir])
    else orderBy.push([col("AdminSystemLog.timestamp"), dir])

    const { rows, count } = await AdminSystemLog.findAndCountAll({
      where,
      include: [{
        model: AdminUser, as: "admin",
        attributes: [["email","actorEmail"], ["name","actorName"]],
        required: false,
      }],
      attributes: [
        "id",
        ["action","action"],
        ["target_entity","targetEntity"],
        ["target_id","targetId"],
        ["ip","ip"],
        ["user_agent","userAgent"],
        ["correlation_id","correlationId"],
        ["metadata_json","metadataJson"],
        ["timestamp","createdAt"],
      ],
      order: orderBy,
      offset, limit,
      distinct: true, subQuery: false,
    })

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
    }))
    const total = Array.isArray(count) ? count.length : (count as number)
    return res.json({ data, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } })
  } catch (e) {
    console.error("adminListAuditLogs error:", e)
    return res.status(500).json({ error: "Internal server error" })
  }
}

// GET /api/admin/audit-logs/suggest?q=...
export async function adminSuggestAuditLogs(req: Request, res: Response) {
  try {
    const raw = String(req.query.q || "").trim()
    if (!raw) return res.json([])

    const like = likeify(raw)

    // 1) actors (จาก logs เท่านั้น)
    const actors = await AdminUser.findAll({
      include: [
        { model: AdminSystemLog, as: "logs",
          required: true,
          attributes: []
        }
      ],
      attributes: [["email","email"], ["name","name"], [fn("MIN", col("logs.id")), "anyLog"]],
      where: { [Op.or]: [{ email: { [Op.like]: like } }, { name: { [Op.like]: like } }] },
      group: ["AdminUser.id"],
      order: [[col("AdminUser.name"), "ASC"]],
      limit: 5,
      subQuery: false,
    })

    // 2) resources
    const resources = await AdminSystemLog.findAll({
      attributes: [["target_entity","resource"], [fn("COUNT", col("id")), "cnt"]],
      where: { targetEntity: { [Op.like]: like } },
      group: ["target_entity"],
      order: [[fn("COUNT", col("id")), "DESC"]],
      limit: 5,
    })

    const items: Array<{ label: string; value: string }> = [
      ...actors.map((a: any) => ({
        label: `${a.get("name")} <${a.get("email")}>`,
        value: `${a.get("name")} <${a.get("email")}>`,
      })),
      ...resources.map((r: any) => ({
        label: r.get("resource") as string,
        value: r.get("resource") as string,
      })),
    ]
    return res.json(items)
  } catch (e) {
    console.error("adminSuggestAuditLogs error:", e)
    return res.status(500).json({ error: "Internal server error" })
  }
}

// GET /api/admin/audit-logs/:id/detail
export async function adminGetAuditLogDetail(req: Request, res: Response) {
  try {
    const id = Number((req.params as { id: string }).id)
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" })

    const log = await AdminSystemLog.findOne({
      where: { id },
      attributes: [
        "id",
        ["action","action"],
        ["target_entity","targetEntity"],
        ["target_id","targetId"],
        ["ip","ip"],
        ["user_agent","userAgent"],
        ["correlation_id","correlationId"],
        ["metadata_json","metadataJson"],
        ["timestamp","createdAt"],
        ["created_at","dbCreatedAt"],
      ],
      include: [{
        model: AdminUser, as: "admin",
        attributes: [["email","actorEmail"], ["name","actorName"]],
        required: false,
      }],
    })
    if (!log) return res.status(404).json({ error: "Not found" })

    return res.json({
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
    })
  } catch (e) {
    console.error("adminGetAuditLogDetail error:", e)
    return res.status(500).json({ error: "Internal server error" })
  }
}
