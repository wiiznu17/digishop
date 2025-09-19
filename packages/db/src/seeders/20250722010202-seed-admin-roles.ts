import { QueryInterface } from "sequelize";

export default {
  async up(q: QueryInterface) {
    await q.bulkInsert("ADMIN_ROLES", [
      { slug: "super_admin", name: "Super Admin", is_system: true, created_at: new Date(), updated_at: new Date() },
      { slug: "ops_manager", name: "Ops Manager", is_system: true, created_at: new Date(), updated_at: new Date() },
      { slug: "cs_admin", name: "Customer Support", is_system: true, created_at: new Date(), updated_at: new Date() },
      { slug: "merchant_manager", name: "Merchant Manager", is_system: true, created_at: new Date(), updated_at: new Date() },
      { slug: "marketing_admin", name: "Marketing Admin", is_system: true, created_at: new Date(), updated_at: new Date() },
      { slug: "auditor", name: "Auditor (Read-only)", is_system: true, created_at: new Date(), updated_at: new Date() },
      { slug: "api_bot", name: "API Bot/Developer", is_system: true, created_at: new Date(), updated_at: new Date() },
    ]);
  },
  async down(q: QueryInterface) {
    await q.bulkDelete("ADMIN_ROLES", {
      slug: ["super_admin", "ops_manager", "cs_admin", "merchant_manager", "marketing_admin", "auditor", "api_bot"],
    });
  },
};
