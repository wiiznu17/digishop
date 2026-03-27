import { Model, DataTypes, Optional, Sequelize } from 'sequelize'

export interface CategoryAttributes {
  id: number
  uuid: string
  name: string
  parentId?: number | null
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export interface CategoryCreationAttributes
  extends Optional<
    CategoryAttributes,
    'id' | 'uuid' | 'parentId' | 'createdAt' | 'updatedAt' | 'deletedAt'
  > {}

export class Category
  extends Model<CategoryAttributes, CategoryCreationAttributes>
  implements CategoryAttributes
{
  public id!: number
  public uuid!: string
  public name!: string
  public parentId!: number | null
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
  public readonly deletedAt!: Date | null

  static initModel(sequelize: Sequelize): typeof Category {
    Category.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true
        },
        uuid: {
          type: DataTypes.UUID,
          allowNull: false,
          unique: true,
          defaultValue: DataTypes.UUIDV4
        },
        name: {
          type: DataTypes.STRING(191),
          allowNull: false
        },
        parentId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: true,
          field: 'parent_id'
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
        tableName: 'CATEGORIES',
        modelName: 'Category',
        paranoid: true,
        deletedAt: 'deleted_at',
        indexes: [
          { name: 'uq_categories_uuid', fields: ['uuid'], unique: true },
          { name: 'ix_categories_parent', fields: ['parent_id'] }
        ]
      }
    )
    return Category
  }
}
