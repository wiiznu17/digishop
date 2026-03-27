import { QueryInterface, QueryTypes } from 'sequelize'

export default {
  async up(q: QueryInterface) {
    const admins: any[] = await q.sequelize.query(
      `SELECT id FROM ADMIN_USERS WHERE email='seed-admin@example.com'`,
      { type: QueryTypes.SELECT }
    )
    const adminId = admins[0]?.id
    if (!adminId) return

    // สร้าง 5 โค้ดตัวอย่าง (เก็บเป็น hash เท่านั้น)
    const codes = Array.from({ length: 5 }).map((_, i) => ({
      admin_id: adminId,
      code_hash: `seed_recovery_code_hash_${i + 1}`,
      status: 'UNUSED',
      used_at: null,
      created_at: new Date(),
      updated_at: new Date()
    }))
    await q.bulkInsert('ADMIN_RECOVERY_CODES', codes)
  },
  async down(q: QueryInterface) {
    await q.bulkDelete('ADMIN_RECOVERY_CODES', {
      code_hash: [/^seed_recovery_code_hash_/] as any
    })
  }
}
