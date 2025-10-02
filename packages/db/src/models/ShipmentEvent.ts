import { Model, DataTypes, Optional, Sequelize } from 'sequelize'
import { ShippingStatus } from '../types/enum'

export interface ShipmentEventAttributes {
  id: number
  shippingInfoId: number

  // diff ของสถานะ
  fromStatus?: ShippingStatus | null
  toStatus: ShippingStatus

  description?: string | null
  location?: string | null
  rawPayload?: object | null
  occurredAt: Date

  createdAt?: Date
  updatedAt?: Date
}

export type ShipmentEventCreationAttributes = Optional<
  ShipmentEventAttributes,
  | 'id'
  | 'fromStatus'
  | 'description'
  | 'location'
  | 'rawPayload'
  | 'createdAt'
  | 'updatedAt'
>

export class ShipmentEvent
  extends Model<ShipmentEventAttributes, ShipmentEventCreationAttributes>
  implements ShipmentEventAttributes
{
  public id!: number
  public shippingInfoId!: number

  public fromStatus!: ShippingStatus | null
  public toStatus!: ShippingStatus

  public description!: string | null
  public location!: string | null
  public rawPayload!: object | null
  public occurredAt!: Date

  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  static initModel(sequelize: Sequelize): typeof ShipmentEvent {
    ShipmentEvent.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        shippingInfoId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'shipping_info_id',
          references: { model: 'SHIPPING_INFO', key: 'id' }
        },

        // ใช้ enum เดียวกับ SHIPPING_INFO
        fromStatus: {
          type: DataTypes.ENUM(...Object.values(ShippingStatus)),
          allowNull: true,
          field: 'from_status'
        },
        toStatus: {
          type: DataTypes.ENUM(...Object.values(ShippingStatus)),
          allowNull: false,
          field: 'to_status'
        },

        description: {
          type: DataTypes.STRING(255),
          allowNull: true
        },
        location: {
          type: DataTypes.STRING(150),
          allowNull: true
        },
        rawPayload: {
          type: DataTypes.JSON,
          allowNull: true,
          defaultValue: null,
          field: 'raw_payload'
        },
        occurredAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'occurred_at'
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
        timestamps: true,
        underscored: true,
        tableName: 'SHIPPING_EVENTS',
        modelName: 'ShipmentEvent',
        paranoid: false,
        indexes: [
          { fields: ['shipping_info_id'] },
          { fields: ['to_status'] },
          { fields: ['occurred_at'] },
          { fields: ['created_at'] }
        ]
      }
    )
    return ShipmentEvent
  }
}
