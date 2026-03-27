import { QueryInterface } from 'sequelize'
import { v4 as uuidv4 } from 'uuid'

export default {
  up: async (queryInterface: QueryInterface) => {
    const now = new Date()
    await queryInterface.bulkInsert('CATEGORIES', [
      {
        uuid: uuidv4(),
        name: 'Electronics',
        parent_id: null,
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        uuid: uuidv4(),
        name: 'Fashion',
        parent_id: null,
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        uuid: uuidv4(),
        name: 'Home Appliances',
        parent_id: null,
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        uuid: uuidv4(),
        name: 'Books',
        parent_id: null,
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        uuid: uuidv4(),
        name: 'Beauty & Personal Care',
        parent_id: null,
        created_at: now,
        updated_at: now,
        deleted_at: null
      },
      {
        uuid: uuidv4(),
        name: 'Sports & Outdoors',
        parent_id: null,
        created_at: now,
        updated_at: now,
        deleted_at: null
      }
    ])
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete('CATEGORIES', {}, {})
  }
}
