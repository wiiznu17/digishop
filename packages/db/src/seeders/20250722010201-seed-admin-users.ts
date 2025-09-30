import type { QueryInterface } from "sequelize";
import bcrypt from "bcrypt";

const ROUNDS =
  Number.isFinite(Number(process.env.BCRYPT_ROUNDS))
    ? Number(process.env.BCRYPT_ROUNDS)
    : process.env.NODE_ENV === "production"
      ? 12
      : 10;

type SeedUser = {
  email: string;
  name: string;
  envKey: string;
  fallbackPass: string;
};

const USERS: SeedUser[] = [
  { email: "superadmin@example.com",   name: "Super Admin",         envKey: "SEED_SUPER_ADMIN_PASS",   fallbackPass: "ChangeMe123!" },
  { email: "platform@example.com",     name: "Platform Admin",      envKey: "SEED_PLATFORM_ADMIN_PASS",fallbackPass: "ChangeMe123!" },
  { email: "rbac@example.com",         name: "RBAC Admin",          envKey: "SEED_RBAC_ADMIN_PASS",    fallbackPass: "ChangeMe123!" },
  { email: "ops@example.com",          name: "Operations Manager",  envKey: "SEED_OPS_PASS",            fallbackPass: "ChangeMe123!" },
  { email: "catalog@example.com",      name: "Catalog Manager",     envKey: "SEED_CATALOG_PASS",        fallbackPass: "ChangeMe123!" },
  { email: "merchantops@example.com",  name: "Merchant Operations", envKey: "SEED_MERCHANT_OPS_PASS",   fallbackPass: "ChangeMe123!" },
  { email: "support@example.com",      name: "Support Agent",       envKey: "SEED_SUPPORT_PASS",        fallbackPass: "ChangeMe123!" },
  { email: "analyst@example.com",      name: "Analyst",             envKey: "SEED_ANALYST_PASS",        fallbackPass: "ChangeMe123!" },
  { email: "auditor@example.com",      name: "Read-only Auditor",   envKey: "SEED_AUDITOR_PASS",        fallbackPass: "ChangeMe123!" },
];

export default {
  async up(q: QueryInterface) {
    const now = new Date();

    const rows = await Promise.all(
      USERS.map(async (u) => {
        const plain = process.env[u.envKey] || u.fallbackPass;
        const hash = await bcrypt.hash(plain, ROUNDS);
        return {
          email: u.email,
          name: u.name,
          password: hash,
          status: "ACTIVE",
          last_login_at: null,
          created_at: now,
          updated_at: now,
          deleted_at: null,
        };
      })
    );

    await q.bulkInsert("ADMIN_USERS", rows, {});
  },

  async down(q: QueryInterface) {
    await q.bulkDelete(
      "ADMIN_USERS",
      { email: USERS.map((u) => u.email) },
      {}
    );
  },
};
