import { Model, DataTypes, Optional, Sequelize } from 'sequelize'
import { ShippingType } from '../types/enum'

export interface ShippingConfigAttributes {
  // for a store
  id: number
  storeId: number
  carrier: string
  shippingType: ShippingType
  pickupTime?: string | null // stored as TIME
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface ShippingConfigCreationAttributes
  extends Optional<
    ShippingConfigAttributes,
    'id' | 'pickupTime' | 'isActive' | 'createdAt' | 'updatedAt'
  > {}

export class ShippingConfig
  extends Model<ShippingConfigAttributes, ShippingConfigCreationAttributes>
  implements ShippingConfigAttributes
{
  public id!: number
  public storeId!: number
  public carrier!: string
  public shippingType!: ShippingType
  public pickupTime!: string | null
  public isActive!: boolean
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  static initModel(sequelize: Sequelize): typeof ShippingConfig {
    ShippingConfig.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        storeId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'store_id'
        },
        carrier: {
          type: DataTypes.STRING(191),
          allowNull: false
        },
        shippingType: {
          type: DataTypes.ENUM(...Object.values(ShippingType)),
          allowNull: false,
          field: 'shipping_type'
        },
        pickupTime: {
          type: DataTypes.TIME,
          allowNull: true,
          field: 'pickup_time'
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
          field: 'is_active'
        }
      },
      {
        sequelize,
        tableName: 'SHIPPING_CONFIGS',
        modelName: 'ShippingConfig',
        paranoid: true, // เปิด soft delete
        deletedAt: 'deleted_at' // ชื่อคอลัมน์ soft delete
      }
    )
    return ShippingConfig
  }
}
