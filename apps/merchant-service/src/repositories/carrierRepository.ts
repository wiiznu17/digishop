import {
  Order,
  OrderStatus,
  OrderStatusHistory,
  sequelize,
  ShipmentEvent,
  ShippingInfo,
  ShippingStatus
} from '@digishop/db'
import { CreationAttributes, Transaction } from 'sequelize'

export class CarrierRepository {
  async withTransaction<T>(handler: (transaction: Transaction) => Promise<T>) {
    return sequelize.transaction(handler)
  }

  async createShipmentEvent(
    payload: CreationAttributes<ShipmentEvent>,
    transaction: Transaction
  ) {
    return ShipmentEvent.create(payload, { transaction })
  }

  async updateShippingInfo(
    shippingInfo: ShippingInfo,
    patch: Partial<CreationAttributes<ShippingInfo>>,
    transaction: Transaction
  ) {
    return shippingInfo.update(patch, { transaction })
  }

  async countShipmentEventsByToStatus(
    shippingInfoId: number,
    toStatus: ShippingStatus,
    transaction: Transaction
  ) {
    return ShipmentEvent.count({
      where: {
        shippingInfoId,
        toStatus
      },
      transaction
    })
  }

  async updateOrderStatus(
    order: Order,
    toStatus: OrderStatus,
    transaction: Transaction
  ) {
    return order.update({ status: toStatus }, { transaction })
  }

  async createOrderStatusHistory(
    payload: CreationAttributes<OrderStatusHistory>,
    transaction: Transaction
  ) {
    return OrderStatusHistory.create(payload, { transaction })
  }

  async countOrderStatusHistoryByToStatus(
    orderId: number,
    toStatus: OrderStatus,
    transaction: Transaction
  ) {
    return OrderStatusHistory.count({
      where: { orderId, toStatus },
      transaction
    })
  }
}

export const carrierRepository = new CarrierRepository()
