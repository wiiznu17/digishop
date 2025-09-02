import { Model, DataTypes, Optional, Sequelize } from "sequelize";

export interface ShoppingCartAttributes {
  id: number;
  userId: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface ShoppingCartCreationAttributes
  extends Optional<ShoppingCartAttributes, "id" | "createdAt" | "updatedAt" | "deletedAt"> {}

export class ShoppingCart
  extends Model<ShoppingCartAttributes, ShoppingCartCreationAttributes>
  implements ShoppingCartAttributes
{
  public id!: number;
  public userId!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  static initModel(sequelize: Sequelize): typeof ShoppingCart {
    ShoppingCart.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "user_id",
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
        tableName: "SHOPPING_CARTS",
        modelName: "ShoppingCart",
        paranoid: true,
        deletedAt: "deleted_at",
        indexes: [{ unique: true, fields: ["user_id"] }],
      }
    );
    return ShoppingCart;
  }
}
