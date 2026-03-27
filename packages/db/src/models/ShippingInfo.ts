import { Model, DataTypes, Optional, Sequelize } from 'sequelize'
import { ShippingStatus } from '../types/enum'

export interface ShippingInfoAttributes {
  id: number
  orderId: number
  trackingNumber?: string | null
  carrier?: string | null // update by merchant
  shippingTypeId: number // reference to ShippingType.id
  shippingAddress: number // reference to Address.id
  shippingStatus: ShippingStatus
  shippedAt?: Date | null
  deliveredAt?: Date | null
  returnedToSenderAt?: Date | null

  // Snapshot fields
  shippingTypeNameSnapshot: string // e.g. "Standard Shipping", "Express Delivery"
  shippingPriceMinorSnapshot: number // price in minor units at the time of order
  addressSnapshot: object // JSON snapshot of the address at the time of order

  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export interface ShippingInfoCreationAttributes
  extends Optional<
    ShippingInfoAttributes,
    | 'id'
    | 'trackingNumber'
    | 'carrier'
    | 'shippingStatus'
    | 'shippedAt'
    | 'deliveredAt'
    | 'returnedToSenderAt'
    | 'shippingTypeNameSnapshot'
    | 'shippingPriceMinorSnapshot'
    | 'addressSnapshot'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
  > {}

export class ShippingInfo
  extends Model<ShippingInfoAttributes, ShippingInfoCreationAttributes>
  implements ShippingInfoAttributes
{
  public id!: number
  public orderId!: number
  public trackingNumber!: string | null
  public carrier!: string | null
  public shippingTypeId!: number
  public shippingAddress!: number
  public shippingStatus!: ShippingStatus
  public shippedAt!: Date | null
  public deliveredAt!: Date | null
  public returnedToSenderAt!: Date | null

  public shippingTypeNameSnapshot!: string
  public shippingPriceMinorSnapshot!: number
  public addressSnapshot!: object

  public readonly createdAt!: Date
  public readonly updatedAt!: Date
  public readonly deletedAt!: Date | null

  static initModel(sequelize: Sequelize): typeof ShippingInfo {
    ShippingInfo.init(
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
        trackingNumber: {
          type: DataTypes.STRING(100),
          allowNull: true,
          field: 'tracking_number'
        },
        carrier: {
          type: DataTypes.STRING(100),
          allowNull: true
        },
        shippingTypeId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'shipping_type_id',
          references: { model: 'SHIPPING_TYPES', key: 'id' }
        },
        shippingAddress: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'shipping_address',
          references: { model: 'ADDRESSES', key: 'id' }
        },
        shippingStatus: {
          type: DataTypes.ENUM(...Object.values(ShippingStatus)),
          allowNull: false,
          defaultValue: ShippingStatus.PENDING,
          field: 'shipping_status'
        },
        shippedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'shipped_at'
        },
        deliveredAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'delivered_at'
        },
        returnedToSenderAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'returned_to_sender_at'
        },
        shippingTypeNameSnapshot: {
          type: DataTypes.STRING(80),
          allowNull: false,
          defaultValue: '',
          field: 'shipping_type_name_snapshot'
        },
        shippingPriceMinorSnapshot: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
          field: 'shipping_price_minor_snapshot'
        },
        addressSnapshot: {
          type: DataTypes.JSON,
          allowNull: false,
          defaultValue: {},
          field: 'address_snapshot'
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
        tableName: 'SHIPPING_INFO',
        modelName: 'ShippingInfo',
        paranoid: true,
        deletedAt: 'deleted_at',
        indexes: [
          { fields: ['order_id'] },
          { fields: ['shipping_type_id'] },
          { fields: ['shipping_address'] },
          { fields: ['shipping_status'] },
          { fields: ['tracking_number'] },
          { fields: ['created_at'] },
          { fields: ['delivered_at'] },
          { fields: ['returned_to_sender_at'] }
        ]
      }
    )
    return ShippingInfo
  }
}
