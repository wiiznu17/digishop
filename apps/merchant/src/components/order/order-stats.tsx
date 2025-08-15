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
    pending: orders.filter((o) => o.status === "PENDING").length,
    paid: orders.filter((o) => o.status === "PAID").length,
    processing: orders.filter((o) =>
      ["PROCESSING", "READY_TO_SHIP"].includes(o.status)
    ).length,
    shipped: orders.filter((o) => ["SHIPPED", "DELIVERED"].includes(o.status))
      .length,
    refunds: orders.filter((o) => o.status.includes("REFUND")).length,
    revenue: orders
      .filter(
        (o) =>
          !["PENDING", "CUSTOMER_CANCELED", "REFUND_SUCCESS"].includes(o.status)
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
        title="คำสั่งซื้อทั้งหมด"
        value={stats.total}
        icon={<Package className="h-4 w-4" />}
        colorClass="text-muted-foreground"
        description="คำสั่งซื้อทั้งหมดในระบบ"
      />

      <StatCard
        title="รอชำระเงิน"
        value={stats.pending}
        icon={<Clock className="h-4 w-4" />}
        colorClass="text-yellow-600"
        description="รอการชำระเงินจากลูกค้า"
      />

      <StatCard
        title="ชำระแล้ว"
        value={stats.paid}
        icon={<CreditCard className="h-4 w-4" />}
        colorClass="text-green-600"
        description="ชำระเงินเรียบร้อยแล้ว"
      />

      <StatCard
        title="กำลังเตรียม"
        value={stats.processing}
        icon={<Package className="h-4 w-4" />}
        colorClass="text-blue-600"
        description="กำลังเตรียมสินค้าและจัดส่ง"
      />

      <StatCard
        title="การคืนเงิน"
        value={stats.refunds}
        icon={<RotateCcw className="h-4 w-4" />}
        colorClass="text-orange-600"
        description="คำขอคืนเงินทั้งหมด"
      />

      <StatCard
        title="ยอดขายรวม"
        value={`฿${stats.revenue.toLocaleString()}`}
        icon={<DollarSign className="h-4 w-4" />}
        colorClass="text-green-600"
        description={`เสร็จสิ้นวันนี้: ${completedOrdersToday} คำสั่ง`}
      />
    </div>
  )
}
