import { QueryInterface } from 'sequelize'
import { v4 as uuidv4 } from 'uuid'

export default {
  async up(q: QueryInterface): Promise<void> {
    const now = new Date()
    await q.bulkInsert('VARIATIONS', [
      // Smartphone X (1001)
      {
        uuid: uuidv4(),
        product_id: 1001,
        name: 'Color',
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        uuid: uuidv4(),
        product_id: 1001,
        name: 'Storage',
        created_at: now,
        updated_at: now,
        deleted_at: null
      },

      // Smartphone Y (1002)
      {
        uuid: uuidv4(),
        product_id: 1002,
        name: 'Color',
        created_at: now,
        updated_at: now,
        deleted_at: null
      },

      // Laptop Pro 15 (1003)
      {
        uuid: uuidv4(),
        product_id: 1003,
        name: 'RAM',
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        uuid: uuidv4(),
        product_id: 1003,
        name: 'Storage',
        created_at: now,
        updated_at: now,
        deleted_at: null
      },

      // Wireless Earbuds (1004)
      {
        uuid: uuidv4(),
        product_id: 1004,
        name: 'Color',
        created_at: now,
        updated_at: now,
        deleted_at: null
      },

      // Smartwatch Z (1005)
      {
        uuid: uuidv4(),
        product_id: 1005,
        name: 'Band Size',
        created_at: now,
        updated_at: now,
        deleted_at: null
      }
    ])
  },

  async down(q: QueryInterface): Promise<void> {
    await q.bulkDelete(
      'VARIATIONS',
      { product_id: [1001, 1002, 1003, 1004, 1005] },
      {}
    )
  }
}
