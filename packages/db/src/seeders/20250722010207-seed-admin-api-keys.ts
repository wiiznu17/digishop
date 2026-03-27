import { QueryInterface, QueryTypes } from 'sequelize'

export default {
  async up(q: QueryInterface) {
    // สร้าง API key ให้ super admin (key_hash เป็น hash ของค่า key จริงในระบบคุณ)
    const admins: any[] = await q.sequelize.query(
      `SELECT id FROM ADMIN_USERS WHERE email='seed-admin@example.com'`,
      { type: QueryTypes.SELECT }
    )
    const adminId = admins[0]?.id
    if (!adminId) return

    await q.bulkInsert('ADMIN_API_KEYS', [
      {
        admin_id: adminId,
        name: 'Seed Admin Key',
        // ใช้ค่า hash placeholder; แทนด้วย hash จริงตอนสร้างคีย์
        key_hash: 'seed_admin_api_key_hash_placeholder',
        scopes_json: JSON.stringify(['REPORT.EXPORT']),
        last_used_at: null,
        expires_at: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ])
  },
  async down(q: QueryInterface) {
    await q.bulkDelete('ADMIN_API_KEYS', { name: 'Seed Admin Key' })
  }
}
