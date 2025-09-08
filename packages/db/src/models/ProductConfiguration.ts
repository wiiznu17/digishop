import { Model, DataTypes, Optional, Sequelize } from "sequelize";

export interface ProductConfigurationAttributes {
  id: number;
  uuid: string;
  productItemId: number;        // FK -> PRODUCT_ITEMS.id
  variationOptionId: number;    // FK -> VARIATION_OPTIONS.id
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

  static initModel(sequelize: Sequelize): typeof ProductConfiguration {
    ProductConfiguration.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        uuid: {
          type: DataTypes.UUID,
          allowNull: false,
          unique: true,
          defaultValue: DataTypes.UUIDV4,
        },
        productItemId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "product_item_id",
        },
        variationOptionId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "variation_option_id",
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
