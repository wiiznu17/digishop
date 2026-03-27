// src/seeders/2025xxxx-seed-refund-status-history.ts
import { QueryInterface } from 'sequelize'

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.bulkInsert('REFUND_STATUS_HISTORY', [
      // 1) refund_order_id: 1 -> order 6013 (REQUESTED)
      {
        refund_order_id: 1,
        from_status: null,
        to_status: 'REQUESTED',
        reason: 'ลูกค้าส่งคำขอ',
        changed_by_type: 'CUSTOMER',
        changed_by_id: 101,
        source: 'WEB',
        correlation_id: 'refund-6013-req',
        metadata: JSON.stringify({}),
        created_at: new Date('2025-08-20T09:00:00Z'),
        updated_at: new Date('2025-08-20T09:00:00Z'),
        deleted_at: null
      },

      // 2) refund_order_id: 2 -> order 6014
      {
        refund_order_id: 2,
        from_status: null,
        to_status: 'REQUESTED',
        reason: 'ลูกค้าส่งคำขอ (ขอคืนหลังได้รับสินค้า)',
        changed_by_type: 'CUSTOMER',
        changed_by_id: 102,
        source: 'WEB',
        correlation_id: 'refund-6014-req',
        metadata: JSON.stringify({}),
        created_at: new Date('2025-08-19T10:30:00Z'),
        updated_at: new Date('2025-08-19T10:30:00Z'),
        deleted_at: null
      },

      // 3) refund_order_id: 3 -> order 6015
      {
        refund_order_id: 3,
        from_status: null,
        to_status: 'REQUESTED',
        reason: 'ลูกค้าส่งคำขอ (ร้านค้ารับพัสดุคืนแล้ว)',
        changed_by_type: 'CUSTOMER',
        changed_by_id: 103,
        source: 'WEB',
        correlation_id: 'refund-6015-req',
        metadata: JSON.stringify({}),
        created_at: new Date('2025-08-18T11:00:00Z'),
        updated_at: new Date('2025-08-18T11:00:00Z'),
        deleted_at: null
      },

      // 4) refund_order_id: 4 -> order 6016
      {
        refund_order_id: 4,
        from_status: null,
        to_status: 'REQUESTED',
        reason: 'ลูกค้าส่งคำขอ (ตรวจสอบสินค้าคืนแล้ว)',
        changed_by_type: 'CUSTOMER',
        changed_by_id: 104,
        source: 'WEB',
        correlation_id: 'refund-6016-req',
        metadata: JSON.stringify({}),
        created_at: new Date('2025-08-18T12:00:00Z'),
        updated_at: new Date('2025-08-18T12:00:00Z'),
        deleted_at: null
      },

      // 5) refund_order_id: 5 -> order 6017 (REQUESTED -> FAIL)
      {
        refund_order_id: 5,
        from_status: null,
        to_status: 'REQUESTED',
        reason: 'ลูกค้าส่งคำขอ',
        changed_by_type: 'CUSTOMER',
        changed_by_id: 105,
        source: 'WEB',
        correlation_id: 'refund-6017-req',
        metadata: JSON.stringify({}),
        created_at: new Date('2025-08-17T09:30:00Z'),
        updated_at: new Date('2025-08-17T09:30:00Z'),
        deleted_at: null
      },
      {
        refund_order_id: 5,
        from_status: 'REQUESTED',
        to_status: 'FAIL',
        reason: 'ร้านค้าปฏิเสธ: ส่งคืนเกินเวลา/อุปกรณ์ไม่ครบ',
        changed_by_type: 'MERCHANT',
        changed_by_id: 201,
        source: 'WEB',
        correlation_id: 'refund-6017-reject',
        metadata: JSON.stringify({ stage: 'RETURN_FAIL' }),
        created_at: new Date('2025-08-18T10:00:00Z'),
        updated_at: new Date('2025-08-18T10:00:00Z'),
        deleted_at: null
      },

      // 6) refund_order_id: 6 -> order 6018 (REQUESTED -> FAIL)
      {
        refund_order_id: 6,
        from_status: null,
        to_status: 'REQUESTED',
        reason: 'ลูกค้าส่งคำขอ',
        changed_by_type: 'CUSTOMER',
        changed_by_id: 106,
        source: 'WEB',
        correlation_id: 'refund-6018-req',
        metadata: JSON.stringify({}),
        created_at: new Date('2025-08-17T10:00:00Z'),
        updated_at: new Date('2025-08-17T10:00:00Z'),
        deleted_at: null
      },
      {
        refund_order_id: 6,
        from_status: 'REQUESTED',
        to_status: 'FAIL',
        reason: 'ร้านค้าปฏิเสธ: ไม่เข้าเงื่อนไขตามนโยบายร้าน',
        changed_by_type: 'MERCHANT',
        changed_by_id: 202,
        source: 'WEB',
        correlation_id: 'refund-6018-reject',
        metadata: JSON.stringify({ policy: 'No refund after use' }),
        created_at: new Date('2025-08-17T12:00:00Z'),
        updated_at: new Date('2025-08-17T12:00:00Z'),
        deleted_at: null
      },

      // 7) refund_order_id: 7 -> order 6019 (REQUESTED -> APPROVED)
      {
        refund_order_id: 7,
        from_status: null,
        to_status: 'REQUESTED',
        reason: 'ลูกค้าส่งคำขอ',
        changed_by_type: 'CUSTOMER',
        changed_by_id: 107,
        source: 'WEB',
        correlation_id: 'refund-6019-req',
        metadata: JSON.stringify({}),
        created_at: new Date('2025-08-16T08:45:00Z'),
        updated_at: new Date('2025-08-16T08:45:00Z'),
        deleted_at: null
      },
      {
        refund_order_id: 7,
        from_status: 'REQUESTED',
        to_status: 'APPROVED',
        reason: 'ร้านค้าตอบรับ',
        changed_by_type: 'MERCHANT',
        changed_by_id: 203,
        source: 'WEB',
        correlation_id: 'refund-6019-approve',
        metadata: JSON.stringify({}),
        created_at: new Date('2025-08-17T14:00:00Z'),
        updated_at: new Date('2025-08-17T14:00:00Z'),
        deleted_at: null
      },

      // 8) refund_order_id: 8 -> order 6020 (REQUESTED -> APPROVED -> SUCCESS)
      {
        refund_order_id: 8,
        from_status: null,
        to_status: 'REQUESTED',
        reason: 'ลูกค้าส่งคำขอ',
        changed_by_type: 'CUSTOMER',
        changed_by_id: 108,
        source: 'WEB',
        correlation_id: 'refund-6020-req',
        metadata: JSON.stringify({}),
        created_at: new Date('2025-08-15T09:15:00Z'),
        updated_at: new Date('2025-08-15T09:15:00Z'),
        deleted_at: null
      },
      {
        refund_order_id: 8,
        from_status: 'REQUESTED',
        to_status: 'APPROVED',
        reason: 'ร้านค้าตอบรับ',
        changed_by_type: 'MERCHANT',
        changed_by_id: 204,
        source: 'WEB',
        correlation_id: 'refund-6020-approve',
        metadata: JSON.stringify({}),
        created_at: new Date('2025-08-16T10:00:00Z'),
        updated_at: new Date('2025-08-16T10:00:00Z'),
        deleted_at: null
      },
      {
        refund_order_id: 8,
        from_status: 'APPROVED',
        to_status: 'SUCCESS',
        reason: 'โอนเงินคืนสำเร็จ',
        changed_by_type: 'SYSTEM',
        changed_by_id: 0,
        source: 'PAYMENT_GATEWAY',
        correlation_id: 'refund-6020-success',
        metadata: JSON.stringify({ pgw: 'KBank' }),
        created_at: new Date('2025-08-16T12:30:00Z'),
        updated_at: new Date('2025-08-16T12:30:00Z'),
        deleted_at: null
      },

      // 9) refund_order_id: 9 -> order 6021 (REQUESTED -> APPROVED -> FAIL)
      {
        refund_order_id: 9,
        from_status: null,
        to_status: 'REQUESTED',
        reason: 'ลูกค้าส่งคำขอ',
        changed_by_type: 'CUSTOMER',
        changed_by_id: 109,
        source: 'WEB',
        correlation_id: 'refund-6021-req',
        metadata: JSON.stringify({}),
        created_at: new Date('2025-08-15T10:00:00Z'),
        updated_at: new Date('2025-08-15T10:00:00Z'),
        deleted_at: null
      },
      {
        refund_order_id: 9,
        from_status: 'REQUESTED',
        to_status: 'APPROVED',
        reason: 'ร้านค้าตอบรับ',
        changed_by_type: 'MERCHANT',
        changed_by_id: 205,
        source: 'WEB',
        correlation_id: 'refund-6021-approve',
        metadata: JSON.stringify({}),
        created_at: new Date('2025-08-16T09:30:00Z'),
        updated_at: new Date('2025-08-16T09:30:00Z'),
        deleted_at: null
      },
      {
        refund_order_id: 9,
        from_status: 'APPROVED',
        to_status: 'FAIL',
        reason: 'PG คืนเงินล้มเหลว (TIMEOUT)',
        changed_by_type: 'SYSTEM',
        changed_by_id: 0,
        source: 'PAYMENT_GATEWAY',
        correlation_id: 'refund-6021-fail',
        metadata: JSON.stringify({ pgwError: 'TIMEOUT' }),
        created_at: new Date('2025-08-16T10:10:00Z'),
        updated_at: new Date('2025-08-16T10:10:00Z'),
        deleted_at: null
      },

      // 10) refund_order_id: 10 -> order 6022 (REQUESTED)
      {
        refund_order_id: 10,
        from_status: null,
        to_status: 'REQUESTED',
        reason: 'ลูกค้าส่งคำขอ (หลังจัดส่ง)',
        changed_by_type: 'CUSTOMER',
        changed_by_id: 110,
        source: 'APP',
        correlation_id: 'refund-6022-req',
        metadata: JSON.stringify({}),
        created_at: new Date('2025-08-20T09:00:00Z'),
        updated_at: new Date('2025-08-20T09:00:00Z'),
        deleted_at: null
      }
    ])
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete('REFUND_STATUS_HISTORY', {
      refund_order_id: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    })
  }
}
