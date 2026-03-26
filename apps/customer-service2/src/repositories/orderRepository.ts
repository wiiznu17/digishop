import {
  ActorType, Address, CheckOut, Order, OrderItem, OrderPolicy,
  OrderStatus, OrderStatusHistory, Payment, PaymentGatewayEvent,
  PaymentMethod, PaymentStatus, ProductConfiguration, ProductImage,
  ProductItem, ProductItemImage, RefundOrder, RefundStatus, RefundStatusHistory,
  ShippingInfo, ShippingStatus, ShippingType, ShoppingCart, ShoppingCartItem,
  Store, User, Variation, VariationOption, Product
} from "@digishop/db";
import { Op } from "sequelize";

export class OrderRepository {
  async findUserById(id: number | string) {
    return User.findByPk(id);
  }

  async findOrderByCodeAndUser(orderCode: string, userId: string) {
    return Order.findAll({
      attributes: [
        "id", "reference", "status", "created_at",
        "subtotal_minor", "shipping_fee_minor", "discount_total_minor",
        "grand_total_minor", "currency_code", "order_note",
      ],
      include: [
        {
          model: CheckOut, as: "checkout",
          where: { [Op.and]: { customerId: userId, orderCode } },
          include: [{ model: Payment, as: "payment", attributes: ["id", "url_redirect", "expiry_at", "pgw_status", "payment_method", "updated_at"] }],
        },
        {
          model: ShippingInfo, as: "shippingInfo", attributes: ["id"],
          include: [
            { model: Address, as: "address" },
            { model: ShippingType, as: "shippingType", attributes: ["name", "description", "estimatedDays", "price"] },
          ],
        },
        {
          model: OrderItem, as: "items",
          include: [
            {
              model: ProductItem, as: "productItem",
              include: [
                { model: ProductItemImage, as: "productItemImage" },
                {
                  model: ProductConfiguration, as: "configurations",
                  include: [
                    {
                      model: VariationOption, as: "variationOption",
                      include: [{ model: Variation, as: "variation" }],
                    },
                  ],
                },
                {
                  model: Product, as: "product",
                  include: [{ model: Store, as: "store" }],
                },
              ],
            },
          ],
        },
      ],
    });
  }

  async findUserOrders(userId: string) {
    return Order.findAndCountAll({
      attributes: [
        "id", "reference", "status", "currency_code", "order_note",
        "grand_total_minor", "subtotal_minor", "shipping_fee_minor",
        "discount_total_minor", "created_at", "updated_at",
      ],
      include: [
        {
          model: OrderItem, as: "items",
          include: [
            {
              model: ProductItem, as: "productItem",
              include: [
                { model: ProductItemImage, as: "productItemImage" },
                {
                  model: ProductConfiguration, as: "configurations",
                  include: [
                    {
                      model: VariationOption, as: "variationOption",
                      include: [{ model: Variation, as: "variation" }],
                    },
                  ],
                },
                {
                  model: Product, as: "product",
                  include: [
                    { model: ProductImage, as: "images", attributes: ["url", "blobName", "fileName"] },
                    { model: Store, as: "store" },
                  ],
                },
              ],
            },
          ],
        },
        {
          model: ShippingInfo, as: "shippingInfo", attributes: ["id"],
          include: [
            { model: Address, as: "address" },
            { model: ShippingType, as: "shippingType", attributes: ["name", "description", "estimatedDays", "price"] },
          ],
        },
        {
          model: CheckOut, as: "checkout",
          where: { [Op.and]: { customerId: userId, deletedAt: null } },
          attributes: ["id", "orderCode"],
          include: [
            {
              model: Payment, as: "payment",
              attributes: [
                "payment_method", "status", "channel", "currency_code",
                "amount_authorized_minor", "amount_captured_minor",
                "amount_refunded_minor", "pgw_status", "updated_at",
                "providerRef", "expiryAt", "paidAt",
              ],
            },
          ],
        },
        { model: RefundOrder, as: "refundOrders" },
      ],
    });
  }

  async findCart(userId: string) {
    return ShoppingCart.findOne({ where: { userId } });
  }

