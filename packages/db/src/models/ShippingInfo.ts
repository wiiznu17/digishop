import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
import { ShippingStatus } from '../types/enum';

export interface ShippingInfoAttributes {
  id: number;
  orderId: number;
  trackingNumber?: string | null;
  carrier?: string | null;
  shippingTypeId: number;
  shippingStatus: ShippingStatus;
  shippedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ShippingInfoCreationAttributes
  extends Optional<ShippingInfoAttributes, 'id' | 'trackingNumber' | 'carrier' | 'shippingStatus' | 'shippedAt' | 'createdAt' | 'updatedAt'> {}

export class ShippingInfo extends Model<ShippingInfoAttributes, ShippingInfoCreationAttributes>
  implements ShippingInfoAttributes {
  public id!: number;
  public orderId!: number;
  public trackingNumber!: string | null;
  public carrier!: string | null;
  public shippingTypeId!: number;
  public shippingStatus!: ShippingStatus;
  public shippedAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static initModel(sequelize: Sequelize): typeof ShippingInfo {
    ShippingInfo.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        orderId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'order_id',
        },
        trackingNumber: {
          type: DataTypes.STRING(100),
          allowNull: true,
          field: 'tracking_number',
        },
        carrier: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        shippingTypeId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'shipping_type_id',
          references: {
            model: 'SHIPPING_TYPE',
            key: 'id',
          },
        },
        shippingStatus: {
          type: DataTypes.ENUM(...Object.values(ShippingStatus)),
          allowNull: false,
          defaultValue: ShippingStatus.PROCESSING,
          field: 'shipping_status',
        },
        shippedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'shipped_at',
        },
      },
      {
        sequelize,
        tableName: 'SHIPPING_INFO',
        modelName: 'ShippingInfo',
        paranoid: true,            // เปิด soft delete
        deletedAt: 'deleted_at',   // ชื่อคอลัมน์ soft delete
      }
    );
    return ShippingInfo;
  }
}