import { Model, DataTypes, Optional, Sequelize } from "sequelize";
export interface CheckOutAttributes {
    id: number;
    customerId:number;
    orderCode: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
}

export interface CheckOutCreationAttributes 
    extends Optional< CheckOutAttributes,
        "id" 
        | "customerId"
        | "orderCode"
        | "createdAt"
        | "deletedAt"
        | "updatedAt"
    >   {}

export class CheckOut
    extends Model<CheckOutAttributes, CheckOutCreationAttributes>
    implements CheckOutAttributes
    {
        public id!: number;
        public customerId!: number;
        public orderCode!: string;
        public readonly createdAt!: Date;
        public readonly updatedAt!: Date;
        public readonly deletedAt!: Date | null;

        static initModel(sequelize: Sequelize): typeof CheckOut {
            CheckOut.init(
                {
                    id: {
                        type: DataTypes.INTEGER.UNSIGNED,
                        autoIncrement: true,
                        primaryKey: true,
                    },
                    customerId: {
                        type: DataTypes.INTEGER.UNSIGNED,
                        allowNull: false,
                        field: "customer_id",
                        },
                    orderCode: {
                        type: DataTypes.STRING(64),
                        allowNull: false,
                        field: "order_code",
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
                },{
                    sequelize,
                    tableName: "CHECKOUT",
                    modelName: "CheckOut",
                    paranoid: true,
                    deletedAt: "deleted_at",
                    indexes: [
                        { name: "ix_checkout_order_code", fields: ["order_code"] },
                    ],
                }
            );
            return CheckOut
        }
    }