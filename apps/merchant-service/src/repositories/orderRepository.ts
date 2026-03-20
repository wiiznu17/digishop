import {
  CheckOut,
  Order,
  OrderStatus,
  OrderItem,
  OrderStatusHistory,
  Payment,
  PaymentGatewayEvent,
  Product,
  RefundOrder,
  RefundStatusHistory,
  ReturnShipment,
  ReturnShipmentEvent,
  ShipmentEvent,
  ShippingInfo,
  User,
} from "@digishop/db";
import {
  IncludeOptions,
  Op,
  Transaction,
  WhereOptions,
  type CreationAttributes,
} from "sequelize";
import { OrderSortDir, OrderSortField } from "../types/order.types";

const buildCheckoutIncludeBase = (): IncludeOptions => ({
  model: CheckOut,
  as: "checkout",
  attributes: ["id", "orderCode", "customerId"],
  paranoid: false,
  include: [
    {
      model: User,
      as: "customer",
      attributes: ["id", "email", "firstName", "lastName"],
    },
    {
      model: Payment,
      as: "payment",
      attributes: [
        "id",
        "paymentMethod",
        "status",
        "provider",
        "providerRef",
        "channel",
        "currencyCode",
        "amountAuthorizedMinor",
        "amountCapturedMinor",
        "amountRefundedMinor",
        "pgwStatus",
        "paidAt",
      ],
    },
  ],
});

const buildOrderBaseIncludes = (): IncludeOptions[] => [
  buildCheckoutIncludeBase(),
  {
    model: ShippingInfo,
    as: "shippingInfo",
    attributes: [
      "id",
      "trackingNumber",
      "carrier",
      "shippingStatus",
      "shippedAt",
      "deliveredAt",
      "returnedToSenderAt",
      "createdAt",
      "updatedAt",
      "shipping_type_name_snapshot",
      "shipping_price_minor_snapshot",
      "address_snapshot",
    ],
    include: [
      {
        model: ShipmentEvent,
        as: "events",
        attributes: ["id", "fromStatus", "toStatus", "description", "location", "occurredAt", "createdAt"],
        separate: true,
        order: [["occurredAt", "ASC"], ["id", "ASC"]],
        required: false,
      },
    ],
    required: false,
  },
  {
    model: ReturnShipment,
    as: "returnShipments",
    attributes: [
      "id",
      "status",
      "carrier",
      "trackingNumber",
      "shippedAt",
      "deliveredBackAt",
      "fromAddressSnapshot",
      "toAddressSnapshot",
      "createdAt",
      "updatedAt",
    ],
    include: [
      {
        model: ReturnShipmentEvent,
        as: "events",
        attributes: ["id", "fromStatus", "toStatus", "description", "location", "occurredAt", "createdAt"],
        separate: true,
        order: [["occurredAt", "ASC"], ["id", "ASC"]],
        required: false,
      },
    ],
    required: false,
  },
  {
    model: OrderItem,
    as: "items",
    attributes: [
      "id",
      "quantity",
      "unit_price_minor",
      "discount_minor",
      "tax_rate",
      "product_name_snapshot",
      "product_sku_snapshot",
      "product_snapshot",
    ],
    include: [{ model: Product, as: "product", attributes: ["id", "name"] }],
    required: false,
  },
  {
    model: OrderStatusHistory,
    as: "statusHistory",
    attributes: ["id", "fromStatus", "toStatus", "reason", "createdAt"],
    separate: true,
    order: [["createdAt", "ASC"]],
    required: false,
  },
  {
    model: RefundOrder,
    as: "refundOrders",
    attributes: [
      "id",
      "reason",
      "amountMinor",
      "currencyCode",
      "status",
      "requestedBy",
      "requestedAt",
      "approvedAt",
      "refundedAt",
    ],
    required: false,
  },
];

type FindAndCountOrdersInput = {
  storeId?: number;
  status?: string;
  q?: string;
  startDate?: string;
  endDate?: string;
  minTotalMinor?: string;
  maxTotalMinor?: string;
  hasTracking?: string;
  sortBy: OrderSortField;
  sortDir: OrderSortDir;
  limit: number;
  offset: number;
};

type StoreDateFilter = {
  storeId?: number;
  startDate?: string;
  endDate?: string;
  statuses?: OrderStatus[];
  excludeStatuses?: OrderStatus[];
};

