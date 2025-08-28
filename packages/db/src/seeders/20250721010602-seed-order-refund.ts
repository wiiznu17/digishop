// src/seeders/20250828092000-seed-refund-orders.ts
import { QueryInterface } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert("REFUND_ORDERS", [
      // 6013: ORDERS.status = REFUND_REQUEST  -> Refund = REQUESTED
      {
        order_id: 6013,
        reason: "เปลี่ยนใจ",
        merchant_reject_reason: null,
        amount: "4100.00",
        status: "REQUESTED",
        description: "ขอคืนเงินก่อนจัดส่ง",
        contact_email: "customer6013@example.com",
        requested_by: "CUSTOMER",
        requested_at: new Date("2025-08-20T09:00:00Z"),
        approved_at: null,
        refunded_at: null,
        metadata: JSON.stringify({ stage: "REFUND_REQUEST" }),
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },

      // 6014: ORDERS.status = AWAITING_RETURN -> Refund = REQUESTED (รอส่งคืน)
      {
        order_id: 6014,
        reason: "สีไม่ตรง",
        merchant_reject_reason: null,
        amount: "2500.00",
        status: "REQUESTED",
        description: "ต้องการคืนหลังได้รับสินค้าแล้ว",
        contact_email: "customer6014@example.com",
        requested_by: "CUSTOMER",
        requested_at: new Date("2025-08-19T10:30:00Z"),
        approved_at: null,
        refunded_at: null,
        metadata: JSON.stringify({ stage: "AWAITING_RETURN" }),
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },

      // 6015: ORDERS.status = RECEIVE_RETURN -> Refund = REQUESTED (ร้านค้ารับพัสดุคืนแล้ว)
      {
        order_id: 6015,
        reason: "สินค้ามีตำหนิ",
        merchant_reject_reason: null,
        amount: "2550.00",
        status: "REQUESTED",
        description: "มีรอยขีดข่วนชัดเจน",
        contact_email: "customer6015@example.com",
        requested_by: "CUSTOMER",
        requested_at: new Date("2025-08-18T11:00:00Z"),
        approved_at: null,
        refunded_at: null,
        metadata: JSON.stringify({ stage: "RECEIVE_RETURN" }),
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },

      // 6016: ORDERS.status = RETURN_VERIFIED -> Refund = REQUESTED (ตรวจสอบแล้ว เตรียมอนุมัติ)
      {
        order_id: 6016,
        reason: "ไม่ตรงสเปค",
        merchant_reject_reason: null,
        amount: "2600.00",
        status: "REQUESTED",
        description: "สเปค RAM/ROM ไม่ตรงประกาศ",
        contact_email: "customer6016@example.com",
        requested_by: "CUSTOMER",
        requested_at: new Date("2025-08-18T12:00:00Z"),
        approved_at: null,            // จะเติมเมื่อออเดอร์เปลี่ยนเป็น REFUND_APPROVED
        refunded_at: null,
        metadata: JSON.stringify({ stage: "RETURN_VERIFIED" }),
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },

      // 6017: ORDERS.status = RETURN_FAIL -> Refund = FAIL (ส่งคืน/ตรวจไม่ผ่าน)
      {
        order_id: 6017,
        reason: "ส่งคืนไม่ทันกำหนด",
        merchant_reject_reason: "ส่งคืนเกินเวลา/อุปกรณ์ไม่ครบ",
        amount: "2650.00",
        status: "FAIL",
        description: "ส่งคืนล่าช้าและขาดอุปกรณ์",
        contact_email: "customer6017@example.com",
        requested_by: "CUSTOMER",
        requested_at: new Date("2025-08-17T09:30:00Z"),
        approved_at: null,
        refunded_at: null,
        metadata: JSON.stringify({ stage: "RETURN_FAIL" }),
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },

      // 6018: ORDERS.status = REFUND_REJECTED -> Refund = FAIL (ร้านค้าปฏิเสธ)
      {
        order_id: 6018,
        reason: "ไม่พอใจสินค้า",
        merchant_reject_reason: "ไม่เข้าเงื่อนไขตามนโยบายร้าน",
        amount: "4200.00",
        status: "FAIL",
        description: "ใช้งานแล้ว สภาพไม่พร้อมคืน",
        contact_email: "customer6018@example.com",
        requested_by: "CUSTOMER",
        requested_at: new Date("2025-08-17T10:00:00Z"),
        approved_at: null,
        refunded_at: null,
        metadata: JSON.stringify({ stage: "REFUND_REJECTED" }),
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },

      // 6019: ORDERS.status = REFUND_APPROVED -> Refund = APPROVED
      {
        order_id: 6019,
        reason: "ของมีตำหนิ",
        merchant_reject_reason: null,
        amount: "4300.00",
        status: "APPROVED",
        description: "ตำหนิที่มุมเครื่อง",
        contact_email: "customer6019@example.com",
        requested_by: "CUSTOMER",
        requested_at: new Date("2025-08-16T08:45:00Z"),
        approved_at: new Date("2025-08-17T14:00:00Z"),
        refunded_at: null,
        metadata: JSON.stringify({ stage: "REFUND_APPROVED" }),
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },

      // 6020: ORDERS.status = REFUND_SUCCESS -> Refund = SUCCESS
      {
        order_id: 6020,
        reason: "กล่องบุบ/แพ็กไม่ดี",
        merchant_reject_reason: null,
        amount: "5100.00",
        status: "SUCCESS",
        description: "แพ็กเกจบุบชัดเจน มีรูปประกอบ",
        contact_email: "customer6020@example.com",
        requested_by: "CUSTOMER",
        requested_at: new Date("2025-08-15T09:15:00Z"),
        approved_at: new Date("2025-08-16T10:00:00Z"),
        refunded_at: new Date("2025-08-16T12:30:00Z"),
        metadata: JSON.stringify({ stage: "REFUND_SUCCESS" }),
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },

      // 6021: ORDERS.status = REFUND_FAIL -> Refund = FAIL (PG คืนเงินล้มเหลว)
      {
        order_id: 6021,
        reason: "สินค้าไม่ทำงาน",
        merchant_reject_reason: null,            // เคสนี้คืออนุมัติแล้วแต่โอนเงินคืนล้มเหลว
        amount: "4400.00",
        status: "FAIL",
        description: "เปิดไม่ติดแม้ชาร์จแบต",
        contact_email: "customer6021@example.com",
        requested_by: "CUSTOMER",
        requested_at: new Date("2025-08-15T10:00:00Z"),
        approved_at: new Date("2025-08-16T09:30:00Z"),
        refunded_at: null,
        metadata: JSON.stringify({ stage: "REFUND_FAIL", pgwError: "TIMEOUT" }),
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    ]);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete("REFUND_ORDERS", {
      order_id: [6013,6014,6015,6016,6017,6018,6019,6020,6021],
    });
  },
};
