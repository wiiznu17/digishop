import { QueryInterface, QueryTypes } from "sequelize";

export default {
  async up(q: QueryInterface) {
    const roles = await q.sequelize.query(`SELECT id, slug FROM ADMIN_ROLES`, { type: QueryTypes.SELECT });
    const perms = await q.sequelize.query(`SELECT id, slug FROM ADMIN_PERMISSIONS`, { type: QueryTypes.SELECT });

    const roleIdBySlug = Object.fromEntries((roles as any[]).map(r => [r.slug, r.id]));
    const permIdBySlug = Object.fromEntries((perms as any[]).map(p => [p.slug, p.id]));
    const all = (perms as any[]).map(p => p.slug) as string[];

    const ops = [
      "ORDER.READ","ORDER.UPDATE","REFUND.CREATE","REFUND.APPROVE",
      "PAYMENT.READ","PAYMENT.VOID","PAYOUT.READ","PAYOUT.APPROVE",
      "ANALYTICS.VIEW","DASHBOARD.VIEW"
    ];
    const cs = ["ORDER.READ","REFUND.CREATE","CUSTOMER.READ","CUSTOMER.UPDATE","DASHBOARD.VIEW"];
    const mm = ["MERCHANT.READ","MERCHANT.APPROVE","MERCHANT.SUSPEND","PRODUCT.APPROVE","CATEGORY.MANAGE","DASHBOARD.VIEW"];
    const mkt = ["PRODUCT.READ","PRODUCT.UPDATE","PRODUCT.CREATE","PRODUCT.DELETE","CATEGORY.MANAGE","ANALYTICS.VIEW","DASHBOARD.VIEW"];
    const auditor = all.filter(s => s.endsWith(".READ") || s === "REPORT.EXPORT" || s === "ANALYTICS.VIEW" || s === "DASHBOARD.VIEW");
    const apiBot = ["REPORT.EXPORT"];

    function grant(roleSlug: string, slugs: string[]) {
      return slugs.map(s => ({
        role_id: roleIdBySlug[roleSlug],
        permission_id: permIdBySlug[s],
        created_at: new Date(),
        updated_at: new Date(),
      })).filter(r => r.role_id && r.permission_id);
    }

    const rows = [
      ...grant("super_admin", all),
      ...grant("ops_manager", ops),
      ...grant("cs_admin", cs),
      ...grant("merchant_manager", mm),
      ...grant("marketing_admin", mkt),
      ...grant("auditor", auditor),
      ...grant("api_bot", apiBot),
    ];

    if (rows.length) await q.bulkInsert("ADMIN_ROLE_PERMISSIONS", rows);
  },
  async down(q: QueryInterface) {
    await q.bulkDelete("ADMIN_ROLE_PERMISSIONS", {});
  },
};
