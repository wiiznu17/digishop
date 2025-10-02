import { Model, DataTypes, Optional, Sequelize } from 'sequelize'
import { ReturnShipmentStatus } from '../types/enum'

export interface ReturnShipmentEventAttributes {
  id: number
  returnShipmentId: number

  fromStatus?: ReturnShipmentStatus | null
  toStatus: ReturnShipmentStatus

  description?: string | null
  location?: string | null
  rawPayload?: object | null
  occurredAt: Date

  createdAt?: Date
  updatedAt?: Date
}

export type ReturnShipmentEventCreationAttributes = Optional<
  ReturnShipmentEventAttributes,
  | 'id'
  | 'fromStatus'
  | 'description'
  | 'location'
  | 'rawPayload'
  | 'createdAt'
  | 'updatedAt'
>

export class ReturnShipmentEvent
  extends Model<ReturnShipmentEventAttributes, ReturnShipmentEventCreationAttributes>
  implements ReturnShipmentEventAttributes
{
  public id!: number
  public returnShipmentId!: number

  public fromStatus!: ReturnShipmentStatus | null
  public toStatus!: ReturnShipmentStatus

  public description!: string | null
  public location!: string | null
  public rawPayload!: object | null
  public occurredAt!: Date

  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  static initModel(sequelize: Sequelize): typeof ReturnShipmentEvent {
    ReturnShipmentEvent.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        returnShipmentId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'return_shipment_id',
          references: { model: 'RETURN_SHIPMENTS', key: 'id' }
        },
        fromStatus: {
          type: DataTypes.ENUM(...Object.values(ReturnShipmentStatus)),
          allowNull: true,
          field: 'from_status'
        },
        toStatus: {
          type: DataTypes.ENUM(...Object.values(ReturnShipmentStatus)),
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
        tableName: 'RETURN_SHIPMENT_EVENTS',
        modelName: 'ReturnShipmentEvent',
        paranoid: false,
        indexes: [
          { fields: ['return_shipment_id'] },
          { fields: ['to_status'] },
          { fields: ['occurred_at'] },
          { fields: ['created_at'] }
        ]
      }
    )
    return ReturnShipmentEvent
  }
}
