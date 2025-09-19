import { QueryInterface } from "sequelize";

export default {
  async up(q: QueryInterface) {
    await q.bulkInsert("ADMIN_USERS", [
      {
        email: "seed-admin@example.com",
        name: "Seed Super Admin",
        // bcrypt hash for "ChangeMe123!"
        password: "$2a$10$4QHirm8k7T0gq2uJx7eJ2eN6k2sQb0bq7zXo9r7rY3G1QqJvF6j2e",
        status: "ACTIVE",
        last_login_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        email: "ops@example.com",
        name: "Ops Manager",
        password: "$2a$10$4QHirm8k7T0gq2uJx7eJ2eN6k2sQb0bq7zXo9r7rY3G1QqJvF6j2e",
        status: "ACTIVE",
        last_login_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        email: "cs@example.com",
        name: "Customer Support",
        password: "$2a$10$4QHirm8k7T0gq2uJx7eJ2eN6k2sQb0bq7zXo9r7rY3G1QqJvF6j2e",
        status: "ACTIVE",
        last_login_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },
  async down(q: QueryInterface) {
    await q.bulkDelete("ADMIN_USERS", {
      email: ["seed-admin@example.com", "ops@example.com", "cs@example.com"],
    });
  },
};
