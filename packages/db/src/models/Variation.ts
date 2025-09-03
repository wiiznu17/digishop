import { Model, DataTypes, Optional, Sequelize } from "sequelize";

export interface VariationAttributes {
  id: number;
  productId: number;
  name: string;             // e.g. "Color", "Size"
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface VariationCreationAttributes
  extends Optional<VariationAttributes, "id" | "createdAt" | "updatedAt" | "deletedAt"> {}

export class Variation
  extends Model<VariationAttributes, VariationCreationAttributes>
  implements VariationAttributes
{
  public id!: number;
  public productId!: number;
  public name!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  static initModel(sequelize: Sequelize): typeof Variation {
    Variation.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        productId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "product_id",
        },
        name: {
          type: DataTypes.STRING(64),
          allowNull: false,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "created_at",
          defaultValue: DataTypes.NOW,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "updated_at",
          defaultValue: DataTypes.NOW,
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "deleted_at",
        },
      },
      {
        sequelize,
        tableName: "VARIATIONS",
        modelName: "Variation",
        paranoid: true,
        deletedAt: "deleted_at",
        indexes: [
          { fields: ["product_id"] },
          { unique: false, fields: ["product_id", "name"] },
        ],
      }
    );
    return Variation;
  }
}
