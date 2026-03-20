import {
  CheckOut,
  Order,
  OrderStatus,
  Product,
  ProductImage,
  ProductItem,
  ProductItemImage,
  Store,
  User,
} from "@digishop/db";
import { Op } from "sequelize";
import { DashboardRecentSale, DashboardSummaryStats } from "../types/dashboard.types";

type DashboardRecentSaleRaw = {
  id: number | string;
  grandTotalMinor?: number | null;
  created_at: Date;
  checkout?: {
    customer?: {
      id?: number | string;
      email?: string;
      firstName?: string;
      lastName?: string;
    };
  };
};

const toChangeText = (current: number, previous: number) => {
  if (!previous) return `${(current ? 100 : 0).toFixed(1)}% from last month`;
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}% from last month`;
};

export class DashboardRepository {
  async findStoreByUserId(userId: number) {
    return Store.findOne({ where: { userId }, attributes: ["id"] });
  }

  async getDashboardSummaryStats(storeId: number): Promise<DashboardSummaryStats> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalRevenueMinorRaw,
      monthRevenueRaw,
      prevMonthRevenueRaw,
      ordersCount,
      thisMonthOrders,
      prevMonthOrders,
      productsCount,
      activeCustomers,
      recentSalesRaw,
      thisMonthSalesCount,
      productImageCount,
      itemImageCount,
    ] = await Promise.all([
      Order.sum("grandTotalMinor", {
        where: {
          storeId,
          status: OrderStatus.COMPLETE,
        },
      }),
      Order.sum("grandTotalMinor", {
        where: {
          storeId,
          status: OrderStatus.COMPLETE,
          createdAt: { [Op.gte]: monthStart },
        },
      }),
      Order.sum("grandTotalMinor", {
        where: {
          storeId,
          status: OrderStatus.COMPLETE,
          createdAt: { [Op.gte]: prevMonthStart, [Op.lt]: monthStart },
        },
      }),
      Order.count({ where: { storeId } }),
      Order.count({
        where: {
          storeId,
          createdAt: { [Op.gte]: monthStart },
        },
      }),
      Order.count({
        where: {
          storeId,
          createdAt: { [Op.gte]: prevMonthStart, [Op.lt]: monthStart },
        },
      }),
      Product.count({
        where: { storeId, deletedAt: null },
      }),
      CheckOut.count({
        distinct: true,
        col: "customer_id",
        include: [
          {
            model: Order,
            as: "orders",
            required: true,
            where: {
              storeId,
              createdAt: { [Op.gte]: monthStart },
            },
          },
        ],
      }),
      Order.findAll({
        attributes: ["id", "grandTotalMinor", "created_at"],
        where: {
          storeId,
          createdAt: { [Op.gte]: monthStart },
        },
        include: [
          {
            model: CheckOut,
            as: "checkout",
            required: true,
            attributes: [],
            include: [
              {
                model: User,
                as: "customer",
                required: true,
                attributes: ["id", "email", "firstName", "lastName"],
              },
            ],
          },
        ],
        order: [["created_at", "DESC"]],
        limit: 10,
        raw: true,
        nest: true,
      }) as unknown as DashboardRecentSaleRaw[],
      Order.count({
        where: {
          storeId,
          status: OrderStatus.COMPLETE,
          createdAt: { [Op.gte]: monthStart },
        },
      }),
      ProductImage.count({
        include: [
          {
            model: Product,
            as: "product",
            required: true,
            where: { storeId, deletedAt: null },
          },
        ],
        where: { deletedAt: null },
      }),
      ProductItemImage.count({
        include: [
          {
            model: ProductItem,
            as: "productItem",
            required: true,
            include: [
              {
                model: Product,
                as: "product",
                required: true,
                where: { storeId, deletedAt: null },
              },
            ],
            where: { deletedAt: null },
          },
        ],
        where: { deletedAt: null },
      }),
    ]);

    const totalRevenueMinor = Number(totalRevenueMinorRaw ?? 0);
    const monthRevenue = Number(monthRevenueRaw ?? 0);
    const prevMonthRevenue = Number(prevMonthRevenueRaw ?? 0);

    const recentSales: DashboardRecentSale[] = recentSalesRaw.map((row) => {
      const customer = row.checkout?.customer ?? {};
      const fullName =
        [customer.firstName, customer.lastName].filter((value): value is string => !!value).join(" ") ||
        "Unknown";

      return {
        orderId: String(row.id),
        customerId: customer.id ? String(customer.id) : undefined,
        customerName: fullName,
        customerEmail: customer.email ?? "",
        amountMinor: Number(row.grandTotalMinor ?? 0),
        createdAt: row.created_at,
      };
    });

    return {
      totalRevenueMinor,
      ordersCount,
      productsCount,
      activeCustomers,
      revenueChangeText: toChangeText(monthRevenue, prevMonthRevenue),
      ordersChangeText: toChangeText(thisMonthOrders, prevMonthOrders),
      thisMonthSalesCount,
      recentSales,
      aovMinor: thisMonthSalesCount ? Math.round(monthRevenue / thisMonthSalesCount) : 0,
      totalImages: productImageCount + itemImageCount,
    };
  }
}

export const dashboardRepository = new DashboardRepository();
