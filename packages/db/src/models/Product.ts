import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
import { ProductReqStatus, ProductStatus } from '../types/enum';
import type { NonAttribute, Association } from 'sequelize';
import type { ProductImage } from './ProductImage';
import type { ProductItem } from './ProductItem';
export interface ProductAttributes {
  id: number;
  uuid: string;
  storeId: number;
  categoryId: number;
  name: string;
  description?: string | null;
  // not use
  // price: number;  now we use product item for price/stock (string) , simple (number)
  // stockQuantity: number;  now we use product item for price/stock
  status: ProductStatus;
  reqStatus: ProductReqStatus;
  rejectReason: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface ProductCreationAttributes
  extends Optional<
    ProductAttributes,
    'id' | 'uuid' | 'description' | 'reqStatus' | 'rejectReason' | 'createdAt' | 'updatedAt' | 'deletedAt'
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
  public status!: ProductStatus;
  public reqStatus!: ProductReqStatus;
  public rejectReason!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date | null;

  // associations
  // public images?: ProductImage[];
  declare images?: NonAttribute<ProductImage[]>;
  declare items?: NonAttribute<ProductItem[]>;

  declare static associations: {
    images: Association<Product, ProductImage>;
    items: Association<Product, ProductItem>;
  };

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
        status: {
          type: DataTypes.ENUM(...Object.values(ProductStatus)),
          allowNull: false,
          defaultValue: ProductStatus.ACTIVE,
        },
        reqStatus: {
          type: DataTypes.ENUM(...Object.values(ProductReqStatus)),
          allowNull: false,
          defaultValue: ProductReqStatus.PENDING,
        },
        rejectReason: {
          type: DataTypes.STRING(191),
          allowNull: true,
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
