import {
  Order,
  OrderStatus,
  OrderStatusHistory,
  ReturnShipment,
  ReturnShipmentEvent,
  ReturnShipmentStatus,
  sequelize
} from '@digishop/db'
import { CreationAttributes, Transaction } from 'sequelize'

export class ReturnCarrierRepository {
  async withTransaction<T>(handler: (transaction: Transaction) => Promise<T>) {
    return sequelize.transaction(handler)
  }

  async createReturnShipmentEvent(
    payload: CreationAttributes<ReturnShipmentEvent>,
    transaction: Transaction
  ) {
    return ReturnShipmentEvent.create(payload, { transaction })
  }

  async updateReturnShipment(
    returnShipment: ReturnShipment,
    patch: Partial<CreationAttributes<ReturnShipment>>,
    transaction: Transaction
  ) {
    return returnShipment.update(patch, { transaction })
  }

  async updateOrderStatus(
    order: Order,
    status: OrderStatus,
    transaction: Transaction
  ) {
    return order.update({ status }, { transaction })
  }

  async createOrderStatusHistory(
    payload: CreationAttributes<OrderStatusHistory>,
    transaction: Transaction
  ) {
    return OrderStatusHistory.create(payload, { transaction })
  }

  async findReturnShipmentByPk(returnShipmentId: number) {
    return ReturnShipment.findByPk(returnShipmentId)
  }

  async findOrderByPk(orderId: number, transaction?: Transaction) {
    return Order.findByPk(orderId, { transaction })
  }

  async findLastReturnShipmentEvent(returnShipmentId: number) {
    return ReturnShipmentEvent.findOne({
      where: { returnShipmentId },
      order: [
        ['occurredAt', 'DESC'],
        ['id', 'DESC']
      ]
    })
  }

  async countReturnShipmentEventsByStatus(
    returnShipmentId: number,
    status: ReturnShipmentStatus,
    transaction?: Transaction
  ) {
    return ReturnShipmentEvent.count({
      where: { returnShipmentId, toStatus: status },
      transaction
    })
  }
}

export const returnCarrierRepository = new ReturnCarrierRepository()
