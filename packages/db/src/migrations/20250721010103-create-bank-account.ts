import { QueryInterface, DataTypes } from 'sequelize'
import { BankAccountStatus } from '../types/enum'

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable(
      'BANK_ACCOUNTS',
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },
        bank_name: {
          type: DataTypes.STRING(191),
          allowNull: false
        },
        store_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: {
            model: 'STORES',
            key: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        is_default: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        account_number: {
          type: DataTypes.STRING(50),
          allowNull: false
        },
        account_holder_name: {
          type: DataTypes.STRING(191),
          allowNull: false
        },
        status: {
          type: DataTypes.ENUM(...Object.values(BankAccountStatus)),
          allowNull: false,
          defaultValue: BankAccountStatus.PENDING
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
        }
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
      }
    )

    await queryInterface.addIndex('BANK_ACCOUNTS', ['bank_name'])
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('BANK_ACCOUNTS')
  }
}
