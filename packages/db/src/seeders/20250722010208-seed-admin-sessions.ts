import { QueryInterface, QueryTypes } from 'sequelize'

export default {
  async up(q: QueryInterface) {
    const admins: any[] = await q.sequelize.query(
      `SELECT id FROM ADMIN_USERS WHERE email='seed-admin@example.com'`,
      { type: QueryTypes.SELECT }
    )
    const adminId = admins[0]?.id
    if (!adminId) return

    await q.bulkInsert('ADMIN_SESSIONS', [
      {
        admin_id: adminId,
        jti: 'seed-session-jti-0001',
        refresh_token_hash: null,
        ip: '127.0.0.1',
        user_agent: 'seeder/1.0',
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24),
        revoked_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      }
    ])
  },
  async down(q: QueryInterface) {
    await q.bulkDelete('ADMIN_SESSIONS', { jti: 'seed-session-jti-0001' })
  }
}
