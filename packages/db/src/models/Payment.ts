import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
import { PaymentStatus } from '../types/enum';

export interface PaymentAttributes {
  id: number;
  orderId: number;
  urlRedirect?: string;
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
  public urlRedirect!: string;
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
        urlRedirect: {
          type: DataTypes.STRING(255),
          allowNull: true,
          field: 'url_redirect',
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
        tableName: 'PAYMENTS',
        modelName: 'Payment',
        paranoid: true,            // เปิด soft delete
        deletedAt: 'deleted_at',   // ชื่อคอลัมน์ soft delete
      }
    );
    return Payment;
  }
}