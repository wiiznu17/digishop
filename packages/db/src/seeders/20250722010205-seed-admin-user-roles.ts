import { QueryInterface, QueryTypes } from "sequelize";

export default {
  async up(q: QueryInterface) {
    const admins: any[] = await q.sequelize.query(
      `SELECT id,email FROM ADMIN_USERS WHERE email IN ('seed-admin@example.com','ops@example.com','cs@example.com')`,
      { type: QueryTypes.SELECT }
    );
    const roles: any[] = await q.sequelize.query(`SELECT id,slug FROM ADMIN_ROLES`, { type: QueryTypes.SELECT });
    const roleIdBySlug = Object.fromEntries(roles.map(r => [r.slug, r.id]));
    const emailToRoles: Record<string, string[]> = {
      "seed-admin@example.com": ["super_admin"],
      "ops@example.com": ["ops_manager"],
      "cs@example.com": ["cs_admin"],
    };
    const rows: any[] = [];
    for (const a of admins) {
      const slugs = emailToRoles[a.email] || [];
      for (const s of slugs) {
        rows.push({ admin_id: a.id, role_id: roleIdBySlug[s], created_at: new Date(), updated_at: new Date() });
      }
    }
    if (rows.length) await q.bulkInsert("ADMIN_USER_ROLES", rows);
  },
  async down(q: QueryInterface) {
    await q.bulkDelete("ADMIN_USER_ROLES", {});
  },
};
