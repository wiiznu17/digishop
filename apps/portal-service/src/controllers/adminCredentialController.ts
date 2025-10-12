import { Request, Response } from "express";
import { Op } from "sequelize";
import bcrypt from "bcrypt";
import { AdminUser } from "@digishop/db/src/models/portal/AdminUser";
import { AdminUserRole } from "@digishop/db/src/models/portal/AdminUserRole";
import { AdminRole } from "@digishop/db/src/models/portal/AdminRole";
import { AdminInvite } from "@digishop/db/src/models/portal/AdminInvite";
import { AdminPasswordReset } from "@digishop/db/src/models/portal/AdminPasswordReset";
import { addHours, genTokenRaw, sha256b64 } from "../lib/tokens";
import { sendAdminInvite, sendAdminReset } from "../helpers/mailer";

const INVITE_TTL_HOURS = 48;
const RESET_TTL_HOURS = 2;
const ROUNDS = process.env.NODE_ENV === "production" ? 12 : 10;
const REINVITE_COOLDOWN_MIN = 10;

export async function adminSendInviteById(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

    // ต้องมีตัวตนผู้เชิญ (จาก auth middleware)
    const inviterId = (req as any)?.adminId;
    if (!inviterId) return res.status(403).json({ error: "Forbidden" });

    const admin = await AdminUser.findByPk(id);
    if (!admin) return res.status(404).json({ error: "Admin not found" });

    const email = String(admin.get("email") || "");
    const status = String(admin.get("status") || "");
    const hasPassword = Boolean(admin.get("password"));

    if (hasPassword || status === "ACTIVE") {
      return res.status(400).json({ error: "ALREADY_ACCEPTED" });
    }
    const cooldownSince = new Date(Date.now() - REINVITE_COOLDOWN_MIN * 60 * 1000);
    const recentUnaccepted = await AdminInvite.findOne({
      where: {
        email,
        acceptedAt: { [Op.is]: null },
        deletedAt: { [Op.is]: null },
        createdAt: { [Op.gte]: cooldownSince }
      }
    });
    if (recentUnaccepted) {
      return res.status(429).json({ error: "TOO_FREQUENT", message: `Please wait ${REINVITE_COOLDOWN_MIN} minutes before re-invite.` });
    }

    // เคลียร์ invite ค้างที่ยังไม่ accept อื่น ๆ (ถ้ามี)
    await AdminInvite.update(
      { deletedAt: new Date() },
      { where: { email, acceptedAt: null, deletedAt: { [Op.is]: null } }, paranoid: false }
    );

    // เตรียบ default role จากบทบาทแรก (ถ้าต้องการฝัง)
    const userRoles = await AdminUserRole.findAll({ where: { adminId: id } });
    let roleSlugDefault: string | null = null;
    if (userRoles.length > 0) {
      const role = await AdminRole.findByPk(userRoles[0].get("roleId") as number);
      roleSlugDefault = role ? (role.get("slug") as string) : null;
    }

    // สร้าง token
    const raw = genTokenRaw();
    const tokenHash = sha256b64(raw);
    const expiresAt = addHours(INVITE_TTL_HOURS);

    await AdminInvite.create({
      email,
      invitedByAdminId: inviterId,
      tokenHash,
      roleSlugDefault,
      expiresAt
    } as any);

    await sendAdminInvite(email, String(admin.get("name") ?? ""), raw);
    return res.json({ ok: true });
  } catch (e) {
    console.error("[adminSendInviteById] error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function adminResetPasswordById(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

    const admin = await AdminUser.findByPk(id);
    if (!admin) return res.status(404).json({ error: "Admin not found" });

    const hasPassword = Boolean(admin.get("password"));
    // ❗ เงื่อนไขหลัก: รีเซ็ตได้เฉพาะคนที่เคย accept แล้ว (มี password แล้ว)
    if (!hasPassword) {
      return res.status(400).json({ error: "NOT_ACCEPTED_YET" });
    }

    // ลบ reset ค้าง
    await AdminPasswordReset.update(
      { deletedAt: new Date() },
      { where: { adminId: id, usedAt: null, deletedAt: { [Op.is]: null } }, paranoid: false }
    );

    const raw = genTokenRaw();
    const tokenHash = sha256b64(raw);
    const expiresAt = addHours(RESET_TTL_HOURS);

    await AdminPasswordReset.create({
      adminId: id,
      tokenHash,
      expiresAt
    } as any);

    await sendAdminReset(String(admin.get("email")), String(admin.get("name") ?? ""), raw);
    return res.json({ ok: true });
  } catch (e) {
    console.error("[adminResetPasswordById] error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function adminAcceptInvite(req: Request, res: Response) {
  try {
    const { token, name, password } = (req.body || {}) as { token?: string; name?: string; password?: string };
    if (!token || !password) return res.status(400).json({ error: "Missing token/password" });

    const tokenHash = sha256b64(token);
    const invite = await AdminInvite.findOne({ where: { tokenHash } });
    if (!invite) return res.status(400).json({ error: "INVALID_TOKEN" });

    const now = new Date();
    const expiresAt = invite.get("expiresAt") as Date;
    const acceptedAt = invite.get("acceptedAt") as Date | null;
    if (acceptedAt) return res.status(400).json({ error: "TOKEN_USED" });
    if (expiresAt.getTime() < now.getTime()) return res.status(400).json({ error: "TOKEN_EXPIRED" });

    const email = String(invite.get("email"));
    const passwordHash = await bcrypt.hash(password, ROUNDS);

    let admin = await AdminUser.findOne({ where: { email }, paranoid: false });
    if (!admin) {
      admin = await AdminUser.create({
        email,
        name: name ?? email.split("@")[0],
        password: passwordHash,
        status: "ACTIVE",
        lastLoginAt: null
      } as any);
    } else {
      await admin.update({ password: passwordHash, status: "ACTIVE" } as any);
    }

    // ผูก role ตาม invite ถ้ามี
    const roleSlugDefault = invite.get("roleSlugDefault") as string | null;
    if (roleSlugDefault) {
      const role = await AdminRole.findOne({ where: { slug: roleSlugDefault } });
      if (role) {
        await AdminUserRole.findOrCreate({
          where: { adminId: admin.get("id"), roleId: role.get("id") },
          defaults: { adminId: admin.get("id"), roleId: role.get("id") }
        });
      }
    }

    await invite.update({ acceptedAt: now });
    return res.json({ ok: true });
  } catch (e) {
    console.error("[adminAcceptInvite] error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function adminPerformReset(req: Request, res: Response) {
  try {
    const { token, password } = (req.body || {}) as { token?: string; password?: string };
    if (!token || !password) return res.status(400).json({ error: "Missing token/password" });

    const tokenHash = sha256b64(token);
    const rec = await AdminPasswordReset.findOne({ where: { tokenHash } });
    if (!rec) return res.status(400).json({ error: "INVALID_TOKEN" });

    const now = new Date();
    const expiresAt = rec.get("expiresAt") as Date;
    const usedAt = rec.get("usedAt") as Date | null;
    if (usedAt) return res.status(400).json({ error: "TOKEN_USED" });
    if (expiresAt.getTime() < now.getTime()) return res.status(400).json({ error: "TOKEN_EXPIRED" });

    const adminId = rec.get("adminId") as number;
    const admin = await AdminUser.findByPk(adminId);
    if (!admin) return res.status(404).json({ error: "Admin not found" });

    const passwordHash = await bcrypt.hash(password, ROUNDS);
    await admin.update({ password: passwordHash } as any);
    await rec.update({ usedAt: now });

    return res.json({ ok: true });
  } catch (e) {
    console.error("[adminPerformReset] error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}
