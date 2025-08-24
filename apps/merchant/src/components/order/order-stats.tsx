import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Package,
  Clock,
  CreditCard,
  DollarSign,
  RotateCcw,
  TrendingUp
} from "lucide-react"
import { Order } from "@/types/props/orderProp"

interface OrderStatsProps {
  orders: Order[]
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  colorClass: string
  description?: string
}

function StatCard({
  title,
  value,
  icon,
  colorClass,
  description
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={colorClass}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div
          className={`text-2xl font-bold ${colorClass.includes("text-") ? colorClass.split(" ")[1] : ""}`}
        >
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

export function OrderStats({ orders }: OrderStatsProps) {
  const stats = {
    total: orders.length,

    // Pending = current status only
    pending: orders.filter((o) => o.status === "PENDING").length,

    // Paid Orders = any order that ever reached PAID
    paid: orders.filter(
      (o) =>
        o.statusHistory.includes("PAID") &&
        !o.statusHistory.includes("CUSTOMER_CANCELED")
    ).length,

    // Processing = ever reached PROCESSING or READY_TO_SHIP
    processing: orders.filter((o) =>
      o.statusHistory.some((s) => ["PROCESSING", "READY_TO_SHIP"].includes(s))
    ).length,

    // Shipped = ever reached SHIPPED or DELIVERED
    shipped: orders.filter((o) =>
      o.statusHistory.some((s) => ["SHIPPED", "DELIVERED"].includes(s))
    ).length,

    // Refunds = ever entered refund flow
    refunds: orders.filter((o) =>
      o.statusHistory.some((s) => s.includes("REFUND"))
    ).length,

    // Revenue = exclude canceled & refund-success
    revenue: orders
      .filter(
        (o) =>
          !o.statusHistory.includes("CUSTOMER_CANCELED") &&
          !o.statusHistory.includes("REFUND_SUCCESS") &&
          !o.statusHistory.includes("MERCHANT_REJECT")
      )
      .reduce((sum, order) => sum + order.totalPrice, 0)
  }

  const completedOrdersToday = orders.filter((order) => {
    const today = new Date().toDateString()
    const orderDate = new Date(order.createdAt).toDateString()
    return (
      orderDate === today && ["DELIVERED", "COMPLETE"].includes(order.status)
    )
  }).length

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
      <StatCard
        title="Total Orders"
        value={stats.total}
        icon={<Package className="h-4 w-4" />}
        colorClass="text-muted-foreground"
        description="All orders in the system"
      />

      <StatCard
        title="Pending Payment"
        value={stats.pending}
        icon={<Clock className="h-4 w-4" />}
        colorClass="text-yellow-600"
        description="Waiting for customer payment"
      />

      <StatCard
        title="Paid Orders"
        value={stats.paid}
        icon={<CreditCard className="h-4 w-4" />}
        colorClass="text-green-600"
        description="Successfully paid orders"
      />

      <StatCard
        title="Processing"
        value={stats.processing}
        icon={<Package className="h-4 w-4" />}
        colorClass="text-blue-600"
        description="Preparing and shipping orders"
      />

      <StatCard
        title="Refund Requests"
        value={stats.refunds}
        icon={<RotateCcw className="h-4 w-4" />}
        colorClass="text-orange-600"
        description="All refund requests"
      />

      <StatCard
        title="Total Revenue"
        value={`฿${stats.revenue.toLocaleString()}`}
        icon={<DollarSign className="h-4 w-4" />}
        colorClass="text-green-600"
        description={`Completed today: ${completedOrdersToday} orders`}
      />
    </div>
  )
}