export class OrderRepository {
  private buildWhereFromStoreDate(filter: StoreDateFilter): WhereOptions {
    const where: WhereOptions = {};
    const { storeId, startDate, endDate, statuses, excludeStatuses } = filter;

    if (storeId) Object.assign(where, { storeId });

    if (startDate || endDate) {
      Object.assign(where, {
        createdAt: {
          ...(startDate ? { [Op.gte]: new Date(startDate) } : {}),
          ...(endDate ? { [Op.lte]: new Date(endDate) } : {}),
        },
      });
    }

    if (statuses && statuses.length > 0) {
      if (statuses.length === 1) Object.assign(where, { status: statuses[0] });
      else Object.assign(where, { status: { [Op.in]: statuses } });
    }

    if (excludeStatuses && excludeStatuses.length > 0) {
      Object.assign(where, { status: { [Op.notIn]: excludeStatuses } });
    }

    return where;
  }

  getOrderBaseIncludes(): IncludeOptions[] {
    return buildOrderBaseIncludes();
  }

  async countOrdersByStoreAndDate(filter: StoreDateFilter, transaction?: Transaction) {
    const where = this.buildWhereFromStoreDate(filter);
    return Order.count({ where, transaction });
  }

  async findOrderGrandTotalsByStoreAndDate(filter: StoreDateFilter, transaction?: Transaction) {
    const where = this.buildWhereFromStoreDate(filter);
    return Order.findAll({
      attributes: ["grandTotalMinor"],
      where,
      raw: true,
      transaction,
    }) as Promise<Array<{ grandTotalMinor: number | null }>>;
  }

  async countOrders(where: WhereOptions, transaction?: Transaction) {
    return Order.count({ where, transaction });
  }

  async findOrdersGrandTotalMinor(where: WhereOptions, transaction?: Transaction) {
    return Order.findAll({
      attributes: ["grandTotalMinor"],
      where,
      raw: true,
      transaction,
    }) as Promise<Array<{ grandTotalMinor: number | null }>>;
  }

  async findOrderByPkWithBaseIncludes(orderId: number | string, transaction?: Transaction) {
    return Order.findByPk(orderId, { include: buildOrderBaseIncludes(), transaction });
  }

  async findOrderByIdAndStore(orderId: number | string, storeId: number, transaction?: Transaction) {
    return Order.count({ where: { id: orderId, storeId }, transaction });
  }

  async findAndCountOrdersForList(input: FindAndCountOrdersInput) {
    const {
      storeId,
      status,
      q,
      startDate,
      endDate,
      minTotalMinor,
      maxTotalMinor,
      hasTracking,
      sortBy,
      sortDir,
      limit,
      offset,
    } = input;

    const whereOrder: WhereOptions = {};
    if (storeId) Object.assign(whereOrder, { storeId });

    if (status && status !== "ALL") {
      const list = status.split(",").map((entry) => entry.trim()).filter(Boolean);
      if (list.length === 1) Object.assign(whereOrder, { status: list[0] });
      else Object.assign(whereOrder, { status: { [Op.in]: list } });
    }

    if (startDate || endDate) {
      Object.assign(whereOrder, {
        createdAt: {
          ...(startDate ? { [Op.gte]: new Date(startDate) } : {}),
          ...(endDate ? { [Op.lte]: new Date(endDate) } : {}),
        },
      });
    }

    if (minTotalMinor || maxTotalMinor) {
      Object.assign(whereOrder, {
        grandTotalMinor: {
          ...(minTotalMinor ? { [Op.gte]: Number(minTotalMinor) } : {}),
          ...(maxTotalMinor ? { [Op.lte]: Number(maxTotalMinor) } : {}),
        },
      });
    }

    const isNumericQ = q?.trim() && !Number.isNaN(Number(q));
    const escapeLike = (value: string) => value.replace(/[%_]/g, "\\$&");
    const orderOr: WhereOptions[] = [];
    if (isNumericQ) orderOr.push({ id: Number(q) });

    const checkoutInclude: IncludeOptions = {
      model: CheckOut,
      as: "checkout",
      attributes: ["id", "orderCode", "customerId"],
      paranoid: false,
      required: !!(q && q.trim() && !isNumericQ),
      where:
        q && q.trim() && !isNumericQ
          ? { orderCode: { [Op.like]: `${escapeLike(q.trim())}%` } }
          : undefined,
      include: [
        {
          model: Payment,
          as: "payment",
          attributes: [
            "id",
            "paymentMethod",
            "status",
            "provider",
            "providerRef",
            "channel",
            "currencyCode",
            "amountAuthorizedMinor",
            "amountCapturedMinor",
            "amountRefundedMinor",
            "pgwStatus",
            "paidAt",
          ],
        },
      ],
    };

    const baseIncludes = buildOrderBaseIncludes();
    const shippingBase = baseIncludes.find((include) => include.as === "shippingInfo") as IncludeOptions;

    const shippingInclude: IncludeOptions = {
      ...shippingBase,
      required: typeof hasTracking === "string",
      where:
        typeof hasTracking === "string"
          ? (hasTracking === "true"
              ? { trackingNumber: { [Op.ne]: null } }
              : { trackingNumber: null })
          : undefined,
    };

    const includes: IncludeOptions[] = [
      checkoutInclude,
      shippingInclude,
      ...baseIncludes.filter((include) => !["checkout", "shippingInfo"].includes(String(include.as))),
    ];

    const finalWhere: WhereOptions = {
      ...whereOrder,
      ...(orderOr.length ? { [Op.or]: orderOr } : {}),
    };

    return Order.findAndCountAll({
      where: finalWhere,
      include: includes,
      order: [[sortBy, sortDir]],
      limit,
      offset,
      distinct: true,
    });
  }

