import { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkInsert("PAYMENTS", [
      {
        order_id: 6001,
        payment_method: "CREDIT_CARD",
        status: "SUCCESS",
        paid_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        order_id: 6002,
        payment_method: "PROMPTPAY",
        status: "SUCCESS",
        paid_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        order_id: 6003,
        payment_method: "QR",
        status: "SUCCESS",
        paid_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        order_id: 6004,
        payment_method: "CREDIT_CARD",
        status: "SUCCESS",
        paid_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        order_id: 6005,
        payment_method: "CASH_ON_DELIVERY",
        status: "PENDING", // COD → จะ success หลังส่ง
        paid_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        order_id: 6006,
        payment_method: "CREDIT_CARD",
        status: "FAILED",
        paid_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        order_id: 6007,
        payment_method: "PROMPTPAY",
        status: "SUCCESS",
        paid_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        order_id: 6008,
        payment_method: "QR",
        status: "SUCCESS",
        paid_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        order_id: 6009,
        payment_method: "CREDIT_CARD",
        status: "PENDING",
        paid_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
      {
        order_id: 6010,
        payment_method: "PROMPTPAY",
        status: "SUCCESS",
        paid_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete("PAYMENTS", {
      order_id: [6001,6002,6003,6004,6005,6006,6007,6008,6009,6010],
    });
  },
};
