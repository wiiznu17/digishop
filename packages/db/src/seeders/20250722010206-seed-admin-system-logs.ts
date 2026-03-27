import { QueryInterface, QueryTypes } from 'sequelize'

export default {
  async up(q: QueryInterface) {
    const admins: any[] = await q.sequelize.query(
      `SELECT id FROM ADMIN_USERS WHERE email='seed-admin@example.com'`,
      { type: QueryTypes.SELECT }
    )
    const adminId = admins[0]?.id
    if (!adminId) return

    await q.bulkInsert('ADMIN_SYSTEM_LOGS', [
      {
        admin_id: adminId,
        action: 'SYSTEM.SEED_INITIALIZED',
        target_entity: 'SYSTEM',
        target_id: null,
        correlation_id: 'seed-init-0001',
        ip: '127.0.0.1',
        user_agent: 'seeder/1.0',
        metadata_json: JSON.stringify({ note: 'initial seed completed' }),
        timestamp: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }
    ])
  },
  async down(q: QueryInterface) {
    await q.bulkDelete('ADMIN_SYSTEM_LOGS', {
      correlation_id: 'seed-init-0001'
    })
  }
}
