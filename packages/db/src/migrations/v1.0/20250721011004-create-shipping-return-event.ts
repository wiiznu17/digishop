import { QueryInterface, DataTypes, Sequelize } from 'sequelize'
import { ReturnShipmentStatus } from '../../types/enum'

export default {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.createTable(
      'RETURN_SHIPMENT_EVENTS',
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false
        },

        return_shipment_id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          references: { model: 'RETURN_SHIPMENTS', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },

        from_status: {
          type: DataTypes.ENUM(...Object.values(ReturnShipmentStatus)),
          allowNull: true
        },

        to_status: {
          type: DataTypes.ENUM(...Object.values(ReturnShipmentStatus)),
          allowNull: false
        },

        description: {
          type: DataTypes.STRING(255),
          allowNull: true
        },

        location: {
          type: DataTypes.STRING(150),
          allowNull: true
        },

        raw_payload: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: null
        },

        occurred_at: {
          type: DataTypes.DATE,
          allowNull: false
        },

        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },

        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal(
            'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
          )
        }
      },
      {
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
      }
    )

    await queryInterface.addIndex('RETURN_SHIPMENT_EVENTS', [
      'return_shipment_id'
    ])
    await queryInterface.addIndex('RETURN_SHIPMENT_EVENTS', ['to_status'])
    await queryInterface.addIndex('RETURN_SHIPMENT_EVENTS', ['occurred_at'])
    await queryInterface.addIndex('RETURN_SHIPMENT_EVENTS', ['created_at'])
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable('RETURN_SHIPMENT_EVENTS')
  }
}
