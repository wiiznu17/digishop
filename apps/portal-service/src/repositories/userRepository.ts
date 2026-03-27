import {
  Address,
  CheckOut,
  Dispute,
  Order,
  Review,
  Store,
  User
} from '@digishop/db'
import { Op, col, fn, WhereOptions } from 'sequelize'

export class UserRepository {
  async findAndCountUsers(
    where: WhereOptions,
    having: any,
    orderBy: any,
    offset: number,
    limit: number,
    attributes: any,
    group: any
  ) {
    return User.findAndCountAll({
      where,
      include: [
        {
          model: Store,
          as: 'store',
          required: false,
          attributes: ['id', 'uuid', 'storeName', 'status']
        },
        {
          model: CheckOut,
          as: 'checkout',
          required: false,
          attributes: [],
          include: [
            {
              model: Order,
              as: 'orders',
              required: false,
              attributes: []
            }
          ]
        }
      ],
      attributes,
      group,
      having,
      order: orderBy,
      limit,
      offset,
      subQuery: false,
      distinct: true
    })
  }

  async suggestUsers(where: WhereOptions) {
    return User.findAll({
      where,
      attributes: [
        'id',
        ['email', 'email'],
        [col('first_name'), 'firstName'],
        [col('last_name'), 'lastName']
      ],
      limit: 8,
      order: [[col('created_at'), 'DESC']]
    })
  }

  async findUserDetail(id: number) {
    return User.findOne({
      where: { id },
      include: [
        {
          model: Store,
          as: 'store',
          required: false,
          attributes: [
            'id',
            'uuid',
            ['store_name', 'storeName'],
            ['status', 'status']
          ]
        }
      ],
      attributes: [
        'id',
        ['email', 'email'],
        [col('first_name'), 'firstName'],
        [col('last_name'), 'lastName'],
        ['created_at', 'createdAt']
      ]
    })
  }

  async findUserAddresses(userId: number) {
    return Address.findAll({
      where: { userId },
      attributes: [
        'id',
        'recipientName',
        'phone',
        'addressNumber',
        'building',
        'subStreet',
        'street',
        'subdistrict',
        'district',
        'province',
        'postalCode',
        'country',
        'isDefault',
        'addressType',
        ['created_at', 'createdAt']
      ],
      order: [
        [col('is_default'), 'DESC'],
        [col('created_at'), 'DESC']
      ]
    })
  }

  async findUserOrderSummary(customerId: number) {
    return Order.findAll({
      include: [
        {
          model: CheckOut,
          as: 'checkout',
          required: true,
          attributes: [],
          where: { customerId }
        }
      ],
      attributes: [
        [fn('COUNT', col('Order.id')), 'totalOrders'],
        [
          fn('COALESCE', fn('SUM', col('Order.grand_total_minor')), 0),
          'totalSpentMinor'
        ],
        [
          fn('COALESCE', fn('AVG', col('Order.grand_total_minor')), 0),
          'averageOrderMinor'
        ],
        [fn('MAX', col('Order.created_at')), 'lastOrderAt']
      ],
      raw: true
    })
  }

  async findLatestOrders(customerId: number) {
    return Order.findAll({
      include: [
        {
          model: CheckOut,
          as: 'checkout',
          required: true,
          attributes: ['orderCode'],
          where: { customerId }
        }
      ],
      attributes: [
        'id',
        'reference',
        'status',
        'grandTotalMinor',
        'currencyCode',
        'storeNameSnapshot',
        ['created_at', 'createdAt']
      ],
      order: [[col('Order.created_at'), 'DESC']],
      limit: 10
    })
  }

  async findMonthlyOrderAggregate(customerId: number, monthExpression: any) {
    return Order.findAll({
      include: [
        {
          model: CheckOut,
          as: 'checkout',
          required: true,
          attributes: [],
          where: { customerId }
        }
      ],
      attributes: [
        [monthExpression, 'month'],
        [
          fn('COALESCE', fn('SUM', col('Order.grand_total_minor')), 0),
          'totalSpentMinor'
        ],
        [fn('COUNT', col('Order.id')), 'orderCount']
      ],
      group: [monthExpression],
      order: [[monthExpression, 'DESC']],
      limit: 18,
      raw: true
    })
  }

  async countUserReviews(userId: number) {
    return Review.count({ where: { userId } })
  }

  async countUserDisputes(customerId: number) {
    return Dispute.count({ where: { customerId } })
  }
}

export const userRepository = new UserRepository()
