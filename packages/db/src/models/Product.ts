import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
import { ProductStatus } from '../types/enum';
import { ProductImage } from './ProductImage';

export interface ProductAttributes {
  id: number;
  storeId: number;
  categoryId: number;
  name: string;
  description?: string | null;
  price: string; // DECIMAL comes back as string
  stockQuantity: number;
  status: ProductStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductCreationAttributes
  extends Optional<ProductAttributes, 'id' | 'description' | 'status' | 'createdAt' | 'updatedAt'> {}

export class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: number;
  public storeId!: number;
  public categoryId!: number;
  public name!: string;
  public description!: string | null;
  public price!: string;
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