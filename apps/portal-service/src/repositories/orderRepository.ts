import { CheckOut, Order, User, Store, OrderItem, Product, ProductImage, ProductItem, ProductItemImage, ProductConfiguration, VariationOption, Variation, ShippingInfo, ShippingType, Address, ShipmentEvent, ReturnShipment, ReturnShipmentEvent, OrderStatusHistory, RefundOrder, RefundStatusHistory, Payment } from "@digishop/db";
import { Op, col, fn } from "sequelize";

export class OrderRepository {
  async findSuggestOrders(likeStart: string) {
    return Order.findAll({
      include: [
        {
          model: CheckOut,
          as: "checkout",
          attributes: [["order_code", "orderCode"]],
          required: true,
          where: { order_code: { [Op.like]: likeStart } },
        },
      ],
      attributes: [
        "id",
        ["status", "status"],
        ["grand_total_minor", "grandTotalMinor"],
        ["created_at", "createdAt"],
        ["customer_name_snapshot", "customerName"],
        ["customer_email_snapshot", "customerEmail"],
        [col("checkout.order_code"), "orderCode"],
      ],
      order: [["created_at", "DESC"]],
      limit: 8,
      subQuery: false,
    });
  }

  async findUsersByEmailLike(likeStart: string) {
    return User.findAll({
      where: { email: { [Op.like]: likeStart } },
      attributes: ["id", ["email", "currentEmail"], "firstName", "middleName", "lastName", ["updated_at", "updatedAt"]],
      order: [["updated_at", "DESC"]],
      limit: 8,
      raw: true
    });
  }

  async aggregateOrderEmailsForUsers(userIds: number[]) {
    return Order.findAll({
      attributes: [
        [col("checkout.customer_id"), "customerId"],
        ["customer_email_snapshot", "email"],
        [fn("COUNT", col("Order.id")), "orderCount"],
        [fn("MAX", col("Order.created_at")), "lastOrderedAt"]
      ],
      include: [
        {
          model: CheckOut,
          as: "checkout",
          attributes: [],
          required: true,
          where: { customerId: { [Op.in]: userIds } }
        }
      ],
      group: [col("checkout.customer_id"), col("Order.customer_email_snapshot")],
      raw: true
    });
  }

  async aggregateUserOrderTotals(userIds: number[]) {
    return Order.findAll({
      attributes: [
        [col("checkout.customer_id"), "customerId"],
        [fn("COUNT", col("Order.id")), "totalOrderCount"],
        [fn("MAX", col("Order.created_at")), "lastOrderedAt"]
      ],
      include: [
        {
          model: CheckOut,
          as: "checkout",
          attributes: [],
          required: true,
          where: { customerId: { [Op.in]: userIds } }
        }
      ],
      group: [col("checkout.customer_id")],
      raw: true
    });
  }

  async findStoresByNameLike(likeStart: string) {
    return Store.findAll({
      where: { storeName: { [Op.like]: likeStart } },
      attributes: ["id", ["store_name", "currentStoreName"]],
      limit: 16,
      raw: true,
    });
  }

  async aggregateStoreOrderSnapshots(storeIds: number[]) {
    return Order.findAll({
      where: { storeId: { [Op.in]: storeIds } },
      attributes: [
        "storeNameSnapshot",
        [fn("COUNT", col("Order.id")), "orderCount"],
        [fn("MAX", col("Order.created_at")), "lastOrderedAt"],
        "storeId",
      ],
      group: [
        col("Order.store_name_snapshot"),
        col("Order.store_id"),
      ],
      order: [[fn("MAX", col("Order.created_at")), "DESC"]],
      limit: 8,
      raw: true,
      subQuery: false,
    });
  }

  async findCheckoutsByUserIds(userIds: number[]) {
    return CheckOut.findAll({
      where: { customerId: { [Op.in]: userIds } },
      attributes: ["id"],
      raw: true,
    });
  }

  async findAndCountOrders(whereOrder: any, include: any, orderBy: any, offset: number, limit: number, group: any) {
    return Order.findAndCountAll({
      where: whereOrder,
      include,
      attributes: [
        "id",
        ["currency_code", "currencyCode"],
        ["grand_total_minor", "grandTotalMinor"],
        ["status", "status"],
        ["created_at", "createdAt"],
        ["customer_name_snapshot", "customerName"],
        ["customer_email_snapshot", "customerEmail"],
        ["store_name_snapshot", "storeName"],
        [col("checkout.order_code"), "orderCode"],
      ],
      group,
      order: orderBy,
      offset,
      limit,
      distinct: true,
      subQuery: false,
    });
  }

