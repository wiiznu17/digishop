import { Order, OrderStatus, Store, User } from '@digishop/db'
import {
  Op,
  fn,
  col,
  literal,
  WhereOptions,
  Order as SequelizeOrderType
} from 'sequelize'

const ORDER_BY_DATE_ASC: SequelizeOrderType = [
  [fn('DATE', col('Order.created_at')), 'ASC']
]

export class DashboardRepository {
  async getKpisOrdersData(where: WhereOptions) {
    return Order.findAll({
      attributes: [
        [fn('SUM', col('grand_total_minor')), 'gmvMinor'],
        [fn('COUNT', col('id')), 'orders'],
        [fn('COUNT', fn('DISTINCT', col('store_id'))), 'activeStores']
      ],
      where,
      raw: true
    })
  }

  async getKpisNewUsers(where: WhereOptions) {
    return User.count({ where })
  }

  async getDailyTotals(where: WhereOptions) {
    return Order.findAll({
      attributes: [
        [fn('DATE', col('Order.created_at')), 'day'],
        [fn('SUM', col('Order.grand_total_minor')), 'gmvMinor'],
        [fn('COUNT', col('Order.id')), 'orders']
      ],
      where,
      group: [fn('DATE', col('Order.created_at'))],
      order: ORDER_BY_DATE_ASC,
      raw: true
    })
  }

  async getDailyByStatus(where: WhereOptions) {
    return Order.findAll({
      attributes: [
        [fn('DATE', col('Order.created_at')), 'day'],
        ['status', 'status'],
        [fn('COUNT', col('Order.id')), 'c']
      ],
      where,
      group: [fn('DATE', col('Order.created_at')), col('Order.status')],
      order: ORDER_BY_DATE_ASC,
      raw: true
    })
  }

  async getStatusDist(where: WhereOptions) {
    return Order.findAll({
      attributes: [
        ['status', 'name'],
        [fn('COUNT', col('Order.id')), 'value']
      ],
      where,
      group: [col('Order.status')],
      raw: true
    })
  }

  async getTopStores(where: WhereOptions) {
    return Order.findAll({
      attributes: [
        [fn('SUM', col('Order.grand_total_minor')), 'gmvMinor'],
        [
          fn(
            'COALESCE',
            col('store.store_name'),
            col('Order.store_name_snapshot')
          ),
          'name'
        ]
      ],
      include: [{ model: Store, as: 'store', attributes: [], required: false }],
      where,
      group: [
        col('store.id'),
        col('store.store_name'),
        col('Order.store_name_snapshot')
      ],
      order: [[literal('gmvMinor'), 'DESC']],
      limit: 10,
      subQuery: false,
      raw: true
    })
  }
}

export const dashboardRepository = new DashboardRepository()
