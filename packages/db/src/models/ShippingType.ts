import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface ShippingTypeAttributes {
  id: number;
  name: string;            // ชื่อประเภท เช่น "Standard", "Express"
  description?: string | null;
  estimatedDays: number;   // จำนวนวันโดยประมาณ
  price: number;           // ค่าส่ง
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ShippingTypeCreationAttributes
  extends Optional<ShippingTypeAttributes, 'id' | 'description' | 'createdAt' | 'updatedAt'> {}

export class ShippingType
  extends Model<ShippingTypeAttributes, ShippingTypeCreationAttributes>
  implements ShippingTypeAttributes {
  public id!: number;
  public name!: string;
  public description!: string | null;
  public estimatedDays!: number;
  public price!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static initModel(sequelize: Sequelize): typeof ShippingType {
    ShippingType.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        estimatedDays: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
        },
        price: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: 'SHIPPING_TYPES',
        modelName: 'ShippingType',
        timestamps: true,
      }
    );
    return ShippingType;
  }
}
