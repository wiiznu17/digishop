import { AdminSystemLog, AdminUser } from "@digishop/db";
import { Op, col, fn, WhereOptions } from "sequelize";

export class AuditLogRepository {
  async findAndCountAuditLogs(where: WhereOptions, include: any, orderBy: any, offset: number, limit: number, attributes: any) {
    return AdminSystemLog.findAndCountAll({
      where,
      include,
      attributes,
      order: orderBy,
      offset, limit,
      distinct: true, subQuery: false,
    });
  }

  async findActorsBySuggestion(like: string) {
    return AdminUser.findAll({
      include: [
        { model: AdminSystemLog, as: "logs",
          required: true,
          attributes: []
        }
      ],
      attributes: [["email", "email"], ["name", "name"], [fn("MIN", col("logs.id")), "anyLog"]],
      where: { [Op.or]: [{ email: { [Op.like]: like } }, { name: { [Op.like]: like } }] },
      group: ["AdminUser.id"],
      order: [[col("AdminUser.name"), "ASC"]],
      limit: 5,
      subQuery: false,
    });
  }

  async findResourcesBySuggestion(like: string) {
    return AdminSystemLog.findAll({
      attributes: [["target_entity", "resource"], [fn("COUNT", col("id")), "cnt"]],
      where: { targetEntity: { [Op.like]: like } },
      group: ["target_entity"],
      order: [[fn("COUNT", col("id")), "DESC"]],
      limit: 5,
    });
  }

  async findAuditLogById(id: number) {
    return AdminSystemLog.findOne({
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
    });
  }
}

export const auditLogRepository = new AuditLogRepository();