  async findOrderDetail(id: number) {
    return Order.findOne({
      where: { id },
      attributes: [
        "id",
        ["status","status"],
        ["currency_code","currencyCode"],
        ["subtotal_minor","subtotalMinor"],
        ["shipping_fee_minor","shippingFeeMinor"],
        ["tax_total_minor","taxTotalMinor"],
        ["discount_total_minor","discountTotalMinor"],
        ["grand_total_minor","grandTotalMinor"],
        ["created_at","createdAt"],
        ["updated_at","updatedAt"],
        ["customer_name_snapshot","customerNameSnapshot"],
        ["customer_email_snapshot","customerEmailSnapshot"],
        ["store_name_snapshot","storeNameSnapshot"],
      ],
      include: [
        {
          model: CheckOut, as: "checkout",
          attributes: ["id", ["order_code","orderCode"], ["customer_id","customerId"]],
          required: false,
          include: [
            {
              model: Payment, as: "payment",
              attributes: [
                "id",
                ["status","status"],
                ["provider","provider"],
                ["channel","channel"],
                ["currency_code","currencyCode"],
                ["amount_authorized_minor","amountAuthorizedMinor"],
                ["amount_captured_minor","amountCapturedMinor"],
                ["amount_refunded_minor","amountRefundedMinor"],
                ["paid_at","paidAt"],
              ],
              required: false,
            },
          ],
        },
        {
          model: OrderItem, as: "items",
          attributes: [
            "id","quantity",
            ["unit_price_minor","unitPriceMinor"],
            ["line_total_minor","lineTotalMinor"],
            ["product_name_snapshot","productName"],
            ["product_sku_snapshot","productSku"],
            ["product_image_snapshot","productImage"],
            ["options_text","optionsText"],
          ],
          include: [
            { model: Product, as: "product",
              attributes: ["id", "uuid", "name"],
              required: false,
              include: [
                { model: ProductImage, as: "images",
                  attributes: ["url"],
                  where: { isMain: true },
                  required: false,
                  limit: 1
                },
              ],
            },
            {
              model: ProductItem, as: "productItem",
              required: false,
              attributes: ["uuid", "sku", "priceMinor"],
              include: [
                { model: ProductItemImage, as: "productItemImage", attributes: ["url"], required: false },
                {
                  model: ProductConfiguration, as: "configurations", required: false,
                  attributes: ["id"],
                  include: [
                    {
                      model: VariationOption, as: "variationOption", required: false,
                      attributes: ["id", "value"],
                      include: [{ model: Variation, as: "variation", attributes: ["id", "name"], required: false }],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          model: ShippingInfo, as: "shippingInfo",
          attributes: [
            "trackingNumber",
            "carrier",
            "shippedAt",
            "deliveredAt",
            "returnedToSenderAt", 
            "shippingStatus",
            ["shipping_type_name_snapshot","shippingTypeNameSnapshot"],
            ["shipping_price_minor_snapshot","shippingPriceMinorSnapshot"],
            ["address_snapshot","addressSnapshot"],
          ],
          include: [
            { model: ShippingType, as: "shippingType", attributes: ["id","name"], required: false },
            { model: Address, as: "address", attributes: ["id"], required: false },
            {
              model: ShipmentEvent, as: "events", required: false, separate: true,
              attributes: [
                "id",
                ["from_status","fromStatus"],
                ["to_status","toStatus"],
                "description","location",
                ["occurred_at","occurredAt"],
                ["created_at","createdAt"],
              ],
              order: [["occurred_at","ASC"],["id","ASC"]],
            }
          ],
          required: false,
        },
        {
          model: ReturnShipment, as: "returnShipments", required: false,
          attributes: [
            "id",
            "status",
            "carrier",
            "trackingNumber",
            "shippedAt",
            "deliveredBackAt",
            ["from_address_snapshot","fromAddressSnapshot"],
            ["to_address_snapshot","toAddressSnapshot"],
            ["created_at","createdAt"],
            ["updated_at","updatedAt"],
          ],
          include: [
            {
              model: ReturnShipmentEvent, as: "events", required: false, separate: true,
              attributes: [
                "id",
                ["from_status","fromStatus"],
                ["to_status","toStatus"],
                "description","location",
                ["occurred_at","occurredAt"],
                ["created_at","createdAt"],
              ],
              order: [["occurred_at","ASC"],["id","ASC"]],
            },
          ],
        },

        {
          model: OrderStatusHistory, as: "statusHistory",
          required: false, separate: true,
          attributes: [
            "id",
            ["from_status","fromStatus"],
            ["to_status","toStatus"],
            ["changed_by_type","changedByType"],
            ["reason","reason"],
            ["source","source"],
            ["created_at","createdAt"],
          ],
          order: [["created_at","ASC"]],
        },
        {
          model: RefundOrder, as: "refundOrders", required: false,
          attributes: [
            "id",
            "status",
            ["amount_minor","amountMinor"],
            ["currency_code","currencyCode"],
            "reason",
            "refundChannel",
            "refundRef",
            "requestedBy",
            "requestedAt",
            "approvedAt",
            "refundedAt",
            "description",
            "contactEmail",
            ["created_at","createdAt"],
            ["updated_at","updatedAt"],
          ],
          include: [
            {
              model: RefundStatusHistory, as: "statusHistory", required: false, separate: true,
              attributes: [
                "id",
                ["from_status","fromStatus"],
                ["to_status","toStatus"],
                "reason",
                ["changed_by_type","changedByType"],
                "source",
                ["created_at","createdAt"],
              ],
              order: [["created_at","ASC"]],
            },
          ],
        },
        { model: Store, as: "store", attributes: ["uuid", ["store_name","storeName"]], required: false },
      ],
    });
  }
}

export const orderRepository = new OrderRepository();
