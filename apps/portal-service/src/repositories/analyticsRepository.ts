import { CheckOut, Order, RefundOrder, Store } from '@digishop/db'
import { Op, fn, col, literal, WhereOptions } from 'sequelize'

export class AnalyticsRepository {
  async getKpisTotals(where: WhereOptions) {
    return Order.findAll({
      attributes: [
        [fn('SUM', col('grand_total_minor')), 'gmvMinor'],
        [fn('COUNT', col('id')), 'orders'],
        [
          fn(
            'SUM',
            literal(
              "CASE WHEN `Order`.`status` IN ('PAID','PROCESSING','SHIPPED','DELIVERED') THEN 1 ELSE 0 END"
            )
          ),
          'paidOrders'
        ],
        [
          fn(
            'SUM',
            literal("CASE WHEN `Order`.`status`='CANCELLED' THEN 1 ELSE 0 END")
          ),
          'cancelOrders'
        ]
      ],
      where,
      raw: true
    })
  }

  async getKpisRefunds(where: WhereOptions) {
    return RefundOrder.findAll({
      attributes: [[fn('COUNT', col('id')), 'refunds']],
      where,
      raw: true
    })
  }

  async getKpisRepeatRows(where: WhereOptions) {
    return CheckOut.findAll({
      attributes: [
        [fn('COUNT', col('id')), 'c'],
        [col('customer_id'), 'customerId']
      ],
      where,
      group: [col('customer_id')],
      raw: true
    })
  }

  async getTrends(where: WhereOptions) {
    return Order.findAll({
      attributes: [
        [fn('DATE', col('created_at')), 'day'],
        [fn('SUM', col('grand_total_minor')), 'gmvMinor'],
        [fn('COUNT', col('id')), 'orders']
      ],
      where,
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true
    })
  }

  async getStatusDist(where: WhereOptions) {
    return Order.findAll({
      attributes: [
        ['status', 'name'],
        [fn('COUNT', col('id')), 'value']
      ],
      where,
      group: [col('status')],
      raw: true
    })
  }

  async getStoreLeaderboard(
    baseWhere: WhereOptions,
    nameFilter?: WhereOptions
  ) {
    const attributes = [
      [
        fn(
          'COALESCE',
          col('store.store_name'),
          col('Order.store_name_snapshot')
        ),
        'name'
      ],
      [fn('SUM', col('Order.grand_total_minor')), 'gmvMinor'],
      [fn('COUNT', col('Order.id')), 'orders'],
      [fn('COALESCE', col('store.id'), literal('NULL')), 'storeId']
    ] as const

    return Order.findAll({
      attributes: [...attributes],
      include: [{ model: Store, as: 'store', required: false, attributes: [] }],
      where: nameFilter ? { ...baseWhere, ...nameFilter } : baseWhere,
      group: [
        col('store.id'),
        col('store.store_name'),
        col('Order.store_name_snapshot')
      ],
      raw: true
    })
  }
}

export const analyticsRepository = new AnalyticsRepository()
