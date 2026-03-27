import { QueryInterface, QueryTypes } from 'sequelize'

export default {
  async up(q: QueryInterface) {
    const admins: any[] = await q.sequelize.query(
      `SELECT id FROM ADMIN_USERS WHERE email='seed-admin@example.com'`,
      { type: QueryTypes.SELECT }
    )
    const inviterId = admins[0]?.id
    if (!inviterId) return

    await q.bulkInsert('ADMIN_INVITES', [
      {
        email: 'new-admin@example.com',
        invited_by_admin_id: inviterId,
        token_hash: 'invite_token_hash_placeholder',
        role_slug_default: 'cs_admin',
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        accepted_at: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ])
  },
  async down(q: QueryInterface) {
    await q.bulkDelete('ADMIN_INVITES', { email: 'new-admin@example.com' })
  }
}
