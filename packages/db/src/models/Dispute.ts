import { Model, DataTypes, Optional, Sequelize } from 'sequelize'
import { DisputeStatus } from '../types/enum'

export interface DisputeAttributes {
  id: number
  orderId: number
  customerId: number
  reason: string
  status: DisputeStatus
  createdAt?: Date
  updatedAt?: Date
}

export interface DisputeCreationAttributes
  extends Optional<
    DisputeAttributes,
    'id' | 'status' | 'createdAt' | 'updatedAt'
  > {}

export class Dispute
  extends Model<DisputeAttributes, DisputeCreationAttributes>
  implements DisputeAttributes
{
  public id!: number
  public orderId!: number
  public customerId!: number
  public reason!: string
  public status!: DisputeStatus
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  static initModel(sequelize: Sequelize): typeof Dispute {
    Dispute.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        orderId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'order_id'
        },
        customerId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'customer_id'
        },
        reason: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        status: {
          type: DataTypes.ENUM(...Object.values(DisputeStatus)),
          allowNull: false,
          defaultValue: DisputeStatus.OPEN
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'created_at',
          defaultValue: DataTypes.NOW
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'updated_at',
          defaultValue: DataTypes.NOW
        }
      },
      {
        sequelize,
        tableName: 'DISPUTES',
        modelName: 'Dispute',
        paranoid: true, // เปิด soft delete
        deletedAt: 'deleted_at' // ชื่อคอลัมน์ soft delete
      }
    )
    return Dispute
  }
}
