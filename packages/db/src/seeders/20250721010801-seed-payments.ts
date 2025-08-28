// src/seeders/20250828095000-seed-payments-for-all-orders.ts
import { QueryInterface } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    const now = new Date();

    await queryInterface.bulkInsert("PAYMENTS", [
      // 6001 PENDING -> ยังไม่จ่าย
      {
        order_id: 6001,
        payment_method: "PROMPTPAY",
        status: "PENDING",
        paid_at: null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      // 6002 CUSTOMER_CANCELED -> จ่ายไม่ผ่าน/ยกเลิก
      {
        order_id: 6002,
        payment_method: "PROMPTPAY",
        status: "FAILED",
        paid_at: null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      // 6003 PAID
      {
        order_id: 6003,
        payment_method: "CREDIT_CARD",
        status: "SUCCESS",
        paid_at: now,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      // 6004 PROCESSING
      {
        order_id: 6004,
        payment_method: "CREDIT_CARD",
        status: "SUCCESS",
        paid_at: now,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      // 6005 READY_TO_SHIP -> COD (ยังไม่เก็บเงิน)
      {
        order_id: 6005,
        payment_method: "CREDIT_CARD",
        status: "SUCCESS",
        paid_at: null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      // 6006 HANDED_OVER
      {
        order_id: 6006,
        payment_method: "CREDIT_CARD",
        status: "SUCCESS",
        paid_at: now,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      // 6007 SHIPPED
      {
        order_id: 6007,
        payment_method: "PROMPTPAY",
        status: "SUCCESS",
        paid_at: now,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      // 6008 DELIVERED -> COD เก็บเงินสำเร็จ
      {
        order_id: 6008,
        payment_method: "CASH_ON_DELIVERY",
        status: "SUCCESS",
        paid_at: now,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      // 6009 COMPLETE
      {
        order_id: 6009,
        payment_method: "QR",
        status: "SUCCESS",
        paid_at: now,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      // 6010 MERCHANT_CANCELED (post-paid เคสพบบ่อย)
      {
        order_id: 6010,
        payment_method: "CREDIT_CARD",
        status: "SUCCESS",
        paid_at: now,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      // 6011 TRANSIT_LACK -> COD ยังไม่เก็บเงิน
      {
        order_id: 6011,
        payment_method: "CASH_ON_DELIVERY",
        status: "PENDING",
        paid_at: null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      // 6012 RE_TRANSIT
      {
        order_id: 6012,
        payment_method: "PROMPTPAY",
        status: "SUCCESS",
        paid_at: now,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      // 6013 REFUND_REQUEST (จ่ายแล้ว ขอคืน)
      {
        order_id: 6013,
        payment_method: "CREDIT_CARD",
        status: "SUCCESS",
        paid_at: now,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      // 6014 AWAITING_RETURN
      {
        order_id: 6014,
        payment_method: "QR",
        status: "SUCCESS",
        paid_at: now,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      // 6015 RECEIVE_RETURN
      {
        order_id: 6015,
        payment_method: "CREDIT_CARD",
        status: "SUCCESS",
        paid_at: now,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      // 6016 RETURN_VERIFIED
      {
        order_id: 6016,
        payment_method: "CREDIT_CARD",
        status: "SUCCESS",
        paid_at: now,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      // 6017 RETURN_FAIL
      {
        order_id: 6017,
        payment_method: "PROMPTPAY",
        status: "SUCCESS",
        paid_at: now,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      // 6018 REFUND_REJECTED (ร้านปฏิเสธการคืนเงิน)
      {
        order_id: 6018,
        payment_method: "CREDIT_CARD",
        status: "SUCCESS",
        paid_at: now,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      // 6019 REFUND_APPROVED
      {
        order_id: 6019,
        payment_method: "PROMPTPAY",
        status: "SUCCESS",
        paid_at: now,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      // 6020 REFUND_SUCCESS (เงินถูกคืนแล้ว — การคืนเงิน track ในตาราง Refund ไม่ยุ่งกับ payment status)
      {
        order_id: 6020,
        payment_method: "CREDIT_CARD",
        status: "SUCCESS",
        paid_at: now,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
      // 6021 REFUND_FAIL
      {
        order_id: 6021,
        payment_method: "QR",
        status: "SUCCESS",
        paid_at: now,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    ]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete("PAYMENTS", {
      order_id: [
        6001,6002,6003,6004,6005,6006,6007,6008,6009,6010,
        6011,6012,6013,6014,6015,6016,6017,6018,6019,6020,6021
      ],
    });
  },
};
