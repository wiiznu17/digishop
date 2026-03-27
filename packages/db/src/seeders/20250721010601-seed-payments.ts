// src/seeders/20250828095000-seed-payments-for-all-orders.ts
import { QueryInterface } from 'sequelize'

const now = new Date()
const minor = (baht: number) => Math.round(baht * 100)
const ok = (
  o: number,
  method: string,
  amountBaht: number,
  channel: string,
  pgw = 'SETTLED'
) => ({
  checkout_id: o,
  payment_method: method,
  status: 'SUCCESS',
  paid_at: now,

  provider: 'DGS_PGW',
  provider_ref: `pgw-${o}`,
  channel,
  currency_code: 'THB',
  amount_authorized_minor: minor(amountBaht),
  amount_captured_minor: minor(amountBaht),
  amount_refunded_minor: 0,
  pgw_status: pgw,
  pgw_payload: JSON.stringify({ orderId: o, status: pgw }),

  url_redirect: null,
  created_at: now,
  updated_at: now,
  deleted_at: null
})

const pending = (o: number, method: string, channel: string) => ({
  checkout_id: o,
  payment_method: method,
  status: 'PENDING',
  paid_at: null,

  provider: 'DGS_PGW',
  provider_ref: `pgw-${o}`,
  channel,
  currency_code: 'THB',
  amount_authorized_minor: 0,
  amount_captured_minor: 0,
  amount_refunded_minor: 0,
  pgw_status: 'PENDING',
  pgw_payload: JSON.stringify({ orderId: o, status: 'PENDING' }),

  url_redirect: null,
  created_at: now,
  updated_at: now,
  deleted_at: null
})

const failed = (o: number, method: string, channel: string) => ({
  checkout_id: o,
  payment_method: method,
  status: 'FAILED',
  paid_at: null,

  provider: 'DGS_PGW',
  provider_ref: `pgw-${o}`,
  channel,
  currency_code: 'THB',
  amount_authorized_minor: 0,
  amount_captured_minor: 0,
  amount_refunded_minor: 0,
  pgw_status: 'FAILED',
  pgw_payload: JSON.stringify({ orderId: o, status: 'FAILED' }),

  url_redirect: null,
  created_at: now,
  updated_at: now,
  deleted_at: null
})

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkInsert('PAYMENTS', [
      // 6001 PENDING
      pending(1, 'PROMPTPAY', 'PROMPTPAY'),

      // 6002 FAILED
      failed(2, 'PROMPTPAY', 'PROMPTPAY'),

      // 6003 PAID (3500)
      ok(3, 'CREDIT_CARD', 3500, 'CARD'),

      // 6004 PROCESSING (4500)
      ok(4, 'CREDIT_CARD', 4500, 'CARD'),

      // 6005 READY_TO_SHIP (5600)
      ok(5, 'CREDIT_CARD', 5600, 'CARD'),

      // 6006 HANDED_OVER (2300)
      ok(6, 'CREDIT_CARD', 2300, 'CARD'),

      // 6007 SHIPPED (2200)
      ok(7, 'PROMPTPAY', 2200, 'PROMPTPAY'),

      // 6008 DELIVERED COD (3200)
      ok(8, 'CASH_ON_DELIVERY', 3200, 'COD', 'SETTLED'),

      // 6009 COMPLETE (2800)
      ok(9, 'QR', 2800, 'QR'),

      // 6010 MERCHANT_CANCELED (3100) — จ่ายมาแล้ว
      ok(10, 'CREDIT_CARD', 3100, 'CARD'),

      // 6011 TRANSIT_LACK COD (ยังไม่เก็บ)
      pending(11, 'CASH_ON_DELIVERY', 'COD'),

      // 6012 RE_TRANSIT (1950)
      ok(12, 'PROMPTPAY', 1950, 'PROMPTPAY'),

      // 6013 REFUND_REQUEST (4100)
      ok(13, 'CREDIT_CARD', 4100, 'CARD', 'SETTLED'),

      // 6014 AWAITING_RETURN (2500)
      ok(14, 'QR', 2500, 'QR'),

      // 6015 RECEIVE_RETURN (2550)
      ok(15, 'CREDIT_CARD', 2550, 'CARD'),

      // 6016 RETURN_VERIFIED (2600)
      ok(16, 'CREDIT_CARD', 2600, 'CARD'),

      // 6017 RETURN_FAIL (2650)
      ok(17, 'PROMPTPAY', 2650, 'PROMPTPAY'),

      // 6018 REFUND_REJECTED (4200)
      ok(18, 'CREDIT_CARD', 4200, 'CARD'),

      // 6019 REFUND_APPROVED (4300)
      ok(19, 'PROMPTPAY', 4300, 'PROMPTPAY'),

      // 6020 REFUND_SUCCESS (5100) — คืนเงินแล้วตั้งต้น 0; จะอัปเดต amount_refunded_minor ตอนทำ refund จริง
      ok(20, 'CREDIT_CARD', 5100, 'CARD'),

      // 6021 REFUND_FAIL (4400)
      ok(21, 'QR', 4400, 'QR'),

      // 6022 (4100)
      ok(22, 'QR', 4100, 'QR')
    ])
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete('PAYMENTS', {
      order_id: [
        6001, 6002, 6003, 6004, 6005, 6006, 6007, 6008, 6009, 6010, 6011, 6012,
        6013, 6014, 6015, 6016, 6017, 6018, 6019, 6020, 6021, 6022
      ]
    })
  }
}
