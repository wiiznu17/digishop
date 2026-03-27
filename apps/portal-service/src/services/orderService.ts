import { Op, col } from 'sequelize'
import { CheckOut, ReturnShipmentStatus } from '@digishop/db'
import { AppError, BadRequestError, NotFoundError } from '../errors/AppError'
import { orderRepository } from '../repositories/orderRepository'

const asInt = (v: any, d: number) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : d
}
const asDate = (v?: string) =>
  v && !Number.isNaN(new Date(v).getTime()) ? new Date(v) : null
const escapeLike = (s: string) => s.replace(/[%_]/g, '\\$&')

type SnapshotStat = {
  email: string
  orderCount: number
  lastOrderedAt: Date | null
}
type SuggestEmail = {
  customerId: number
  currentEmail: string
  customerName: string | null
  snapshotsEmail: string[]
  snapshotStats: SnapshotStat[]
  totalOrderCount: number
  lastOrderedAt: Date | null
}

export class OrderService {
  async suggestOrders(q: string) {
    const raw = String(q || '').trim()
    if (!raw) return []
    const likeStart = `${escapeLike(raw)}%`
    return orderRepository.findSuggestOrders(likeStart)
  }

  async suggestCustomerEmails(q: string) {
    const raw = String(q || '').trim()
    if (!raw) return []

    const likeStart = `${escapeLike(raw)}%`
    const users = await orderRepository.findUsersByEmailLike(likeStart)

    if (!users.length) return []

    const userIds = users.map((u: any) => Number(u.id))
    const perEmailAgg =
      await orderRepository.aggregateOrderEmailsForUsers(userIds)
    const perUserTotals =
      await orderRepository.aggregateUserOrderTotals(userIds)

    const totalsMap = new Map<
      number,
      { totalOrderCount: number; lastOrderedAt: Date | null }
    >(
      perUserTotals.map((t: any) => [
        Number(t.customerId),
        {
          totalOrderCount: Number(t.totalOrderCount ?? 0),
          lastOrderedAt: (t.lastOrderedAt as Date) ?? null
        }
      ])
    )

    const statsMap = new Map<number, SnapshotStat[]>()
    for (const r of perEmailAgg as any[]) {
      const cid = Number(r.customerId)
      const arr = statsMap.get(cid) ?? []
      arr.push({
        email: String(r.email),
        orderCount: Number(r.orderCount ?? 0),
        lastOrderedAt: (r.lastOrderedAt as Date) ?? null
      })
      statsMap.set(cid, arr)
    }

    const result: SuggestEmail[] = (users as any[]).map((u) => {
      const cid = Number(u.id)
      const stats = (statsMap.get(cid) ?? []).sort((a, b) => {
        const ta = a.lastOrderedAt ? new Date(a.lastOrderedAt).getTime() : 0
        const tb = b.lastOrderedAt ? new Date(b.lastOrderedAt).getTime() : 0
        return tb - ta
      })
      const totals = totalsMap.get(cid) ?? {
        totalOrderCount: 0,
        lastOrderedAt: null
      }
      return {
        customerId: cid,
        currentEmail: String(u.currentEmail),
        customerName:
          [u.firstName, u.middleName, u.lastName].filter(Boolean).join(' ') ||
          null,
        snapshotsEmail: stats.map((s) => s.email),
        snapshotStats: stats,
        totalOrderCount: totals.totalOrderCount,
        lastOrderedAt: totals.lastOrderedAt
      }
    })

    result.sort((a, b) => {
      const ta = a.lastOrderedAt ? new Date(a.lastOrderedAt).getTime() : 0
      const tb = b.lastOrderedAt ? new Date(b.lastOrderedAt).getTime() : 0
      return tb - ta
    })
    return result
  }

  async suggestStoreName(q: string) {
    const raw = String(q || '').trim()
    if (!raw) return []

    const likeStart = `${escapeLike(raw)}%`
    const stores = await orderRepository.findStoresByNameLike(likeStart)
    if (!stores.length) return []

    const storeIds = stores.map((s: any) => s.id)
    const rows = await orderRepository.aggregateStoreOrderSnapshots(storeIds)

    const storeMap = new Map(stores.map((s: any) => [s.id, s.currentStoreName]))
    const result = rows.map((row: any) => ({
      storeNameSnapshot: row.storeNameSnapshot,
      orderCount: row.orderCount,
      lastOrderedAt: row.lastOrderedAt,
      storeId: row.storeId,
      currentStoreName: storeMap.get(row.storeId) ?? null
    }))
    return result
  }

