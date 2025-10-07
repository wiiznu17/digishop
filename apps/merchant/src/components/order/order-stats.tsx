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
  onStatClick?: (payload: { statuses?: string[] }) => void // NEW
}

function StatCard({
  title,
  value,
  icon,
  colorClass,
  description,
  onClick
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  colorClass: string
  description?: string
  onClick?: () => void
}) {
  return (
    <Card
      className={
        onClick ? "cursor-pointer hover:bg-muted/40 transition-colors" : ""
      }
      onClick={onClick}
    >
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

export function OrderStats({ summary, loading, onStatClick }: OrderStatsProps) {
  const s = summary
  const val = (n?: number) => (loading ? "…" : (n ?? 0))
  const PAID_STATUS = ["PAID", "PROCESSING"]
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <StatCard
        title="Total Orders"
        value={val(s?.totalOrders)}
        icon={<Package className="h-4 w-4" />}
        colorClass="text-muted-foreground"
      />
      <StatCard
        title="Pending Payment"
        value={val(s?.pendingPayment)}
        icon={<Clock className="h-4 w-4" />}
        colorClass="text-yellow-600"
        onClick={() => onStatClick?.({ statuses: ["PENDING"] })}
      />
      <StatCard
        title="Paid Orders"
        value={val(s?.paidOrders)}
        icon={<CreditCard className="h-4 w-4" />}
        colorClass="text-green-600"
        onClick={() => onStatClick?.({ statuses: PAID_STATUS })}
      />
      <StatCard
        title="Processing"
        value={val(s?.processing)}
        icon={<Package className="h-4 w-4" />}
        colorClass="text-blue-600"
        onClick={() =>
          onStatClick?.({ statuses: ["PROCESSING", "READY_TO_SHIP"] })
        }
      />
      <StatCard
        title="Handed Over"
        value={val(s?.handedOver)}
        icon={<Truck className="h-4 w-4" />}
        colorClass="text-indigo-600"
        onClick={() => onStatClick?.({ statuses: ["HANDED_OVER"] })}
      />
      <StatCard
        title="Refund Requests"
        value={val(s?.refundRequests)}
        icon={<RotateCcw className="h-4 w-4" />}
        colorClass="text-orange-600"
        onClick={() => onStatClick?.({ statuses: ["REFUND_REQUEST"] })}
      />
      <StatCard
        title="Total Revenue"
        value={loading ? "…" : `฿${(s?.totalRevenue ?? 0).toLocaleString()}`}
        icon={<DollarSign className="h-4 w-4" />}
        colorClass="text-green-600"
      />
    </div>
  )
}
