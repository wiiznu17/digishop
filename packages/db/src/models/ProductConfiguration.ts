import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import type { NonAttribute, Association, ForeignKey } from "sequelize";
import type { VariationOption } from "./VariationOption";
import type { ProductItem } from "./ProductItem";

export interface ProductConfigurationAttributes {
  id: number;
  uuid: string;
  productItemId: number;
  variationOptionId: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface ProductConfigurationCreationAttributes
  extends Optional<ProductConfigurationAttributes, "id" | "uuid" | "createdAt" | "updatedAt" | "deletedAt"> {}

export class ProductConfiguration
  extends Model<ProductConfigurationAttributes, ProductConfigurationCreationAttributes>
  implements ProductConfigurationAttributes
{
  public id!: number;
  public uuid!: string;
  public productItemId!: number;
  public variationOptionId!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  // Association fields (for TypeScript)
  declare variationOption?: NonAttribute<VariationOption>;
  declare productItem?: NonAttribute<ProductItem>;

  // metadate
  declare static associations: {
    variationOption: Association<ProductConfiguration, VariationOption>;
    productItem: Association<ProductConfiguration, ProductItem>;
  };

  static initModel(sequelize: Sequelize): typeof ProductConfiguration {
    ProductConfiguration.init(
      {
        id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
        uuid: { type: DataTypes.UUID, allowNull: false, unique: true, defaultValue: DataTypes.UUIDV4 },
        productItemId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: "product_item_id" },
        variationOptionId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, field: "variation_option_id" },
        createdAt: { type: DataTypes.DATE, allowNull: false, field: "created_at", defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, allowNull: false, field: "updated_at", defaultValue: DataTypes.NOW },
        deletedAt: { type: DataTypes.DATE, allowNull: true, field: "deleted_at" },
      },
      {
        sequelize,
        tableName: "PRODUCT_CONFIGURATIONS",
        modelName: "ProductConfiguration",
        paranoid: true,
        deletedAt: "deleted_at",
        indexes: [
          { name: "uq_product_configurations_uuid", fields: ["uuid"], unique: true },
          { fields: ["product_item_id"] },
          { fields: ["variation_option_id"] },
          { unique: true, fields: ["product_item_id", "variation_option_id"] },
        ],
      }
    );
    return ProductConfiguration;
  }
}