  async updateOrderStatus(order: Order, status: OrderStatus, transaction?: Transaction) {
    return order.update({ status }, { transaction });
  }

  async createOrderStatusHistory(
    payload: CreationAttributes<OrderStatusHistory>,
    transaction?: Transaction,
  ) {
    return OrderStatusHistory.create(payload, { transaction });
  }

  async findLatestShipmentEvent(shippingInfoId: number, transaction?: Transaction) {
    return ShipmentEvent.findOne({
      where: { shippingInfoId },
      order: [["occurredAt", "DESC"], ["id", "DESC"]],
      transaction,
    });
  }

  async updateShippingInfo(
    shippingInfo: ShippingInfo,
    patch: Partial<CreationAttributes<ShippingInfo>>,
    transaction?: Transaction,
  ) {
    return shippingInfo.update(patch, { transaction });
  }

  async createShipmentEvent(payload: CreationAttributes<ShipmentEvent>, transaction?: Transaction) {
    return ShipmentEvent.create(payload, { transaction });
  }

  async findRefundOrderByOrderId(orderId: number, transaction?: Transaction) {
    return RefundOrder.findOne({ where: { orderId }, transaction });
  }

  async createRefundOrder(payload: CreationAttributes<RefundOrder>, transaction?: Transaction) {
    return RefundOrder.create(payload, { transaction });
  }

  async updateRefundOrder(
    refundOrder: RefundOrder,
    patch: Partial<CreationAttributes<RefundOrder>>,
    transaction?: Transaction,
  ) {
    return refundOrder.update(patch, { transaction });
  }

  async createRefundStatusHistory(
    payload: CreationAttributes<RefundStatusHistory>,
    transaction?: Transaction,
  ) {
    return RefundStatusHistory.create(payload, { transaction });
  }

  async findReturnShipmentByOrderId(orderId: number, transaction?: Transaction) {
    return ReturnShipment.findOne({ where: { orderId }, transaction });
  }

  async createReturnShipment(payload: CreationAttributes<ReturnShipment>, transaction?: Transaction) {
    return ReturnShipment.create(payload, { transaction });
  }

  async createReturnShipmentEvent(
    payload: CreationAttributes<ReturnShipmentEvent>,
    transaction?: Transaction,
  ) {
    return ReturnShipmentEvent.create(payload, { transaction });
  }

  async reloadOrderWithBaseIncludes(order: Order, transaction?: Transaction) {
    return order.reload({ include: buildOrderBaseIncludes(), transaction });
  }

  async findFreshOrderWithBaseIncludes(orderId: number | string) {
    return Order.findByPk(orderId, { include: buildOrderBaseIncludes() });
  }

  async updateOrderStatusById(orderId: number | string, status: OrderStatus) {
    return Order.update({ status }, { where: { id: orderId } });
  }

  async createPaymentGatewayEvent(payload: CreationAttributes<PaymentGatewayEvent>) {
    return PaymentGatewayEvent.create(payload);
  }
}

export const orderRepository = new OrderRepository();
