import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
import { PaymentStatus } from '../types/enum';

export interface PaymentAttributes {
  id: number;
  orderId: number;
  paymentMethod: string;
  status: PaymentStatus;
  paidAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaymentCreationAttributes
  extends Optional<PaymentAttributes, 'id' | 'status' | 'paidAt' | 'createdAt' | 'updatedAt'> {}

export class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  public id!: number;
  public orderId!: number;
  public paymentMethod!: string;
  public status!: PaymentStatus;
  public paidAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static initModel(sequelize: Sequelize): typeof Payment {
    Payment.init(
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          autoIncrement: true,
          primaryKey: true,
        },
        orderId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          field: 'order_id',
        },
        paymentMethod: {
          type: DataTypes.STRING(50),
          allowNull: false,
          field: 'payment_method',
        },
        status: {
          type: DataTypes.ENUM(...Object.values(PaymentStatus)),
          allowNull: false,
          defaultValue: PaymentStatus.PENDING,
        },
        paidAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: 'paid_at',
        },
      },
      {
        sequelize,
        tableName: 'PAYMENTS',
        modelName: 'Payment',
        paranoid: true,            // เปิด soft delete
        deletedAt: 'deleted_at',   // ชื่อคอลัมน์ soft delete
      }
    );
    return Payment;
  }
}