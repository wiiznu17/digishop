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
  // not use
  price: number; // now we use product item for price/stock (string) , simple (number)
  stockQuantity: number; // now we use product item for price/stock
  status: ProductStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductCreationAttributes
  extends Optional<ProductAttributes, 'id' | 'description' | 'status' | 'createdAt' | 'updatedAt'> {}

export class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: number;
  public uuid!: string;
  public storeId!: number;
  public categoryId!: number;
  public name!: string;
  public description!: string | null;
  public price!: number;
  public stockQuantity!: number;
  public status!: ProductStatus;
  public images?: ProductImage[];

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static initModel(sequelize: Sequelize): typeof Product {
    Product.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        uuid: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          field: 'uuid'
        },
        storeId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'store_id',
        },
        categoryId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'category_id',
        },
        name: {
          type: DataTypes.STRING(191),
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        price: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        stockQuantity: {
          type: DataTypes.INTEGER,
          allowNull: false,
          field: 'stock_quantity',
          defaultValue: 0,
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
      },
      {
        sequelize,
        tableName: 'PRODUCTS',
        modelName: 'Product',
        paranoid: true,            // เปิด soft delete
        deletedAt: 'deleted_at',   // ชื่อคอลัมน์ soft delete
      }
    );
    return Product;
  }
}