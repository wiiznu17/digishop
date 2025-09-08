import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
import { ProductStatus } from '../types/enum';
import { ProductImage } from './ProductImage';

export interface ProductAttributes {
  id: number;
  uuid: string;
  storeId: number;
  categoryId: number;
  name: string;
  description?: string | null;
  // base/list price (ไม่บังคับ เพราะใช้ที่ SKU)
  // NOTE: Sequelize DECIMAL -> TypeScript ใช้ string เพื่อลด floating error
  price?: string | null;
  // ใช้ที่ SKU เป็นหลัก จึงปล่อยให้ nullable ได้
  stockQuantity?: number | null;
  status: ProductStatus;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface ProductCreationAttributes
  extends Optional<
    ProductAttributes,
    'id' | 'uuid' | 'description' | 'price' | 'stockQuantity' | 'status' | 'createdAt' | 'updatedAt' | 'deletedAt'
  > {}

export class Product
  extends Model<ProductAttributes, ProductCreationAttributes>
  implements ProductAttributes
{
  public id!: number;
  public uuid!: string;
  public storeId!: number;
  public categoryId!: number;
  public name!: string;
  public description!: string | null;
  public price!: string | null;
  public stockQuantity!: number | null;
  public status!: ProductStatus;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  // associations
  public images?: ProductImage[];

  static initModel(sequelize: Sequelize): typeof Product {
    Product.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        uuid: {
          type: DataTypes.UUID,              // CHAR(36)
          allowNull: false,
          unique: true,
          defaultValue: DataTypes.UUIDV4,    // generate v4 ฝั่งแอป
        },
        storeId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'store_id',
          references: { model: 'STORES', key: 'id' },
        },
        categoryId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'category_id',
          references: { model: 'CATEGORIES', key: 'id' },
        },
        name: {
          type: DataTypes.STRING(191),
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        // ใช้ DECIMAL เพื่อเป็น list/base price (ทาง TS ใช้ string)
        price: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: true,
        },
        stockQuantity: {
          type: DataTypes.INTEGER,
          allowNull: true,
          field: 'stock_quantity',
          defaultValue: null,
        },
        status: {
          type: DataTypes.ENUM(...Object.values(ProductStatus)),
          allowNull: false,
          defaultValue: ProductStatus.ACTIVE,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'created_at',
          defaultValue: DataTypes.NOW,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: 'updated_at',
          defaultValue: DataTypes.NOW,
        },
        deletedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'deleted_at',
        },
      },
      {
        sequelize,
        tableName: 'PRODUCTS',
        modelName: 'Product',
        paranoid: true,          // ใช้ deleted_at
        deletedAt: 'deleted_at',
        indexes: [
          { name: 'uq_products_uuid', unique: true, fields: ['uuid'] },
          { name: 'ix_products_store', fields: ['store_id'] },
          { name: 'ix_products_category', fields: ['category_id'] },
          { name: 'ix_products_status', fields: ['status'] },
          { name: 'ix_products_created_at', fields: ['created_at'] },
        ],
      }
    );
    return Product;
  }
}
