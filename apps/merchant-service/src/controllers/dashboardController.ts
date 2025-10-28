import { Request, Response } from "express"
import {
    Op,
    Product,
    ProductImage,
    ProductItem,
    ProductItemImage,
    Store,
    Order,
    CheckOut,
    User,
    OrderStatus
} from "@digishop/db"
import { AuthenticatedRequest } from "../middlewares/middleware"

export async function getDashboardSummary(req: AuthenticatedRequest, res: Response) {
  try {
    const store = await Store.findOne({ where: { userId: (req as any).user?.sub } })
    console.log("[dashboard] getDashboardSummary for store:", store?.id)
    if (!store) return res.status(404).json({ error: "No store found" })

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    // --- Revenue
    const totalRevenueMinor =
      (await Order.sum("grandTotalMinor", {
        where: {
            storeId: store.id,
            status: OrderStatus.COMPLETE
        },
      })) ?? 0

    const monthRevenue =
      (await Order.sum("grandTotalMinor", {
        where: {
            storeId: store.id,
            status: OrderStatus.COMPLETE,
            createdAt: { [Op.gte]: monthStart }
        },
      })) ?? 0

    const prevMonthRevenue =
      (await Order.sum("grandTotalMinor", {
        where: {
          storeId: store.id,
          status: OrderStatus.COMPLETE,
          createdAt: { [Op.gte]: prevMonthStart, [Op.lt]: monthStart },
        },
      })) ?? 0

    // --- Orders
    const ordersCount = await Order.count({ where: { storeId: store.id } })
    const thisMonthOrders = await Order.count({
      where: { storeId: store.id, createdAt: { [Op.gte]: monthStart } },
    })
    const prevMonthOrders = await Order.count({
      where: { storeId: store.id, createdAt: { [Op.gte]: prevMonthStart, [Op.lt]: monthStart } },
    })

    // --- Products
    const productsCount = await Product.count({
      where: { storeId: store.id, deletedAt: null },
    })

    // Active customers find from checkout table
    const activeCustomers = await CheckOut.count({
    distinct: true,
    col: "customer_id", // นับลูกค้าไม่ซ้ำ
    include: [
        {
        model: Order,
        as: "orders",
        required: true,
        where: {
            storeId: store.id,
            createdAt: { [Op.gte]: monthStart },
        },
        },
    ],
    })

    // ดึง recent sales พร้อมข้อมูลลูกค้า จาก Checkout -> User
    const recentSalesRaw = await Order.findAll({
    attributes: ["id", "grandTotalMinor", "created_at"], // ไม่ต้องดึงชื่อ/อีเมลจาก Order แล้ว
    where: {
        storeId: store.id,
        createdAt: { [Op.gte]: monthStart },
    },
    include: [
        {
        model: CheckOut,
        as: "checkout",
        required: true,
        attributes: [], // ไม่เอาฟิลด์จาก checkout
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
    nest: true, // ให้ได้โครงแบบ { checkout: { customer: {...} } }
    })

    // map เป็น shape ที่หน้า FE ใช้
    const recentSales = recentSalesRaw.map((r: any) => {
    const cust = r.checkout?.customer ?? {}
    const fullName = [cust.firstName, cust.lastName].filter(Boolean).join(" ") ||
        "Unknown"
    return {
        orderId: String(r.id),
        customerId: cust.id ? String(cust.id) : undefined,
        customerName: fullName,
        customerEmail: cust.email ?? "",
        amountMinor: Number(r.grandTotalMinor ?? 0),
        createdAt: r.created_at,
    }
    })

    const thisMonthSalesCount = await Order.count({
      where: {
        storeId: store.id,
        status: OrderStatus.COMPLETE,
        createdAt: { [Op.gte]: monthStart }
    },
    })

    // --- รวมจำนวนรูปภาพโดยไม่ใช้ literal()
    const productImageCount = await ProductImage.count({
      include: [
        {
          model: Product,
          as: "product",
          required: true,
          where: { storeId: store.id, deletedAt: null },
        },
      ],
      where: { deletedAt: null },
    })

    const itemImageCount = await ProductItemImage.count({
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
              where: { storeId: store.id, deletedAt: null },
            },
          ],
          where: { deletedAt: null },
        },
      ],
      where: { deletedAt: null },
    })

    const totalImages = productImageCount + itemImageCount

    // --- Derived metrics
    const revenueChangeText = toChangeText(monthRevenue, prevMonthRevenue)
    const ordersChangeText = toChangeText(thisMonthOrders, prevMonthOrders)
    const productsChangeText = "—"
    const customersChangeText = "—"
    const conversionRatePct = 3.2
    const aovMinor = thisMonthSalesCount ? Math.round(monthRevenue / thisMonthSalesCount) : 0
    const customerSatisfaction = "4.8/5"

    console.log("[dashboard] getDashboardSummary: ", {
      totalRevenueMinor,
      ordersCount,
      productsCount,
      activeCustomers,
      revenueChangeText,
      ordersChangeText,
      productsChangeText,
      customersChangeText,
      thisMonthSalesCount,
      recentSales,
      conversionRatePct,
      aovMinor,
      customerSatisfaction,
      totalImages,
    })
    return res.json({
      totalRevenueMinor,
      ordersCount,
      productsCount,
      activeCustomers,
      revenueChangeText,
      ordersChangeText,
      productsChangeText,
      customersChangeText,
      thisMonthSalesCount,
      recentSales,
      revenueSeries: [],
      conversionRatePct,
      aovMinor,
      customerSatisfaction,
      totalImages,
    })
  } catch (e) {
    console.error("[dashboard] getDashboardSummary:", e)
    return res.status(500).json({ error: "Internal server error" })
  }
}

function toChangeText(current: number, previous: number) {
  if (!previous) return `${(current ? 100 : 0).toFixed(1)}% from last month`
  const pct = ((current - previous) / previous) * 100
  const sign = pct >= 0 ? "+" : ""
  return `${sign}${pct.toFixed(1)}% from last month`
}
