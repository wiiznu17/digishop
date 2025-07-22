import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

export interface CategoryAttributes {
  id: number;
  name: string;
  parentId?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CategoryCreationAttributes
  extends Optional<CategoryAttributes, 'id' | 'parentId' | 'createdAt' | 'updatedAt'> {}

export class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
  public id!: number;
  public name!: string;
  public parentId!: number | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static initModel(sequelize: Sequelize): typeof Category {
    Category.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING(191),
          allowNull: false,
        },
        parentId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          field: 'parent_id',
        },
      },
      {
        sequelize,
        tableName: 'CATEGORIES',
        modelName: 'Category',
        paranoid: true,            // เปิด soft delete
        deletedAt: 'deleted_at',   // ชื่อคอลัมน์ soft delete
      }
    );
    return Category;
  }
}