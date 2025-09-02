// components/order/order-stats.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Package,
  Clock,
  CreditCard,
  DollarSign,
  RotateCcw,
  Truck
} from "lucide-react"
import type { OrderSummary } from "@/utils/requestUtils/requestOrderUtils"

interface OrderStatsProps {
  summary: OrderSummary | null
  loading?: boolean
}

function StatCard({
  title,
  value,
  icon,
  colorClass,
  description
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  colorClass: string
  description?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={colorClass}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

export function OrderStats({ summary, loading }: OrderStatsProps) {
  const s = summary
  const val = (n?: number) => (loading ? "…" : (n ?? 0))

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <StatCard
        title="Total Orders"
        value={val(s?.totalOrders)}
        icon={<Package className="h-4 w-4" />}
        colorClass="text-muted-foreground"
        description="All orders in the system"
      />
      <StatCard
        title="Pending Payment"
        value={val(s?.pendingPayment)}
        icon={<Clock className="h-4 w-4" />}
        colorClass="text-yellow-600"
        description="Waiting for customer payment"
      />
      <StatCard
        title="Paid Orders"
        value={val(s?.paidOrders)}
        icon={<CreditCard className="h-4 w-4" />}
        colorClass="text-green-600"
        description="Successfully paid orders"
      />
      <StatCard
        title="Processing"
        value={val(s?.processing)}
        icon={<Package className="h-4 w-4" />}
        colorClass="text-blue-600"
        description="Preparing and shipping orders"
      />
      <StatCard
        title="Handed Over"
        value={val(s?.handedOver)}
        icon={<Truck className="h-4 w-4" />}
        colorClass="text-indigo-600"
        description="Orders handed over to courier"
      />
      <StatCard
        title="Refund Requests"
        value={val(s?.refundRequests)}
        icon={<RotateCcw className="h-4 w-4" />}
        colorClass="text-orange-600"
        description="All refund requests"
      />
      <StatCard
        title="Total Revenue"
        value={loading ? "…" : `฿${(s?.totalRevenue ?? 0).toLocaleString()}`}
        icon={<DollarSign className="h-4 w-4" />}
        colorClass="text-green-600"
        description={
          s?.completedToday != null
            ? `Completed today: ${s.completedToday} orders`
            : undefined
        }
      />
    </div>
  )
}
