import { QueryInterface } from 'sequelize'
import { v4 as uuidv4 } from 'uuid'

export default {
  up: async (queryInterface: QueryInterface) => {
    const now = new Date()
    const toMinor = (baht: number) => baht * 100

    await queryInterface.bulkInsert('PRODUCTS', [
      {
        id: 1001,
        uuid: uuidv4(),
        store_id: 1,
        category_id: 1,
        name: 'Smartphone X',
        description: 'A powerful smartphone',
        status: 'ACTIVE',
        reqStatus: 'APPROVED',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        id: 1002,
        uuid: uuidv4(),
        store_id: 2,
        category_id: 2,
        name: 'Smartphone Y',
        description: 'Budget-friendly smartphone',
        status: 'ACTIVE',
        reqStatus: 'APPROVED',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        id: 1003,
        uuid: uuidv4(),
        store_id: 1,
        category_id: 1,
        name: 'Laptop Pro 15',
        description: 'High-performance laptop for professionals',
        status: 'ACTIVE',
        reqStatus: 'APPROVED',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        id: 1004,
        uuid: uuidv4(),
        store_id: 1,
        category_id: 3,
        name: 'Wireless Earbuds',
        description: 'Noise-canceling earbuds',
        status: 'ACTIVE',
        reqStatus: 'APPROVED',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      },
      {
        id: 1005,
        uuid: uuidv4(),
        store_id: 2,
        category_id: 4,
        name: 'Smartwatch Z',
        description: 'Fitness-focused smartwatch',
        status: 'ACTIVE',
        reqStatus: 'APPROVED',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null
      }
    ])
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete('PRODUCTS', {
      id: [1001, 1002, 1003, 1004, 1005]
    })
  }
}