  async findCartItems(cartId: number) {
    return ShoppingCartItem.findAndCountAll({
      where: { cartId },
      include: [
        {
          model: ProductItem, as: "productItem",
          include: [
            { model: ProductItemImage, as: "productItemImage" },
            {
              model: ProductConfiguration, as: "configurations",
              include: [
                {
                  model: VariationOption, as: "variationOption",
                  include: [{ model: Variation, as: "variation" }],
                },
              ],
            },
            {
              model: Product, as: "product",
              include: [{ model: Store, as: "store" }],
            },
          ],
        },
      ],
    });
  }

  async destroyCartItem(id: number) {
    return ShoppingCartItem.destroy({ where: { id } });
  }

  async createCheckout(customerId: string, orderCode: string) {
    return CheckOut.create({ customerId: Number(customerId), orderCode });
  }

  async createOrder(payload: any) {
    const order = await Order.create(payload);
    await order.save();
    return order;
  }

  async createOrderItem(payload: any) {
    const item = await OrderItem.create(payload);
    await item.save();
    return item;
  }

  async findCheckoutByOrderCode(orderCode: string) {
    return CheckOut.findOne({ where: { orderCode }, attributes: ["id", "createdAt"] });
  }

  async findOrdersByCheckout(checkoutId: number) {
    return Order.findAll({ where: { checkoutId } });
  }

  async updateOrder(id: number, payload: any) {
    return Order.update(payload, { where: { id } });
  }

  async updateOrdersByCheckout(checkoutId: number, payload: any) {
    return Order.update(payload, { where: { checkoutId } });
  }

  async createShippingInfo(payload: any) {
    const info = await ShippingInfo.create(payload);
    await info.save();
    return info;
  }

  async createOrderStatusHistory(payload: any) {
    return OrderStatusHistory.create(payload);
  }

  async createPayment(payload: any) {
    const payment = await Payment.create(payload);
    await payment.save();
    return payment;
  }

  async updatePayment(checkoutId: number, payload: any) {
    return Payment.update(payload, { where: { checkoutId } });
  }

  async createPaymentGatewayEvent(payload: any) {
    const event = await PaymentGatewayEvent.create(payload);
    await event.save();
    return event;
  }

  async destroyCheckout(orderCode: string) {
    return CheckOut.destroy({ where: { orderCode } });
  }

  async findShippingTypes() {
    return ShippingType.findAll();
  }

  async findProductItemById(id: number) {
    return ProductItem.findByPk(id);
  }

  async findCartItem(productItemId: number) {
    return ShoppingCartItem.findOne({ where: { productItemId } });
  }

  async createCart(userId: string) {
    const cart = await ShoppingCart.create({ userId: Number(userId) });
    await cart.save();
    return cart;
  }

  async updateCartItem(productItemId: number, payload: any) {
    return ShoppingCartItem.update(payload, { where: { productItemId } });
  }

  async createCartItem(payload: any) {
    return ShoppingCartItem.create(payload);
  }

  async findOrderById(id: number) {
    return Order.findByPk(id);
  }

  async findOrderByPkFull(id: number) {
    return Order.findByPk(id, {
      include: [
        {
          model: CheckOut, as: "checkout",
          include: [{ model: Payment, as: "payment", attributes: ["paidAt"] }],
        },
        { model: ShippingInfo, as: "shippingInfo", attributes: ["deliveredAt"] },
      ],
    });
  }

  async findRefundById(id: number) {
    return RefundOrder.findByPk(id);
  }

  async findPaymentByCheckout(checkoutId: number) {
    return Payment.findOne({ where: { checkoutId } });
  }

  async countRefundsSince(orderId: number, since: Date) {
    return RefundOrder.count({ where: { orderId, requestedAt: { [Op.gte]: since } } });
  }

  async findOrderStatusHistoryByStatus(orderId: number, toStatus: any) {
    return OrderStatusHistory.findOne({
      where: { orderId, toStatus },
      order: [["created_at", "DESC"]],
    });
  }

  async createRefundOrder(payload: any, transaction?: any) {
    return RefundOrder.create(payload, transaction ? { transaction } : {});
  }

  async createRefundStatusHistory(payload: any, transaction?: any) {
    return RefundStatusHistory.create(payload, transaction ? { transaction } : {});
  }

  async updateRefundOrder(id: number, payload: any) {
    return RefundOrder.update(payload, { where: { id } });
  }
}

export const orderRepository = new OrderRepository();