  async listOrders(params: Record<string, string | undefined>) {
    const {
      q,
      status,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortDir = 'desc',
      customerEmail,
      storeName
    } = params

    const page = Math.max(asInt(params.page, 1), 1)
    const pageSize = Math.min(Math.max(asInt(params.pageSize, 20), 1), 100)
    const offset = (page - 1) * pageSize

    const whereOrder: any = {}
    if (status) whereOrder.status = status

    const from = asDate(dateFrom)
    const to = asDate(dateTo)
    if (from && to) whereOrder.createdAt = { [Op.between]: [from, to] }
    else if (from) whereOrder.createdAt = { [Op.gte]: from }
    else if (to) whereOrder.createdAt = { [Op.lte]: to }

    let checkoutIds: number[] | null = null
    if (customerEmail && customerEmail.trim()) {
      const likeStart = `${escapeLike(customerEmail.trim())}%`
      const users = await orderRepository.findUsersByEmailLike(likeStart)
      const userIds = users.map((u: any) => u.id)
      if (userIds.length) {
        const checkouts = await orderRepository.findCheckoutsByUserIds(userIds)
        checkoutIds = checkouts.map((c: any) => c.id)
        if (!checkoutIds.length) {
          return { data: [], meta: { page, pageSize, total: 0, totalPages: 0 } }
        }
      } else {
        return { data: [], meta: { page, pageSize, total: 0, totalPages: 0 } }
      }
    }

    if (storeName && storeName.trim()) {
      const likeStart = `${escapeLike(storeName.trim())}%`
      const stores = await orderRepository.findStoresByNameLike(likeStart)
      const storeIds = stores.map((s: any) => s.id)
      if (storeIds.length) {
        whereOrder.storeId = { [Op.in]: storeIds }
      } else {
        return { data: [], meta: { page, pageSize, total: 0, totalPages: 0 } }
      }
    }

    const checkoutInclude: any = {
      model: CheckOut,
      as: 'checkout',
      attributes: [
        'id',
        ['order_code', 'orderCode'],
        ['customer_id', 'customerId']
      ],
      required: false
    }
    if (q && q.trim()) {
      const likeStart = `${escapeLike(q.trim())}%`
      checkoutInclude.required = true
      checkoutInclude.where = { order_code: { [Op.like]: likeStart } }
    }
    if (checkoutIds && checkoutIds.length) {
      checkoutInclude.required = true
      checkoutInclude.where = {
        ...(checkoutInclude.where || {}),
        id: { [Op.in]: checkoutIds }
      }
    }

    const include: any[] = [checkoutInclude]

    const dir = String(sortDir).toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
    const orderBy: any[] = []
    if (sortBy === 'grandTotal')
      orderBy.push([col('Order.grand_total_minor'), dir])
    else if (sortBy === 'status') orderBy.push([col('Order.status'), dir])
    else orderBy.push([col('Order.created_at'), dir])

    const group: any[] = [
      col('Order.id'),
      col('checkout.id'),
      col('checkout.order_code'),
      col('checkout.customer_id')
    ]

    const { rows, count } = await orderRepository.findAndCountOrders(
      whereOrder,
      include,
      orderBy,
      offset,
      pageSize,
      group
    )

    const total = Array.isArray(count) ? count.length : (count as number)
    return {
      data: rows,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    }
  }

