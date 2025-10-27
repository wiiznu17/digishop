// apps/portal/src/components/commerce/orders/OrdersFilterBar.tsx
"use client"

import { Calendar, CalendarDays } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { AdminOrderStatus } from "@/types/commerce/orders"

const STATUS_OPTIONS: { value: AdminOrderStatus | "ALL"; label: string }[] = (
  [
    "PENDING",
    "PAID",
    "PROCESSING",
    "READY_TO_SHIP",
    "HANDED_OVER",
    "SHIPPED",
    "DELIVERED",
    "COMPLETE",
    "MERCHANT_CANCELED",
    "REFUND_REQUEST",
    "REFUND_PROCESSING",
    "REFUND_SUCCESS",
    "REFUND_FAIL"
  ] as AdminOrderStatus[]
).map((s) => ({ value: s, label: s }))
STATUS_OPTIONS.unshift({ value: "ALL", label: "All status" })

export function OrdersFilterBar({
  status,
  onStatusChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange
}: {
  status: AdminOrderStatus | "ALL"
  onStatusChange: (s: AdminOrderStatus | "ALL") => void
  dateFrom: string
  onDateFromChange: (v: string) => void
  dateTo: string
  onDateToChange: (v: string) => void
}) {
  return (
    <>
      <div>
        <label className="block text-sm mb-1">Status</label>
        <Select
          value={status}
          onValueChange={(v) => onStatusChange(v as AdminOrderStatus)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm mb-1">From</label>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1">To</label>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
          />
        </div>
      </div>
    </>
  )
}
