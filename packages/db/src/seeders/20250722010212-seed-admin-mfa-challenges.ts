import { QueryInterface, QueryTypes } from "sequelize";

export default {
  async up(q: QueryInterface) {
    const admins: any[] = await q.sequelize.query(
      `SELECT id FROM ADMIN_USERS WHERE email='seed-admin@example.com'`,
      { type: QueryTypes.SELECT }
    );
    const adminId = admins[0]?.id;
    if (!adminId) return;

    await q.bulkInsert("ADMIN_MFA_CHALLENGES", [{
      admin_id: adminId,
      factor_type: "TOTP",
      challenge_id: "seed-mfa-challenge-0001",
      status: "PENDING",
      expires_at: new Date(Date.now() + 1000 * 60 * 5),
      resolved_at: null,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    }]);
  },
  async down(q: QueryInterface) {
    await q.bulkDelete("ADMIN_MFA_CHALLENGES", { challenge_id: "seed-mfa-challenge-0001" });
  },
};
