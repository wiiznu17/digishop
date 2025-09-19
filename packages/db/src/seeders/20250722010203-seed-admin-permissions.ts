import { QueryInterface } from "sequelize";

const perms: Array<[string, string]> = [
  // Platform Overview
  ["DASHBOARD", "VIEW"],
  ["ANALYTICS", "VIEW"],
  // Commerce
  ["ORDER", "READ"], ["ORDER", "UPDATE"],
  ["PAYMENT", "READ"], ["PAYMENT", "VOID"],
  ["REFUND", "CREATE"], ["REFUND", "APPROVE"],
  ["PAYOUT", "READ"], ["PAYOUT", "APPROVE"],
  // Catalog
  ["PRODUCT", "READ"], ["PRODUCT", "CREATE"], ["PRODUCT", "UPDATE"], ["PRODUCT", "DELETE"], ["PRODUCT", "APPROVE"],
  ["CATEGORY", "MANAGE"],
  // Users & Merchants
  ["CUSTOMER", "READ"], ["CUSTOMER", "UPDATE"],
  ["MERCHANT", "READ"], ["MERCHANT", "APPROVE"], ["MERCHANT", "SUSPEND"],
  // System
  ["ADMIN_USER", "MANAGE"], ["ROLE", "MANAGE"], ["AUDITLOG", "READ"],
  // Utility
  ["REPORT", "EXPORT"],
];

export default {
  async up(q: QueryInterface) {
    const rows = perms.map(([resource, action]) => ({
      resource,
      action,
      effect: "ALLOW",
      slug: `${resource}.${action}`,
      created_at: new Date(),
      updated_at: new Date(),
    }));
    await q.bulkInsert("ADMIN_PERMISSIONS", rows);
  },
  async down(q: QueryInterface) {
    await q.bulkDelete("ADMIN_PERMISSIONS", {});
  },
};
