import { QueryInterface, DataTypes } from 'sequelize'

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable(
      'ADDRESSES',
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        user_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'USERS', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        recipient_name: {
          type: DataTypes.STRING(191),
          allowNull: false
        },
        phone: {
          type: DataTypes.STRING(10),
          allowNull: false
        },
        address_number: {
          type: DataTypes.STRING(255),
          allowNull: false
        },
        building: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        street: {
          type: DataTypes.STRING(255),
          allowNull: false
        },
        sub_street: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        district: {
          type: DataTypes.STRING(191),
          allowNull: false
        },
        sub_district: {
          type: DataTypes.STRING(191),
          allowNull: true
        },
        province: {
          type: DataTypes.STRING(191),
          allowNull: false
        },
        postal_code: {
          type: DataTypes.STRING(5),
          allowNull: false
        },
        country: {
          type: DataTypes.STRING(255),
          allowNull: false,
          defaultValue: 'Thailand'
        },
        is_default: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        address_type: {
          type: DataTypes.STRING(50),
          allowNull: false
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
        deleted_at: {
          type: DataTypes.DATE,
          allowNull: true
        }
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
      }
    )
    await queryInterface.addIndex('ADDRESSES', ['user_id'])
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('ADDRESSES')
  }
}
