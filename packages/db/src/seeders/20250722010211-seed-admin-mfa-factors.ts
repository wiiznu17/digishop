import { QueryInterface, QueryTypes } from "sequelize";

export default {
  async up(q: QueryInterface) {
    const admins: any[] = await q.sequelize.query(
      `SELECT id FROM ADMIN_USERS WHERE email='seed-admin@example.com'`,
      { type: QueryTypes.SELECT }
    );
    const adminId = admins[0]?.id;
    if (!adminId) return;

    await q.bulkInsert("ADMIN_MFA_FACTORS", [
      {
        admin_id: adminId,
        type: "TOTP",
        secret_or_public: "ENCRYPTED_TOTP_SECRET_PLACEHOLDER",
        label: "Seed Admin TOTP",
        status: "ACTIVE",
        added_at: new Date(),
        last_used_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },
  async down(q: QueryInterface) {
    await q.bulkDelete("ADMIN_MFA_FACTORS", { label: "Seed Admin TOTP" });
  },
};
