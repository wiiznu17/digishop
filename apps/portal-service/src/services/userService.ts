import { Op, col, fn, where as sequelizeWhere, WhereOptions } from 'sequelize'
import { BadRequestError, NotFoundError } from '../errors/AppError'
import { userRepository } from '../repositories/userRepository'

const asInt = (value: any, defaultValue: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0
    ? Math.floor(parsed)
    : defaultValue
}

const asDate = (value?: string) => {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

const likeify = (q: string) => `%${q.replace(/[%_]/g, '\\$&')}%`

const asMoneyMinor = (value: any) => {
  if (value === undefined || value === null || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0
    ? Math.round(parsed * 100)
    : null
}

function lastNMonthsLabels(n: number) {
  const result: string[] = []
  const base = new Date()
  base.setDate(1)

  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base)
    d.setMonth(d.getMonth() - i)
    const y = d.getFullYear()
    const m = `${d.getMonth() + 1}`.padStart(2, '0')
    result.push(`${y}-${m}`)
  }
  return result
}

export class UserService {
  async listUsers(params: Record<string, string | undefined>) {
    const {
      q = '',
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortDir = 'desc'
    } = params

    const page = Math.max(asInt(params.page, 1), 1)
    const pageSize = Math.min(Math.max(asInt(params.pageSize, 20), 1), 100)
    const offset = (page - 1) * pageSize

    const whereClause: WhereOptions = {}

    const from = asDate(dateFrom)
    const to = asDate(dateTo)
    if (from && to)
      whereClause['createdAt' as any] = { [Op.between]: [from, to] }
    else if (from) whereClause['createdAt' as any] = { [Op.gte]: from }
    else if (to) whereClause['createdAt' as any] = { [Op.lte]: to }

    if (q && q.trim()) {
      const term = likeify(q.trim())
      Object.assign(whereClause, {
        [Op.or]: [
          { email: { [Op.like]: term } },
          { firstName: { [Op.like]: term } },
          { lastName: { [Op.like]: term } }
        ]
      })
    }

    const spentMinMinor = asMoneyMinor(params.spentMin)
    const spentMaxMinor = asMoneyMinor(params.spentMax)

    const orderSumExpression = fn(
      'COALESCE',
      fn('SUM', col('checkout->orders.grand_total_minor')),
      0
    )

    const havingAnd: any[] = []
    if (spentMinMinor !== null) {
      havingAnd.push(
        sequelizeWhere(orderSumExpression, { [Op.gte]: spentMinMinor })
      )
    }
    if (spentMaxMinor !== null) {
      havingAnd.push(
        sequelizeWhere(orderSumExpression, { [Op.lte]: spentMaxMinor })
      )
    }

    const orderCountExpression = fn('COUNT', col('checkout->orders.id'))

    const direction = String(sortDir).toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
    const orderBy: any[] = []
    if (sortBy === 'name') {
      orderBy.push(
        [col('User.first_name'), direction],
        [col('User.last_name'), direction]
      )
    } else if (sortBy === 'email') {
      orderBy.push([col('User.email'), direction])
    } else {
      orderBy.push([col('User.created_at'), direction])
    }

    const attributes = [
      'id',
      [col('User.email'), 'email'],
      [col('User.first_name'), 'firstName'],
      [col('User.last_name'), 'lastName'],
      [col('User.created_at'), 'createdAt'],
      [orderSumExpression, 'orderTotalMinor'],
      [orderCountExpression, 'orderCount']
    ]

    const group = [
      col('User.id'),
      col('User.email'),
      col('User.first_name'),
      col('User.last_name'),
      col('User.created_at'),
      col('store.id'),
      col('store.uuid'),
      col('store.store_name'),
      col('store.status')
    ]

    const having = havingAnd.length ? { [Op.and]: havingAnd } : undefined

    const { rows, count } = await userRepository.findAndCountUsers(
      whereClause,
      having,
      orderBy,
      offset,
      pageSize,
      attributes,
      group
    )

    const data = rows.map((u: any) => ({
      id: u.get('id'),
      name: [u.get('firstName'), u.get('lastName')].filter(Boolean).join(' '),
      email: u.get('email'),
      createdAt: u.get('createdAt'),
      orderTotalMinor: Number(u.get('orderTotalMinor') ?? 0),
      orderCount: Number(u.get('orderCount') ?? 0),
      store: u.store
        ? {
            id: u.store.get('id'),
            uuid: u.store.get('uuid'),
            storeName: u.store.get('storeName'),
            status: u.store.get('status')
          }
        : null
    }))

    const total = Array.isArray(count) ? count.length : (count as number)

    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
      }
    }
  }

  async suggestUsers(q: string) {
    const queryText = String(q || '').trim()
    if (!queryText) return []

    const term = likeify(queryText)
    const where: WhereOptions = {
      [Op.or]: [
        { email: { [Op.like]: term } },
        { firstName: { [Op.like]: term } },
        { lastName: { [Op.like]: term } }
      ]
    }

    const users = await userRepository.suggestUsers(where)

    return users.map((u: any) => ({
      id: u.get('id'),
      name: [u.get('firstName'), u.get('lastName')].filter(Boolean).join(' '),
      email: u.get('email')
    }))
  }

  async getUserDetail(id: number) {
    if (!Number.isFinite(id)) throw new BadRequestError('Invalid id')

    const userRow: any = await userRepository.findUserDetail(id)
    if (!userRow) throw new NotFoundError('Not found')

    const addressRows = await userRepository.findUserAddresses(id)
    const summaryRows = await userRepository.findUserOrderSummary(id)
    const summary = summaryRows[0] || {
      totalOrders: 0,
      totalSpentMinor: 0,
      averageOrderMinor: 0,
      lastOrderAt: null
    }

    const latestOrders = await userRepository.findLatestOrders(id)

    const monthExpression = fn('DATE_FORMAT', col('Order.created_at'), '%Y-%m')
    const monthlyAggregateRows = await userRepository.findMonthlyOrderAggregate(
      id,
      monthExpression
    )

    const monthlyMap = new Map<
      string,
      { totalSpentMinor: number; orderCount: number }
    >()
    for (const r of monthlyAggregateRows as any[]) {
      monthlyMap.set(String(r.month), {
        totalSpentMinor: Number(r.totalSpentMinor ?? 0),
        orderCount: Number(r.orderCount ?? 0)
      })
    }

    const monthLabels = lastNMonthsLabels(12)
    const monthly = monthLabels.map((label) => ({
      month: label,
      totalSpentMinor: monthlyMap.get(label)?.totalSpentMinor ?? 0,
      orderCount: monthlyMap.get(label)?.orderCount ?? 0
    }))

    const [reviewsCount, disputesCount] = await Promise.all([
      userRepository.countUserReviews(id),
      userRepository.countUserDisputes(id)
    ])

    return {
      id: userRow.get('id'),
      name: [userRow.get('firstName'), userRow.get('lastName')]
        .filter(Boolean)
        .join(' '),
      email: userRow.get('email'),
      createdAt: userRow.get('createdAt'),
      orderTotalMinor: Number((summary as any).totalSpentMinor ?? 0),
      orderCount: Number((summary as any).totalOrders ?? 0),
      store: userRow.store
        ? {
            id: userRow.store.get('id'),
            uuid: userRow.store.get('uuid'),
            storeName: userRow.store.get('storeName'),
            status: userRow.store.get('status')
          }
        : null,
      addresses: addressRows.map((a: any) => ({
        id: a.get('id'),
        recipientName: a.get('recipientName'),
        phone: a.get('phone'),
        addressNumber: a.get('addressNumber'),
        building: a.get('building'),
        subStreet: a.get('subStreet'),
        street: a.get('street'),
        subdistrict: a.get('subdistrict'),
        district: a.get('district'),
        province: a.get('province'),
        postalCode: a.get('postalCode'),
        country: a.get('country'),
        isDefault: a.get('isDefault'),
        addressType: a.get('addressType'),
        createdAt: a.get('createdAt')
      })),
      orders: {
        summary: {
          totalOrders: Number((summary as any).totalOrders ?? 0),
          totalSpentMinor: Number((summary as any).totalSpentMinor ?? 0),
          averageOrderMinor: Number((summary as any).averageOrderMinor ?? 0),
          lastOrderAt: (summary as any).lastOrderAt ?? null
        },
        latest: latestOrders.map((o: any) => ({
          id: o.get('id'),
          reference: o.get('reference'),
          orderCode: o.checkout?.get('orderCode'),
          status: o.get('status'),
          grandTotalMinor: Number(o.get('grandTotalMinor') ?? 0),
          currencyCode: o.get('currencyCode'),
          storeNameSnapshot: o.get('storeNameSnapshot'),
          createdAt: o.get('createdAt')
        })),
        monthly
      },
      reviewsCount,
      disputesCount
    }
  }
}

export const userService = new UserService()
