// seeders/2025xxxx-seed-order-status-history.ts
import { QueryInterface } from 'sequelize'

const now = new Date()
const meta = () => JSON.stringify({})

const row = (
  orderId: number,
  fromStatus: string | null,
  toStatus: string,
  by: 'CUSTOMER' | 'MERCHANT' | 'ADMIN' | 'SYSTEM',
  byId: number | null,
  reason: string,
  source: string,
  correlation: string
) => ({
  order_id: orderId,
  from_status: fromStatus,
  to_status: toStatus,
  changed_by_type: by,
  changed_by_id: byId,
  reason,
  source,
  correlation_id: correlation,
  metadata: meta(),
  created_at: now,
  updated_at: now,
  deleted_at: null
})

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkInsert('ORDER_STATUS_HISTORY', [
      // 6001 PENDING
      row(
        6001,
        null,
        'PENDING',
        'CUSTOMER',
        1,
        'Order created',
        'API',
        'req-6001'
      ),

      // 6002 CUSTOMER_CANCELED
      row(
        6002,
        null,
        'PENDING',
        'CUSTOMER',
        1,
        'Order created',
        'API',
        'req-6002-a'
      ),
      row(
        6002,
        'PENDING',
        'CUSTOMER_CANCELED',
        'CUSTOMER',
        1,
        'Customer canceled before payment',
        'WEB',
        'req-6002-b'
      ),

      // 6003 PAID
      row(
        6003,
        null,
        'PENDING',
        'CUSTOMER',
        1,
        'Order created',
        'API',
        'req-6003-a'
      ),
      row(
        6003,
        'PENDING',
        'PAID',
        'SYSTEM',
        0,
        'Payment success',
        'WEBHOOK',
        'txn-6003'
      ),

      // 6004 PROCESSING
      row(
        6004,
        null,
        'PENDING',
        'CUSTOMER',
        1,
        'Order created',
        'API',
        'req-6004-a'
      ),
      row(
        6004,
        'PENDING',
        'PAID',
        'SYSTEM',
        0,
        'Payment success',
        'WEBHOOK',
        'txn-6004'
      ),
      row(
        6004,
        'PAID',
        'PROCESSING',
        'MERCHANT',
        2,
        'Merchant started processing',
        'DASHBOARD',
        'req-6004-b'
      ),

      // 6005 READY_TO_SHIP
      row(
        6005,
        null,
        'PENDING',
        'CUSTOMER',
        1,
        'Order created',
        'API',
        'req-6005-a'
      ),
      row(
        6005,
        'PENDING',
        'PAID',
        'SYSTEM',
        0,
        'Payment success',
        'WEBHOOK',
        'txn-6005'
      ),
      row(
        6005,
        'PAID',
        'PROCESSING',
        'MERCHANT',
        2,
        'Processing',
        'DASHBOARD',
        'req-6005-b'
      ),
      row(
        6005,
        'PROCESSING',
        'READY_TO_SHIP',
        'MERCHANT',
        2,
        'Prepared for shipping',
        'DASHBOARD',
        'req-6005-c'
      ),

      // 6006 HANDED_OVER
      row(
        6006,
        null,
        'PENDING',
        'CUSTOMER',
        1,
        'Order created',
        'API',
        'req-6006-a'
      ),
      row(
        6006,
        'PENDING',
        'PAID',
        'SYSTEM',
        0,
        'Payment success',
        'WEBHOOK',
        'txn-6006'
      ),
      row(
        6006,
        'PAID',
        'PROCESSING',
        'MERCHANT',
        2,
        'Processing',
        'DASHBOARD',
        'req-6006-b'
      ),
      row(
        6006,
        'PROCESSING',
        'READY_TO_SHIP',
        'MERCHANT',
        2,
        'Prepared',
        'DASHBOARD',
        'req-6006-c'
      ),
      row(
        6006,
        'READY_TO_SHIP',
        'HANDED_OVER',
        'MERCHANT',
        2,
        'Handed to courier',
        'DASHBOARD',
        'req-6006-d'
      ),

      // 6007 SHIPPED
      row(
        6007,
        null,
        'PENDING',
        'CUSTOMER',
        1,
        'Order created',
        'API',
        'req-6007-a'
      ),
      row(
        6007,
        'PENDING',
        'PAID',
        'SYSTEM',
        0,
        'Payment success',
        'WEBHOOK',
        'txn-6007'
      ),
      row(
        6007,
        'PAID',
        'PROCESSING',
        'MERCHANT',
        2,
        'Processing',
        'DASHBOARD',
        'req-6007-b'
      ),
      row(
        6007,
        'PROCESSING',
        'READY_TO_SHIP',
        'MERCHANT',
        2,
        'Prepared',
        'DASHBOARD',
        'req-6007-c'
      ),
      row(
        6007,
        'READY_TO_SHIP',
        'HANDED_OVER',
        'MERCHANT',
        2,
        'Handed',
        'DASHBOARD',
        'req-6007-d'
      ),
      row(
        6007,
        'HANDED_OVER',
        'SHIPPED',
        'MERCHANT',
        2,
        'Shipped out',
        'DASHBOARD',
        'req-6007-e'
      ),

      // 6008 DELIVERED
      row(
        6008,
        null,
        'PENDING',
        'CUSTOMER',
        1,
        'Order created',
        'API',
        'req-6008-a'
      ),
      row(
        6008,
        'PENDING',
        'PAID',
        'SYSTEM',
        0,
        'Payment success',
        'WEBHOOK',
        'txn-6008'
      ),
      row(
        6008,
        'PAID',
        'PROCESSING',
        'MERCHANT',
        2,
        'Processing',
        'DASHBOARD',
        'req-6008-b'
      ),
      row(
        6008,
        'PROCESSING',
        'READY_TO_SHIP',
        'MERCHANT',
        2,
        'Prepared',
        'DASHBOARD',
        'req-6008-c'
      ),
      row(
        6008,
        'READY_TO_SHIP',
        'HANDED_OVER',
        'MERCHANT',
        2,
        'Handed',
        'DASHBOARD',
        'req-6008-d'
      ),
      row(
        6008,
        'HANDED_OVER',
        'SHIPPED',
        'MERCHANT',
        2,
        'Shipped',
        'DASHBOARD',
        'req-6008-e'
      ),
      row(
        6008,
        'SHIPPED',
        'DELIVERED',
        'SYSTEM',
        0,
        'Delivered by carrier',
        'SYSTEM',
        'evt-6008-delivered'
      ),

      // 6009 COMPLETE
      row(
        6009,
        null,
        'PENDING',
        'CUSTOMER',
        1,
        'Order created',
        'API',
        'req-6009-a'
      ),
      row(
        6009,
        'PENDING',
        'PAID',
        'SYSTEM',
        0,
        'Payment success',
        'WEBHOOK',
        'txn-6009'
      ),
      row(
        6009,
        'PAID',
        'PROCESSING',
        'MERCHANT',
        2,
        'Processing',
        'DASHBOARD',
        'req-6009-b'
      ),
      row(
        6009,
        'PROCESSING',
        'READY_TO_SHIP',
        'MERCHANT',
        2,
        'Ready',
        'DASHBOARD',
        'req-6009-c'
      ),
      row(
        6009,
        'READY_TO_SHIP',
        'HANDED_OVER',
        'MERCHANT',
        2,
        'Handed',
        'DASHBOARD',
        'req-6009-d'
      ),
      row(
        6009,
        'HANDED_OVER',
        'SHIPPED',
        'MERCHANT',
        2,
        'Shipped',
        'DASHBOARD',
        'req-6009-e'
      ),
      row(
        6009,
        'SHIPPED',
        'DELIVERED',
        'SYSTEM',
        0,
        'Delivered',
        'SYSTEM',
        'evt-6009-delivered'
      ),
      row(
        6009,
        'DELIVERED',
        'COMPLETE',
        'CUSTOMER',
        1,
        'Customer confirmed',
        'APP',
        'req-6009-complete'
      ),

      // 6010 MERCHANT_CANCELED
      row(
        6010,
        null,
        'PENDING',
        'CUSTOMER',
        1,
        'Order created',
        'API',
        'req-6010-a'
      ),
      row(
        6010,
        'PENDING',
        'PAID',
        'SYSTEM',
        0,
        'Payment success',
        'WEBHOOK',
        'txn-6010'
      ),
      row(
        6010,
        'PAID',
        'MERCHANT_CANCELED',
        'MERCHANT',
        2,
        'Merchant canceled after payment',
        'DASHBOARD',
        'req-6010-cancel'
      ),

      // 6011 TRANSIT_LACK
      row(
        6011,
        null,
        'PENDING',
        'CUSTOMER',
        1,
        'Order created',
        'API',
        'req-6011-a'
      ),
      row(
        6011,
        'PENDING',
        'PAID',
        'SYSTEM',
        0,
        'Payment confirmed (COD order)',
        'WEBHOOK',
        'txn-6011'
      ),
      row(
        6011,
        'PAID',
        'PROCESSING',
        'MERCHANT',
        2,
        'Processing',
        'DASHBOARD',
        'req-6011-b'
      ),
      row(
        6011,
        'PROCESSING',
        'READY_TO_SHIP',
        'MERCHANT',
        2,
        'Ready',
        'DASHBOARD',
        'req-6011-c'
      ),
      row(
        6011,
        'READY_TO_SHIP',
        'HANDED_OVER',
        'MERCHANT',
        2,
        'Handed',
        'DASHBOARD',
        'req-6011-d'
      ),
      row(
        6011,
        'HANDED_OVER',
        'SHIPPED',
        'MERCHANT',
        2,
        'Shipped',
        'DASHBOARD',
        'req-6011-e'
      ),
      row(
        6011,
        'SHIPPED',
        'TRANSIT_LACK',
        'SYSTEM',
        0,
        'Transit failed',
        'SYSTEM',
        'evt-6011-fail'
      ),

      // 6012 RE_TRANSIT
      row(
        6012,
        null,
        'PENDING',
        'CUSTOMER',
        1,
        'Order created',
        'API',
        'req-6012-a'
      ),
      row(
        6012,
        'PENDING',
        'PAID',
        'SYSTEM',
        0,
        'Payment success',
        'WEBHOOK',
        'txn-6012'
      ),
      row(
        6012,
        'PAID',
        'PROCESSING',
        'MERCHANT',
        2,
        'Processing',
        'DASHBOARD',
        'req-6012-b'
      ),
      row(
        6012,
        'PROCESSING',
        'READY_TO_SHIP',
        'MERCHANT',
        2,
        'Ready',
        'DASHBOARD',
        'req-6012-c'
      ),
      row(
        6012,
        'READY_TO_SHIP',
        'HANDED_OVER',
        'MERCHANT',
        2,
        'Handed',
        'DASHBOARD',
        'req-6012-d'
      ),
      row(
        6012,
        'HANDED_OVER',
        'SHIPPED',
        'MERCHANT',
        2,
        'Shipped',
        'DASHBOARD',
        'req-6012-e'
      ),
      row(
        6012,
        'SHIPPED',
        'TRANSIT_LACK',
        'SYSTEM',
        0,
        'Transit issue',
        'SYSTEM',
        'evt-6012-issue'
      ),
      row(
        6012,
        'TRANSIT_LACK',
        'RE_TRANSIT',
        'MERCHANT',
        2,
        'Reschedule delivery',
        'DASHBOARD',
        'req-6012-retransit'
      ),

      // 6013 REFUND_REQUEST (from PAID)
      row(
        6013,
        null,
        'PENDING',
        'CUSTOMER',
        1,
        'Order created',
        'API',
        'req-6013-a'
      ),
      row(
        6013,
        'PENDING',
        'PAID',
        'SYSTEM',
        0,
        'Payment success',
        'WEBHOOK',
        'txn-6013'
      ),
      row(
        6013,
        'PAID',
        'REFUND_REQUEST',
        'CUSTOMER',
        1,
        'Customer requested refund',
        'APP',
        'req-6013-refund'
      ),

      // 6014 AWAITING_RETURN (from DELIVERED)
      row(
        6014,
        null,
        'PENDING',
        'CUSTOMER',
        1,
        'Order created',
        'API',
        'req-6014-a'
      ),
      row(
        6014,
        'PENDING',
        'PAID',
        'SYSTEM',
        0,
        'Payment success',
        'WEBHOOK',
        'txn-6014'
      ),
      row(
        6014,
        'PAID',
        'PROCESSING',
        'MERCHANT',
        2,
        'Processing',
        'DASHBOARD',
        'req-6014-b'
      ),
      row(
        6014,
        'PROCESSING',
        'READY_TO_SHIP',
        'MERCHANT',
        2,
        'Ready',
        'DASHBOARD',
        'req-6014-c'
      ),
      row(
        6014,
        'READY_TO_SHIP',
        'HANDED_OVER',
        'MERCHANT',
        2,
        'Handed',
        'DASHBOARD',
        'req-6014-d'
      ),
      row(
        6014,
        'HANDED_OVER',
        'SHIPPED',
        'MERCHANT',
        2,
        'Shipped',
        'DASHBOARD',
        'req-6014-e'
      ),
      row(
        6014,
        'SHIPPED',
        'DELIVERED',
        'SYSTEM',
        0,
        'Delivered',
        'SYSTEM',
        'evt-6014-delivered'
      ),
      row(
        6014,
        'DELIVERED',
        'REFUND_REQUEST',
        'CUSTOMER',
        1,
        'Refund requested',
        'APP',
        'req-6014-refund'
      ),
      row(
        6014,
        'REFUND_REQUEST',
        'AWAITING_RETURN',
        'MERCHANT',
        2,
        'Return required',
        'DASHBOARD',
        'req-6014-await'
      ),

      // 6015 RECEIVE_RETURN
      row(
        6015,
        null,
        'PENDING',
        'CUSTOMER',
        1,
        'Order created',
        'API',
        'req-6015-a'
      ),
      row(
        6015,
        'PENDING',
        'PAID',
        'SYSTEM',
        0,
        'Payment success',
        'WEBHOOK',
        'txn-6015'
      ),
      row(
        6015,
        'PAID',
        'PROCESSING',
        'MERCHANT',
        2,
        'Processing',
        'DASHBOARD',
        'req-6015-b'
      ),
      row(
        6015,
        'PROCESSING',
        'READY_TO_SHIP',
        'MERCHANT',
        2,
        'Ready',
        'DASHBOARD',
        'req-6015-c'
      ),
      row(
        6015,
        'READY_TO_SHIP',
        'HANDED_OVER',
        'MERCHANT',
        2,
        'Handed',
        'DASHBOARD',
        'req-6015-d'
      ),
      row(
        6015,
        'HANDED_OVER',
        'SHIPPED',
        'MERCHANT',
        2,
        'Shipped',
        'DASHBOARD',
        'req-6015-e'
      ),
      row(
        6015,
        'SHIPPED',
        'DELIVERED',
        'SYSTEM',
        0,
        'Delivered',
        'SYSTEM',
        'evt-6015-delivered'
      ),
      row(
        6015,
        'DELIVERED',
        'REFUND_REQUEST',
        'CUSTOMER',
        1,
        'Refund requested',
        'APP',
        'req-6015-refund'
      ),
      row(
        6015,
        'REFUND_REQUEST',
        'AWAITING_RETURN',
        'MERCHANT',
        2,
        'Return required',
        'DASHBOARD',
        'req-6015-await'
      ),
      row(
        6015,
        'AWAITING_RETURN',
        'RECEIVE_RETURN',
        'MERCHANT',
        2,
        'Return parcel received',
        'DASHBOARD',
        'req-6015-received'
      ),

      // 6016 RETURN_VERIFIED
      row(
        6016,
        null,
        'PENDING',
        'CUSTOMER',
        1,
        'Order created',
        'API',
        'req-6016-a'
      ),
      row(
        6016,
        'PENDING',
        'PAID',
        'SYSTEM',
        0,
        'Payment success',
        'WEBHOOK',
        'txn-6016'
      ),
      row(
        6016,
        'PAID',
        'PROCESSING',
        'MERCHANT',
        2,
        'Processing',
        'DASHBOARD',
        'req-6016-b'
      ),
      row(
        6016,
        'PROCESSING',
        'READY_TO_SHIP',
        'MERCHANT',
        2,
        'Ready',
        'DASHBOARD',
        'req-6016-c'
      ),
      row(
        6016,
        'READY_TO_SHIP',
        'HANDED_OVER',
        'MERCHANT',
        2,
        'Handed',
        'DASHBOARD',
        'req-6016-d'
      ),
      row(
        6016,
        'HANDED_OVER',
        'SHIPPED',
        'MERCHANT',
        2,
        'Shipped',
        'DASHBOARD',
        'req-6016-e'
      ),
      row(
        6016,
        'SHIPPED',
        'DELIVERED',
        'SYSTEM',
        0,
        'Delivered',
        'SYSTEM',
        'evt-6016-delivered'
      ),
      row(
        6016,
        'DELIVERED',
        'REFUND_REQUEST',
        'CUSTOMER',
        1,
        'Refund requested',
        'APP',
        'req-6016-refund'
      ),
      row(
        6016,
        'REFUND_REQUEST',
        'AWAITING_RETURN',
        'MERCHANT',
        2,
        'Return required',
        'DASHBOARD',
        'req-6016-await'
      ),
      row(
        6016,
        'AWAITING_RETURN',
        'RECEIVE_RETURN',
        'MERCHANT',
        2,
        'Return parcel received',
        'DASHBOARD',
        'req-6016-received'
      ),
      row(
        6016,
        'RECEIVE_RETURN',
        'RETURN_VERIFIED',
        'MERCHANT',
        2,
        'Return inspected OK',
        'DASHBOARD',
        'req-6016-verified'
      ),

      // 6017 RETURN_FAIL
      row(
        6017,
        null,
        'PENDING',
        'CUSTOMER',
        1,
        'Order created',
        'API',
        'req-6017-a'
      ),
      row(
        6017,
        'PENDING',
        'PAID',
        'SYSTEM',
        0,
        'Payment success',
        'WEBHOOK',
        'txn-6017'
      ),
      row(
        6017,
        'PAID',
        'PROCESSING',
        'MERCHANT',
        2,
        'Processing',
        'DASHBOARD',
        'req-6017-b'
      ),
      row(
        6017,
        'PROCESSING',
        'READY_TO_SHIP',
        'MERCHANT',
        2,
        'Ready',
        'DASHBOARD',
        'req-6017-c'
      ),
      row(
        6017,
        'READY_TO_SHIP',
        'HANDED_OVER',
        'MERCHANT',
        2,
        'Handed',
        'DASHBOARD',
        'req-6017-d'
      ),
      row(
        6017,
        'HANDED_OVER',
        'SHIPPED',
        'MERCHANT',
        2,
        'Shipped',
        'DASHBOARD',
        'req-6017-e'
      ),
      row(
        6017,
        'SHIPPED',
        'DELIVERED',
        'SYSTEM',
        0,
        'Delivered',
        'SYSTEM',
        'evt-6017-delivered'
      ),
      row(
        6017,
        'DELIVERED',
        'REFUND_REQUEST',
        'CUSTOMER',
        1,
        'Refund requested',
        'APP',
        'req-6017-refund'
      ),
      row(
        6017,
        'REFUND_REQUEST',
        'AWAITING_RETURN',
        'MERCHANT',
        2,
        'Return required',
        'DASHBOARD',
        'req-6017-await'
      ),
      row(
        6017,
        'AWAITING_RETURN',
        'RETURN_FAIL',
        'MERCHANT',
        2,
        'Return failed / not eligible',
        'DASHBOARD',
        'req-6017-fail'
      ),

      // 6018 REFUND_REJECTED
      row(
        6018,
        null,
        'PENDING',
        'CUSTOMER',
        1,
        'Order created',
        'API',
        'req-6018-a'
      ),
      row(
        6018,
        'PENDING',
        'PAID',
        'SYSTEM',
        0,
        'Payment success',
        'WEBHOOK',
        'txn-6018'
      ),
      row(
        6018,
        'PAID',
        'REFUND_REQUEST',
        'CUSTOMER',
        1,
        'Refund requested',
        'APP',
        'req-6018-refund'
      ),
      row(
        6018,
        'REFUND_REQUEST',
        'REFUND_REJECTED',
        'MERCHANT',
        2,
        'Rejected by merchant',
        'DASHBOARD',
        'req-6018-reject'
      ),

      // 6019 REFUND_APPROVED
      row(
        6019,
        null,
        'PENDING',
        'CUSTOMER',
        1,
        'Order created',
        'API',
        'req-6019-a'
      ),
      row(
        6019,
        'PENDING',
        'PAID',
        'SYSTEM',
        0,
        'Payment success',
        'WEBHOOK',
        'txn-6019'
      ),
      row(
        6019,
        'PAID',
        'REFUND_REQUEST',
        'CUSTOMER',
        1,
        'Refund requested',
        'APP',
        'req-6019-refund'
      ),
      row(
        6019,
        'REFUND_REQUEST',
        'REFUND_APPROVED',
        'MERCHANT',
        2,
        'Approved by merchant',
        'DASHBOARD',
        'req-6019-approve'
      ),

      // 6020 REFUND_SUCCESS
      row(
        6020,
        null,
        'PENDING',
        'CUSTOMER',
        1,
        'Order created',
        'API',
        'req-6020-a'
      ),
      row(
        6020,
        'PENDING',
        'PAID',
        'SYSTEM',
        0,
        'Payment success',
        'WEBHOOK',
        'txn-6020'
      ),
      row(
        6020,
        'PAID',
        'REFUND_REQUEST',
        'CUSTOMER',
        1,
        'Refund requested',
        'APP',
        'req-6020-refund'
      ),
      row(
        6020,
        'REFUND_REQUEST',
        'REFUND_APPROVED',
        'MERCHANT',
        2,
        'Approved by merchant',
        'DASHBOARD',
        'req-6020-approve'
      ),
      row(
        6020,
        'REFUND_APPROVED',
        'REFUND_SUCCESS',
        'SYSTEM',
        0,
        'Gateway refunded',
        'PAYMENT_GATEWAY',
        'txn-6020-refund'
      ),

      // 6021 REFUND_FAIL
      row(
        6021,
        null,
        'PENDING',
        'CUSTOMER',
        1,
        'Order created',
        'API',
        'req-6021-a'
      ),
      row(
        6021,
        'PENDING',
        'PAID',
        'SYSTEM',
        0,
        'Payment success',
        'WEBHOOK',
        'txn-6021'
      ),
      row(
        6021,
        'PAID',
        'REFUND_REQUEST',
        'CUSTOMER',
        1,
        'Refund requested',
        'APP',
        'req-6021-refund'
      ),
      row(
        6021,
        'REFUND_REQUEST',
        'REFUND_APPROVED',
        'MERCHANT',
        2,
        'Approved by merchant',
        'DASHBOARD',
        'req-6021-approve'
      ),
      row(
        6021,
        'REFUND_APPROVED',
        'REFUND_FAIL',
        'SYSTEM',
        0,
        'Gateway refund failed',
        'PAYMENT_GATEWAY',
        'txn-6021-refund-fail'
      ),

      // 6022 REFUND_REQUEST (อีกเคส)
      row(
        6022,
        null,
        'PENDING',
        'CUSTOMER',
        1,
        'Order created',
        'API',
        'req-6022-a'
      ),
      row(
        6022,
        'PENDING',
        'PAID',
        'SYSTEM',
        0,
        'Payment success',
        'WEBHOOK',
        'txn-6022'
      ),
      row(
        6022,
        'PAID',
        'REFUND_REQUEST',
        'CUSTOMER',
        1,
        'Refund requested',
        'APP',
        'req-6022-refund'
      )
    ])
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete('ORDER_STATUS_HISTORY', {
      order_id: [
        6001, 6002, 6003, 6004, 6005, 6006, 6007, 6008, 6009, 6010, 6011, 6012,
        6013, 6014, 6015, 6016, 6017, 6018, 6019, 6020, 6021, 6022
      ]
    })
  }
}
