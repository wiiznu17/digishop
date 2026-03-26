import { CheckOut, Order, OrderItem, Product, Store, StoreStatus, User } from "@digishop/db";
import { Op, col, fn, where as sqlWhere, WhereOptions } from "sequelize";

export class StoreRepository {
  async findAndCountStores(
    where: WhereOptions,
    havingAnd: any[],
    orderBy: any[],
    offset: number,
    limit: number,
    orderTotalExpr: any,
    orderCountExpr: any
  ) {
    return Store.findAndCountAll({
      where,
      attributes: [
        "id",
        "uuid",
        ["store_name", "storeName"],
        "email",
        "status",
        ["created_at", "createdAt"],
        [orderTotalExpr, "orderTotalMinor"],
        [orderCountExpr, "orderCount"],
      ],
      include: [
        {
          model: User,
          as: "owner",
          required: false,
          attributes: [
            [col("first_name"), "firstName"],
            [col("last_name"), "lastName"],
            "email",
          ],
        },
        {
          model: Order,
          as: "storeOrders",
          attributes: [],
          required: false,
        },
      ],
      group: ["Store.id", "owner.id"],
      having: havingAnd.length ? { [Op.and]: havingAnd } : undefined,
      order: orderBy,
      offset,
      limit,
      distinct: true,
      subQuery: false,
    });
  }

  async getProductCountsForStores(storeIds: number[]) {
    if (!storeIds.length) return [];
    return Product.findAll({
      where: { storeId: { [Op.in]: storeIds } },
      attributes: [
        ["store_id", "storeId"],
        [fn("COUNT", col("Product.id")), "productCount"],
      ],
      group: ["storeId"],
      raw: true,
    });
  }

  async suggestStores(term: string) {
    return Store.findAll({
      where: {
        [Op.or]: [
          { storeName: { [Op.like]: term } },
          { email: { [Op.like]: term } }
        ]
      },
      attributes: ["id", ["store_name", "storeName"]],
      limit: 8,
      order: [[col("Store.created_at"), "DESC"]],
    });
  }

  async getStoreDetail(id: number) {
    return Store.findOne({
      where: { id },
      include: [
        {
          model: User,
          as: "owner",
          required: false,
          attributes: [[col("first_name"), "firstName"], [col("last_name"), "lastName"], "email"]
        },
        { model: Product, as: "products", attributes: [], required: false },
        { model: Order, as: "storeOrders", attributes: [], required: false },
      ],
      attributes: [
        "id",
        "uuid",
        ["store_name", "storeName"],
        "email",
        "status",
        ["created_at", "createdAt"],
        [fn("COUNT", fn("DISTINCT", col("products.id"))), "productCount"],
        [fn("COALESCE", fn("SUM", col("storeOrders.grand_total_minor")), 0), "orderTotalMinor"],
        [fn("COUNT", col("storeOrders.id")), "orderCount"],
      ],
      group: ["Store.id", "owner.id"],
    });
  }

  async getOrderSummary(storeId: number) {
    return Order.findAll({
      where: { storeId },
      attributes: [
        [fn("COUNT", col("Order.id")), "totalOrders"],
        [fn("COALESCE", fn("SUM", col("Order.grand_total_minor")), 0), "totalSalesMinor"],
        [fn("COALESCE", fn("AVG", col("Order.grand_total_minor")), 0), "averageOrderMinor"],
        [fn("MAX", col("Order.created_at")), "lastOrderAt"],
      ],
      raw: true,
    });
  }

  async getMonthlySales(storeId: number, monthExpr: any) {
    return Order.findAll({
      where: { storeId },
      attributes: [
        [monthExpr, "month"],
        [fn("COALESCE", fn("SUM", col("Order.grand_total_minor")), 0), "totalSalesMinor"],
        [fn("COUNT", col("Order.id")), "orderCount"],
      ],
      group: [monthExpr],
      order: [[monthExpr, "DESC"]],
      limit: 18,
      raw: true,
    });
  }

  async getRecentOrders(storeId: number) {
    return Order.findAll({
      where: { storeId },
      include: [
        {
          model: CheckOut,
          as: "checkout",
          required: true,
          attributes: ["orderCode"],
          include: [
            {
              model: User,
              as: "customer",
              required: true,
              attributes: ["id", [col("first_name"), "firstName"], [col("last_name"), "lastName"], "email"],
            },
          ],
        },
      ],
      attributes: ["id", "reference", "status", ["grand_total_minor", "grandTotalMinor"], ["currency_code", "currencyCode"], ["created_at", "createdAt"]],
      order: [[col("Order.created_at"), "DESC"]],
      limit: 10,
    });
  }

  async getRecentOrderItems(orderIds: number[]) {
    if (!orderIds.length) return [];
    return OrderItem.findAll({
      where: { orderId: orderIds },
      include: [
        {
          model: Product,
          as: "product",
          required: false,
          attributes: ["id", "uuid", "name"]
        },
      ],
      attributes: ["orderId"],
      limit: 200,
    });
  }

  async findStoreById(id: number) {
    return Store.findOne({
      where: { id },
      attributes: ["id", "uuid", ["store_name", "storeName"], "email", "status", ["created_at", "createdAt"]],
    });
  }

  async approveStore(id: number) {
    return Store.update(
      { status: StoreStatus.APPROVED },
      { where: { id, status: StoreStatus.PENDING } }
    );
  }
}

export const storeRepository = new StoreRepository();