  async getOrderDetail(id: number) {
    if (!Number.isFinite(id)) throw new BadRequestError('Invalid id')

    const order = await orderRepository.findOrderDetail(id)
    if (!order) throw new NotFoundError('Order not found')

    const checkout = (order as any).checkout
    const shippingInfo = (order as any).shippingInfo
    const items = (order as any).items ?? []
    const store = (order as any).store
    const statusHistory = (order as any).statusHistory ?? []
    const refundOrders = (order as any).refundOrders ?? []

    const payload = {
      id: order.get('id') as number,
      orderCode: checkout?.get('orderCode') ?? '',
      status: order.get('status') as string,
      currencyCode: order.get('currencyCode') as string,
      subtotalMinor: order.get('subtotalMinor') as number,
      shippingFeeMinor: order.get('shippingFeeMinor') as number,
      taxTotalMinor: order.get('taxTotalMinor') as number,
      discountTotalMinor: order.get('discountTotalMinor') as number,
      grandTotalMinor: order.get('grandTotalMinor') as number,
      createdAt: order.get('createdAt') as Date | string,
      updatedAt: order.get('updatedAt') as Date | string,
      customer: order.get('customerEmailSnapshot')
        ? {
            id: checkout?.get('customerId') ?? null,
            name: order.get('customerNameSnapshot') as string,
            email: order.get('customerEmailSnapshot') as string
          }
        : null,
      store: store
        ? { uuid: store.get('uuid'), name: store.get('storeName') }
        : null,
      shipping: shippingInfo
        ? {
            trackingNumber: shippingInfo.get('trackingNumber') as string | null,
            carrier: shippingInfo.get('carrier') as string | null,
            shippingTypeName: shippingInfo.get(
              'shippingTypeNameSnapshot'
            ) as string,
            shippingStatus: shippingInfo.get('shippingStatus') as string,
            shippingPriceMinor: shippingInfo.get(
              'shippingPriceMinorSnapshot'
            ) as number,
            shippedAt: shippingInfo.get('shippedAt') as Date | string | null,
            deliveredAt: shippingInfo.get('deliveredAt') as
              | Date
              | string
              | null,
            returnedToSenderAt: shippingInfo.get('returnedToSenderAt') as
              | Date
              | string
              | null,
            addressSnapshot: shippingInfo.get('addressSnapshot') || {},
            events: Array.isArray(shippingInfo.events)
              ? shippingInfo.events.map((e: any) => ({
                  id: e.id as number,
                  fromStatus: e.fromStatus as string | null,
                  toStatus: e.toStatus as string,
                  description: e.description as string | null,
                  location: e.location as string | null,
                  occurredAt: e.occurredAt as Date | string,
                  createdAt: e.createdAt as Date | string
                }))
              : []
          }
        : null,
      returnShipments: Array.isArray((order as any).returnShipments)
        ? (order as any).returnShipments.map((rs: any) => ({
            id: rs.id as number,
            status: rs.status as ReturnShipmentStatus,
            carrier: rs.carrier as string | null,
            trackingNumber: rs.trackingNumber as string | null,
            shippedAt: rs.shippedAt as Date | string | null,
            deliveredBackAt: rs.deliveredBackAt as Date | string | null,
            fromAddressSnapshot: rs.fromAddressSnapshot ?? null,
            toAddressSnapshot: rs.toAddressSnapshot ?? null,
            createdAt: rs.createdAt as Date | string,
            updatedAt: rs.updatedAt as Date | string,
            events: Array.isArray(rs.events)
              ? rs.events.map((e: any) => ({
                  id: e.id as number,
                  fromStatus: e.fromStatus as string | null,
                  toStatus: e.toStatus as string,
                  description: e.description as string | null,
                  location: e.location as string | null,
                  occurredAt: e.occurredAt as Date | string,
                  createdAt: e.createdAt as Date | string
                }))
              : []
          }))
        : [],
      payment: checkout?.payment
        ? {
            id: checkout.payment.get('id') as number,
            status: checkout.payment.get('status') as string,
            provider: checkout.payment.get('provider') as string,
            channel: checkout.payment.get('channel') as string,
            currencyCode: checkout.payment.get('currencyCode') as string,
            amountAuthorizedMinor: checkout.payment.get(
              'amountAuthorizedMinor'
            ) as number,
            amountCapturedMinor: checkout.payment.get(
              'amountCapturedMinor'
            ) as number,
            amountRefundedMinor: checkout.payment.get(
              'amountRefundedMinor'
            ) as number,
            paidAt: checkout.payment.get('paidAt') as Date | string | null
          }
        : null,
      items: items.map((it: any) => {
        const cfgs = (it.productItem?.configurations ?? []) as any[]
        const optionPairs = cfgs
          .map((c) => {
            const vo = c.variationOption
            const vName = vo?.variation?.name || ''
            const oName = vo?.value || ''
            return vName && oName ? `${vName}: ${oName}` : oName || ''
          })
          .filter(Boolean)
        const optionsTextLatest = optionPairs.join(', ')

        const latestImage = it.product?.images?.[0]?.url ?? null
        const latestSku = it.productItem?.sku ?? null
        const latestName = it.product?.name ?? null

        return {
          id: it.id as number,
          productUuid: it.product?.uuid ?? null,
          productItemUuid: it.productItem?.uuid ?? null,
          quantity: it.quantity as number,
          unitPriceMinor: it.unitPriceMinor as number,
          lineTotalMinor: it.lineTotalMinor as number,
          productName: latestName || (it.productName as string),
          productSku: latestSku ?? (it.productSku as string | null),
          productImage: (it.productImage as string | null) ?? latestImage,
          optionsText: optionsTextLatest || (it.optionsText as string | null)
        }
      }),
      timeline: statusHistory.map((h: any) => ({
        id: h.id as number,
        fromStatus: h.fromStatus as string | null,
        toStatus: h.toStatus as string,
        changedByType: h.changedByType as string,
        reason: h.reason as string | null,
        source: h.source as string | null,
        createdAt: h.createdAt as Date | string
      })),
      refunds: refundOrders.map((r: any) => ({
        id: r.id as number,
        status: r.status as string,
        amountMinor: r.amountMinor as number,
        currencyCode: r.currencyCode as string,
        reason: r.reason as string | null,
        refundChannel: r.refundChannel as string | null,
        refundRef: r.refundRef as string | null,
        requestedBy: r.requestedBy as 'CUSTOMER' | 'MERCHANT' | null,
        requestedAt: r.requestedAt as Date | string | null,
        approvedAt: r.approvedAt as Date | string | null,
        refundedAt: r.refundedAt as Date | string | null,
        description: r.description as string | null,
        contactEmail: r.contactEmail as string | null,
        createdAt: r.createdAt as Date | string,
        updatedAt: r.updatedAt as Date | string,
        timeline: (r.statusHistory ?? []).map((h: any) => ({
          id: h.id as number,
          fromStatus: h.fromStatus as string | null,
          toStatus: h.toStatus as string,
          reason: h.reason as string | null,
          changedByType: h.changedByType as string | null,
          source: h.source as string | null,
          createdAt: h.createdAt as Date | string
        }))
      }))
    }

    return payload
  }
}

export const orderService = new OrderService()
