import { Model, DataTypes, Optional, Sequelize } from "sequelize";

export interface ShoppingCartItemAttributes {
  id: number;
  cartId: number;
  productItemId: number;      // FK -> PRODUCT_ITEMS.id (SKU)
  quantity: number;

  // money in minor units
  // มีไว้เพื่อ compare กับราคาปัจจุบันของสินค้า
  // จะอัพเดตเมื่อกดเข้ามาในตะกร้า อีกครั้งหากราคาสินค้าเปลี่ยนแปลง ให้แจ้ง user ว่าราคาสินค้าเปลี่ยนแปลง และอัพเดตใหม่
  unitPriceMinor: number;     // ราคาต่อหน่วย (minor) at the time of adding to cart
  discountMinor: number;      // ส่วนลด/หน่วย ณ ตอนใส่ตะกร้า
  lineTotalMinor: number;     // (unit - discount) * qty ()

  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface ShoppingCartItemCreationAttributes
  extends Optional<
    ShoppingCartItemAttributes,
    "id" | "discountMinor" | "lineTotalMinor" | "createdAt" | "updatedAt" | "deletedAt"
  > {}

export class ShoppingCartItem
  extends Model<ShoppingCartItemAttributes, ShoppingCartItemCreationAttributes>
  implements ShoppingCartItemAttributes
{
  public id!: number;
  public cartId!: number;
  public productItemId!: number;
  public quantity!: number;

  public unitPriceMinor!: number;
  public discountMinor!: number;
  public lineTotalMinor!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  static initModel(sequelize: Sequelize): typeof ShoppingCartItem {
    ShoppingCartItem.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        cartId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "cart_id",
        },
        productItemId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "product_item_id",
        },
        quantity: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 1,
        },

        unitPriceMinor: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: "unit_price_minor",
        },
        discountMinor: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
          field: "discount_minor",
        },
        lineTotalMinor: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
          field: "line_total_minor",
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
        tableName: "SHOPPING_CART_ITEMS",
        modelName: "ShoppingCartItem",
        indexes: [
          { fields: ["cart_id"] },
          { fields: ["product_item_id"] },
          // กันซ้ำ SKU เดียวกันในตะกร้าเดียวกัน
          { unique: true, fields: ["cart_id", "product_item_id"] },
        ],
        hooks: {
          beforeValidate(instance: ShoppingCartItem) {
            const unit = instance.unitPriceMinor ?? 0;
            const disc = instance.discountMinor ?? 0;
            const qty = instance.quantity ?? 0;
            const line = Math.max(0, (unit - disc) * qty);
            instance.lineTotalMinor = Number.isFinite(line) ? line : 0;
          },
        },
      }
    );
    return ShoppingCartItem;
  }
}
