import { CheckOut, Order, RefundOrder } from '@digishop/db'

export class RefundRepository {
  async findAndCountRefunds(
    whereRefund: any,
    include: any,
    orderBy: any,
    offset: number,
    limit: number,
    attributes: any
  ) {
    return RefundOrder.findAndCountAll({
      where: whereRefund,
      include,
      attributes,
      order: orderBy,
      offset,
      limit,
      subQuery: false,
      distinct: true
    })
  }
}

export const refundRepository = new RefundRepository()
