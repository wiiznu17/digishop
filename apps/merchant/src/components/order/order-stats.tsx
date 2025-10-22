import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Package,
  Clock,
  CreditCard,
  DollarSign,
  RotateCcw,
  Truck,
  CircleHelp,
  CheckCircle2, // NEW
  XCircle
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import type { OrderSummary } from "@/utils/requestUtils/requestOrderUtils"
import { cn } from "@/utils/tailwindUtils"

interface OrderStatsProps {
  summary: OrderSummary | null
  loading?: boolean
  onStatClick?: (payload: { statuses?: string[] }) => void
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
      className={cn(
        "relative",
        onClick && "cursor-pointer hover:bg-muted/40 transition-colors"
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn("rounded-md p-1", colorClass)}>
          <div className="h-7 w-7 [&>svg]:h-full [&>svg]:w-full">{icon}</div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>

      {description ? (
        <TooltipProvider delayDuration={800}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="absolute bottom-2 right-2 inline-flex h-4 w-4 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                aria-label={`Info: ${title}`}
                onClick={(e) => e.stopPropagation()}
              >
                <CircleHelp className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              align="end"
              className="max-w-[260px] text-xs leading-relaxed"
            >
              {description}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : null}
    </Card>
  )
}

export function OrderStats({ summary, loading, onStatClick }: OrderStatsProps) {
  const s = summary
  const val = (n?: number) => (loading ? "…" : (n ?? 0))
  const money = (n?: number) =>
    loading ? "…" : `฿${(n ?? 0).toLocaleString()}`
  const PAID_STATUS = ["PAID", "PROCESSING"]

  const DESCS = {
    totalOrders: "จำนวนออเดอร์ทั้งหมดในระบบ",
    pendingPayment: "ออเดอร์ที่ลูกค้ายังไม่ชำระเงิน",
    paidOrders: "ออเดอร์ที่ชำระเงินแล้วและรอการยืนยัน/เตรียมจัดส่งจากร้านค้า",
    processing: "ออเดอร์ระหว่างเตรียมสินค้า/รอขนส่งเข้ารับ",
    handedOver:
      "ออเดอร์อยู่ระหว่างขนส่ง (HANDED_OVER/SHIPPED/TRANSIT_LACK/RE_TRANSIT)",
    refundRequests: "ออเดอร์ที่ลูกค้าร้องขอคืนเงิน (ยังไม่สำเร็จ)",
    canceledOrders: "ออเดอร์ที่ถูกยกเลิกโดยลูกค้าหรือร้านค้า",
    totalRevenue:
      "ยอดสั่งซื้อ (ไม่รวมออเดอร์ที่ยกเลิกและออเดอร์ที่คืนเงินสำเร็จ)",
    refundSuccessOrders: "ออเดอร์ที่คืนเงินสำเร็จ",
    completed: "ออเดอร์ที่สำเร็จ"
  }
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title="Total Orders"
        value={val(s?.totalOrders)}
        icon={<Package />}
        colorClass="text-muted-foreground"
        description={DESCS.totalOrders}
      />

      <StatCard
        title="Pending Payment"
        value={val(s?.pendingPayment)}
        icon={<Clock />}
        colorClass="text-yellow-600"
        description={DESCS.pendingPayment}
        onClick={() => onStatClick?.({ statuses: ["PENDING"] })}
      />

      <StatCard
        title="Waiting for confirm (Paid)"
        value={val(s?.paidOrders)}
        icon={<CreditCard />}
        colorClass="text-green-600"
        description={DESCS.paidOrders}
        onClick={() => onStatClick?.({ statuses: PAID_STATUS })}
      />

      <StatCard
        title="Processing order"
        value={val(s?.processing)}
        icon={<Package />}
        colorClass="text-blue-600"
        description={DESCS.processing}
        onClick={() =>
          onStatClick?.({ statuses: ["PROCESSING", "READY_TO_SHIP"] })
        }
      />

      <StatCard
        title="Shipping"
        value={val(s?.handedOver)}
        icon={<Truck />}
        colorClass="text-indigo-600"
        description={DESCS.handedOver}
        onClick={() =>
          onStatClick?.({
            statuses: ["HANDED_OVER", "SHIPPED", "TRANSIT_LACK", "RE_TRANSIT"]
          })
        }
      />

      <StatCard
        title="Refund Requests"
        value={val(s?.refundRequests)}
        icon={<RotateCcw />}
        colorClass="text-orange-600"
        description={DESCS.refundRequests}
        onClick={() => onStatClick?.({ statuses: ["REFUND_REQUEST"] })}
      />

      <StatCard
        title="Completed"
        value={val(s?.completed)}
        icon={<CheckCircle2 />}
        colorClass="text-emerald-600"
        description={DESCS.completed}
        onClick={() => onStatClick?.({ statuses: ["COMPLETE"] })}
      />
      {/* NEW: Canceled Orders */}
      <StatCard
        title="Canceled Orders"
        value={val(s?.canceledOrders)}
        icon={<XCircle />}
        colorClass="text-rose-600"
        description={DESCS.canceledOrders}
        onClick={() =>
          onStatClick?.({
            statuses: ["CUSTOMER_CANCELED", "MERCHANT_CANCELED"]
          })
        }
      />

      {/* NEW: Refund Revenue (แสดงเป็นค่าลบเพื่อสื่อว่าจ่ายออก) */}
      <StatCard
        title="Refund success"
        value={val(s?.refundSuccessOrders)}
        icon={<DollarSign />}
        colorClass="text-red-600"
        description={DESCS.refundSuccessOrders}
        onClick={() => onStatClick?.({ statuses: ["REFUND_SUCCESS"] })}
      />

      <StatCard
        title="Total Revenue"
        value={loading ? "…" : `฿${(s?.totalRevenue ?? 0).toLocaleString()}`}
        icon={<DollarSign />}
        colorClass="text-green-600"
        description={DESCS.totalRevenue}
      />
    </div>
  )
}
