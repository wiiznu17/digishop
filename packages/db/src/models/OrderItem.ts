import { Model, DataTypes, Optional, Sequelize } from 'sequelize'

export interface OrderItemAttributes {
  id: number
  orderId: number
  productId: number
  productItemId?: number | null // SKU รหัสสินค้าย่อย เช่น size/color --> T-SH-001-RED-L
  quantity: number

  // money in minor units snapshot
  unitPriceMinor: number // ราคาต่อชิ้น (minor)
  discountMinor: number // ส่วนลดต่อ (minor)
  taxRate: string // DECIMAL as string ("0.0700") เอาไว้คูณกับ lineTotalMinor เพื่อคำนวณภาษี
  lineTotalMinor: number // ยอดรวมของสินค้า = (unitPrice - discount) * quantity

  // snapshots
  productNameSnapshot: string
  productSkuSnapshot?: string | null // allow null if สินค้าบางตัวไม่มี sku
  productImageSnapshot?: string | null // main image url at order create time
  optionsText?: string | null // e.g. "Size: L, Color: Red"
  productSnapshot?: object | null // JSON at the time of order (maybe only this field is enough for snapshot?)

  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export interface OrderItemCreationAttributes
  extends Optional<
    OrderItemAttributes,
    | 'id'
    | 'productItemId'
    | 'discountMinor'
    | 'taxRate'
    | 'lineTotalMinor'
    | 'productSkuSnapshot'
    | 'productImageSnapshot'
    | 'optionsText'
    | 'productSnapshot'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
  > {}

export class OrderItem
  extends Model<OrderItemAttributes, OrderItemCreationAttributes>
  implements OrderItemAttributes
{
  public id!: number
  public orderId!: number
  public productId!: number
  public productItemId?: number | null
  public quantity!: number

  public unitPriceMinor!: number
  public discountMinor!: number
  public taxRate!: string
  public lineTotalMinor!: number

  public productNameSnapshot!: string
  public productSkuSnapshot?: string | null
  public productImageSnapshot?: string | null
  public optionsText?: string | null
  public productSnapshot?: object | null

  public readonly createdAt!: Date
  public readonly updatedAt!: Date
  public readonly deletedAt!: Date | null

  static initModel(sequelize: Sequelize): typeof OrderItem {
    OrderItem.init(
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
        productId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'product_id'
        },
        productItemId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          field: 'product_item_id'
        },
        quantity: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false
        },

        // amounts (minor)
        unitPriceMinor: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'unit_price_minor'
        },
        discountMinor: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
          field: 'discount_minor'
        },
        taxRate: {
          type: DataTypes.DECIMAL(5, 4),
          allowNull: false,
          defaultValue: '0.0000',
          field: 'tax_rate',
          // ให้ Sequelize คืนค่าเป็น string เสมอ
          get(this: OrderItem) {
            const v = this.getDataValue('taxRate') as unknown
            return v === null || v === undefined ? '0.0000' : String(v)
          }
        },
        lineTotalMinor: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
          field: 'line_total_minor'
        },

        // snapshots
        productNameSnapshot: {
          type: DataTypes.STRING(200),
          allowNull: false,
          field: 'product_name_snapshot'
        },
        productSkuSnapshot: {
          type: DataTypes.STRING(64),
          allowNull: true,
          field: 'product_sku_snapshot'
        },
        productImageSnapshot: {
          type: DataTypes.STRING(512),
          allowNull: true,
          field: 'product_image_snapshot'
        },
        optionsText: {
          type: DataTypes.STRING(255),
          allowNull: true,
          field: 'options_text'
        },
        productSnapshot: {
          type: DataTypes.JSON,
          allowNull: true,
          field: 'product_snapshot'
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
        tableName: 'ORDER_ITEMS',
        modelName: 'OrderItem',
        paranoid: true,
        deletedAt: 'deleted_at',
        indexes: [
          { fields: ['order_id'] },
          { fields: ['product_id'] },
          { fields: ['product_item_id'] } // NEW
        ],
        hooks: {
          beforeValidate(instance: OrderItem) {
            const unit = instance.unitPriceMinor ?? 0
            const disc = instance.discountMinor ?? 0
            const qty = instance.quantity ?? 0
            const line = Math.max(0, (unit - disc) * qty)
            instance.lineTotalMinor = Number.isFinite(line) ? line : 0
          }
        }
      }
    )
    return OrderItem
  }
}
