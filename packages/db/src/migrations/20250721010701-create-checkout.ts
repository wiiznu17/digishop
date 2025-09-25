import { DataTypes } from "sequelize";
import { QueryInterface } from "sequelize";

export = {
    async up(queryInterface: QueryInterface) {
        await queryInterface.createTable("CHECKOUT", 
            {
                id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
                customer_id: {
                    type: DataTypes.INTEGER.UNSIGNED,
                    allowNull: true,
                    references: {
                        model: 'USERS',
                        key: 'id',
                    },
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE',
                },
                order_code : {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
                updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
                deleted_at: { type: DataTypes.DATE, allowNull: true },
                
        },{
        engine: 'InnoDB',
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
        }
    )
    await queryInterface.addIndex("CHECKOUT", ["order_code"], {
      name: "ix_checkout_order_code",
      unique: true,
    });
    },
    async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.removeIndex("CHECKOUT", "ix_checkout_order_code");
    await queryInterface.dropTable('CHECKOUT')
  },
}