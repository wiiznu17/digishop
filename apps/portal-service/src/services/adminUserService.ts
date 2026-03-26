import { Op, col, WhereOptions } from "sequelize";
import { AdminRole } from "@digishop/db";
import { AppError, BadRequestError, ConflictError, NotFoundError } from "../errors/AppError";
import { adminUserRepository } from "../repositories/adminUserRepository";

const asInt = (v: any, d: number) => {
  const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.floor(n) : d;
};
const likeify = (q: string) => `%${q.replace(/[%_]/g, "\\$&")}%`;
const REINVITE_COOLDOWN_MIN = 10;

export class AdminUserService {
  async listAdmins(params: Record<string, string | undefined>) {
    const { q = "", role, status, sortBy = "createdAt", sortDir = "desc" } = params;

    const page = Math.max(asInt(params.page, 1), 1);
    const pageSize = Math.min(Math.max(asInt(params.pageSize, 20), 1), 100);
    const offset = (page - 1) * pageSize;

    const where: WhereOptions = {};
    if (status && status.trim()) (where as any)["status"] = status;

    if (q && q.trim()) {
      const t = likeify(q.trim());
      Object.assign(where, { [Op.or]: [{ email: { [Op.like]: t } }, { name: { [Op.like]: t } }] });
    }

    const rolesInclude: any = {
      model: AdminRole,
      as: "roles",
      attributes: [["slug", "slug"]],
      through: { attributes: [] },
      required: !!role,
      where: role ? { slug: role } : undefined
    };

    const dir = String(sortDir).toUpperCase() === "ASC" ? "ASC" : "DESC";
    const orderBy: any[] = [];
    if (sortBy === "name") orderBy.push([col("AdminUser.name"), dir]);
    else if (sortBy === "email") orderBy.push([col("AdminUser.email"), dir]);
    else if (sortBy === "lastLoginAt") orderBy.push([col("AdminUser.last_login_at"), dir]);
    else orderBy.push([col("AdminUser.created_at"), dir]);

    const { rows, count } = await adminUserRepository.findAndCountAdmins(
      where, rolesInclude, orderBy, offset, pageSize
    );

    const data = rows.map((u: any) => {
      const roleSlugs: string[] = (u.roles ?? []).map((r: any) => r.get("slug"));
      const primaryRole = roleSlugs.includes("SUPER_ADMIN") ? "SUPER_ADMIN" : (roleSlugs[0] ?? "VIEWER");
      return {
        id: u.get("id"),
        email: u.get("email"),
        name: u.get("name"),
        status: u.get("status"),
        lastLoginAt: u.get("lastLoginAt"),
        roles: roleSlugs,
        primaryRole
      };
    });

    const total = Array.isArray(count) ? count.length : (count as number);
    return { data, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
  }

  async suggestAdmins(q: string) {
    const trimmed = String(q || "").trim();
    if (!trimmed) return [];
    const t = likeify(trimmed);
    return adminUserRepository.suggestAdmins(t);
  }

  async getAdminDetail(id: number) {
    if (!Number.isFinite(id)) throw new BadRequestError("Invalid id");

    const u: any = await adminUserRepository.findAdminDetail(id);
    if (!u) throw new NotFoundError("Not found");

    const activeRoles = (u.roles ?? []).filter((r: any) => {
      const junction = (r as any).AdminUserRole;
      return !junction?.endAt;
    });

    const roleObjs = activeRoles.map((r: any) => ({
      id: r.get("id"),
      slug: r.get("slug"),
      name: r.get("name"),
      description: r.get("description"),
      isSystem: !!r.get("isSystem")
    }));

    const permMap = new Map<string, any>();
    for (const r of activeRoles) {
      for (const p of (r.permissions ?? [])) {
        const slug = p.get("slug") as string;
        if (!permMap.has(slug)) {
          permMap.set(slug, {
            id: p.get("id"),
            slug,
            resource: p.get("resource"),
            action: p.get("action"),
            effect: p.get("effect")
          });
        }
      }
    }

    const sessions = (u.sessions ?? [])
      .map((s: any) => ({
        id: s.get("id"),
        jti: s.get("jti"),
        ip: s.get("ip"),
        userAgent: s.get("userAgent"),
        expiresAt: s.get("expiresAt"),
        revokedAt: s.get("revokedAt"),
        createdAt: s.get("createdAt")
      }))
      .sort((a: any, b: any) =>
        new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime()
      );

    const roleHistoryRows = await adminUserRepository.findRoleHistory(u.get("id") as number);

    const roleHistory = roleHistoryRows.map((r: any) => {
      const startAt = r.get("startAt") as Date | null;
      const endAt = r.get("endAt") as Date | null;
      const deletedAt = r.get("deletedAt") as Date | null;
      const isActive = !endAt && !deletedAt;
      const role = r.get("role") as any;
      return {
        id: r.get("id"),
        roleId: role?.get("id") ?? null,
        roleSlug: role?.get("slug") ?? null,
        roleName: role?.get("name") ?? null,
        startAt: startAt ? startAt.toISOString() : null,
        endAt: endAt ? endAt.toISOString() : null,
        createdAt: (r.get("createdAt") as Date).toISOString(),
        updatedAt: (r.get("updatedAt") as Date).toISOString(),
        deletedAt: deletedAt ? deletedAt.toISOString() : null,
        status: isActive ? "ACTIVE" : "INACTIVE"
      };
    });

    const hasPassword = Boolean(u.get("password"));
    const status = String(u.get("status"));
    const canResetPassword = hasPassword === true;
    const canReinviteBase = !hasPassword && status !== "ACTIVE";

    let canReinvite = canReinviteBase;
    let reinviteCooldownSeconds: number | undefined;
    let lastInviteAt: string | undefined;
    let reinviteAvailableAt: string | undefined;

    if (canReinviteBase) {
      const email = String(u.get("email"));
      const recentInvite: any = await adminUserRepository.findRecentInvite(email);

      if (recentInvite) {
        const createdAt = recentInvite.get("createdAt") as Date;
        lastInviteAt = createdAt.toISOString();

        const available = new Date(createdAt.getTime() + REINVITE_COOLDOWN_MIN * 60 * 1000);
        reinviteAvailableAt = available.toISOString();

        const now = Date.now();
        if (now < available.getTime()) {
          canReinvite = false;
          reinviteCooldownSeconds = Math.ceil((available.getTime() - now) / 1000);
        }
      }
    }

    return {
      id: u.get("id"),
      email: u.get("email"),
      name: u.get("name"),
      status,
      lastLoginAt: u.get("lastLoginAt"),
      createdAt: u.get("createdAt"),
      updatedAt: u.get("updatedAt"),
      roles: roleObjs,
      permissions: Array.from(permMap.values()),
      sessions,
      canReinvite,
      canResetPassword,
      reinviteCooldownSeconds,
      lastInviteAt,
      reinviteAvailableAt,
      roleHistory
    };
  }

  async createAdmin(payload: { email?: string; name?: string; roleSlug?: string }) {
    const { email, name, roleSlug } = payload;
    if (!email || !name || !roleSlug) {
      throw new BadRequestError("Missing fields (email, name, roleSlug)");
    }

    const existed = await adminUserRepository.countAdminByEmail(email);
    if (existed > 0) throw new ConflictError("Email already exists");
    
    const created: any = await adminUserRepository.createAdmin({
      email, name, status: "SUSPENDED", password: null, lastLoginAt: null
    });

    const role: any = await adminUserRepository.findRoleBySlug(roleSlug);
    if (!role) throw new BadRequestError("Invalid roleSlug");
    await adminUserRepository.createUserRole(created.get("id") as number, role.get("id") as number);

    return { id: created.get("id") };
  }
}

export const adminUserService = new AdminUserService();
