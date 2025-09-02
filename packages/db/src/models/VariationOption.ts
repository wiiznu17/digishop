import { Model, DataTypes, Optional, Sequelize } from "sequelize";

export interface VariationOptionAttributes {
  id: number;
  variationId: number;
  value: string;            // e.g. "Red", "XL", "128GB"
  sortOrder: number;        // optional ordering
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface VariationOptionCreationAttributes
  extends Optional<VariationOptionAttributes, "id" | "sortOrder" | "createdAt" | "updatedAt" | "deletedAt"> {}

export class VariationOption
  extends Model<VariationOptionAttributes, VariationOptionCreationAttributes>
  implements VariationOptionAttributes
{
  public id!: number;
  public variationId!: number;
  public value!: string;
  public sortOrder!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  static initModel(sequelize: Sequelize): typeof VariationOption {
    VariationOption.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        variationId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "variation_id",
        },
        value: {
          type: DataTypes.STRING(128),
          allowNull: false,
        },
        sortOrder: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
          field: "sort_order",
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
        tableName: "VARIATION_OPTIONS",
        modelName: "VariationOption",
        paranoid: true,
        deletedAt: "deleted_at",
        indexes: [
          { fields: ["variation_id"] },
          { unique: false, fields: ["variation_id", "value"] },
        ],
      }
    );
    return VariationOption;
  }
}
