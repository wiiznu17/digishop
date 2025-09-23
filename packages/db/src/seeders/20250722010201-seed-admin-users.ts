import { QueryInterface } from "sequelize";
import bcrypt from "bcrypt";

const ROUNDS =
  Number.isFinite(Number(process.env.BCRYPT_ROUNDS))
    ? Number(process.env.BCRYPT_ROUNDS)
    : process.env.NODE_ENV === "production" ? 12 : 10;

const USERS = [
  {
    email: "seed-admin@example.com",
    name: "Seed Super Admin",
    envKey: "SEED_ADMIN_PASS",
    fallbackPass: "ChangeMe123!",
  },
  {
    email: "ops@example.com",
    name: "Ops Manager",
    envKey: "SEED_OPS_PASS",
    fallbackPass: "ChangeMe123!",
  },
  {
    email: "cs@example.com",
    name: "Customer Support",
    envKey: "SEED_CS_PASS",
    fallbackPass: "ChangeMe123!",
  },
];

export default {
  async up(q: QueryInterface) {
    // ถ้าไม่อยาก seed ใน production ให้เปิด guard นี้
    // if (process.env.NODE_ENV === "production") return;

    const now = new Date();

    // แฮช “ตอนนี้” ด้วย salt rounds ตาม env/โหมด
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
        };
      })
    );

    await q.bulkInsert("ADMIN_USERS", rows);
  },

  async down(q: QueryInterface) {
    await q.bulkDelete("ADMIN_USERS", {
      email: USERS.map((u) => u.email),
    });
  },
};
