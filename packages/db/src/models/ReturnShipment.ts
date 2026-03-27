import { Model, DataTypes, Optional, Sequelize } from 'sequelize'
import { ReturnShipmentStatus } from '../types/enum'

export interface ReturnShipmentAttributes {
  id: number
  orderId: number
  refundOrderId?: number | null
  carrier?: string | null
  trackingNumber?: string | null
  status: ReturnShipmentStatus
  shippedAt?: Date | null
  deliveredBackAt?: Date | null
  deadlineDropoffAt: Date

  fromAddressSnapshot?: object | null
  toAddressSnapshot?: object | null
  metadata?: object | null

  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export interface ReturnShipmentCreationAttributes
  extends Optional<
    ReturnShipmentAttributes,
    | 'id'
    | 'refundOrderId'
    | 'carrier'
    | 'trackingNumber'
    | 'status'
    | 'deadlineDropoffAt'
    | 'shippedAt'
    | 'deliveredBackAt'
    | 'fromAddressSnapshot'
    | 'toAddressSnapshot'
    | 'metadata'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
  > {}

export class ReturnShipment
  extends Model<ReturnShipmentAttributes, ReturnShipmentCreationAttributes>
  implements ReturnShipmentAttributes
{
  public id!: number
  public orderId!: number
  public refundOrderId!: number | null
  public carrier!: string | null
  public trackingNumber!: string | null
  public status!: ReturnShipmentStatus
  public shippedAt!: Date | null
  public deliveredBackAt!: Date | null
  public deadlineDropoffAt!: Date

  public fromAddressSnapshot!: object | null
  public toAddressSnapshot!: object | null
  public metadata!: object | null

  public readonly createdAt!: Date
  public readonly updatedAt!: Date
  public readonly deletedAt!: Date | null

  static initModel(sequelize: Sequelize): typeof ReturnShipment {
    ReturnShipment.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        orderId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'order_id',
          references: { model: 'ORDERS', key: 'id' }
        },
        refundOrderId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          field: 'refund_order_id',
          references: { model: 'REFUND_ORDERS', key: 'id' }
        },
        carrier: {
          type: DataTypes.STRING(100),
          allowNull: true
        },
        trackingNumber: {
          type: DataTypes.STRING(100),
          allowNull: true,
          field: 'tracking_number'
        },
        status: {
          type: DataTypes.ENUM(...Object.values(ReturnShipmentStatus)),
          allowNull: false,
          defaultValue: ReturnShipmentStatus.AWAITING_DROP
        },
        deadlineDropoffAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'deadline_dropoff_at'
        },
        shippedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'shipped_at'
        },
        deliveredBackAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'delivered_back_at'
        },
        fromAddressSnapshot: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: null,
          field: 'from_address_snapshot'
        },
        toAddressSnapshot: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: null,
          field: 'to_address_snapshot'
        },
        metadata: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: null
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
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'deleted_at'
        }
      },
      {
        sequelize,
        timestamps: true,
        underscored: true,
        tableName: 'RETURN_SHIPMENTS',
        modelName: 'ReturnShipment',
        paranoid: true,
        deletedAt: 'deleted_at',
        indexes: [
          { fields: ['order_id'] },
          { fields: ['refund_order_id'] },
          { fields: ['tracking_number'] },
          { fields: ['status'] },
          { fields: ['created_at'] }
        ]
      }
    )
    return ReturnShipment
  }
}
