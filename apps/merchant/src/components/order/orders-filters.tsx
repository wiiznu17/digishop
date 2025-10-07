"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RotateCcw, SlidersHorizontal } from "lucide-react"
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue
} from "@/components/ui/multi-select" // <- ใช้ lib multi-select ของคุณ หรือเปลี่ยนเป็น combobox custom ก็ได้
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

export type SortField = "id" | "createdAt" | "updatedAt" | "grandTotalMinor"
export type SortDir = "ASC" | "DESC"

export interface OrdersFiltersValue {
  q: string
  statuses: string[] // multi
  sortBy: SortField
  sortDir: SortDir
  hasTracking?: "true" | "false" | "" // optional
}

export function OrdersFilters({
  initial,
  onApply,
  onReset
}: {
  initial: OrdersFiltersValue
  onApply: (v: OrdersFiltersValue) => void
  onReset: () => void
}) {
  const [q, setQ] = useState(initial.q)
  const [statuses, setStatuses] = useState<string[]>(initial.statuses)
  const [sortBy, setSortBy] = useState<SortField>(initial.sortBy)
  const [sortDir, setSortDir] = useState<SortDir>(initial.sortDir)
  const [hasTracking, setHasTracking] = useState<"" | "true" | "false">(
    initial.hasTracking ?? ""
  )
  const ALL = "__ALL__" // sentinel แทน "All"

  useEffect(() => {
    setQ(initial.q)
    setStatuses(initial.statuses)
    setSortBy(initial.sortBy)
    setSortDir(initial.sortDir)
    setHasTracking(initial.hasTracking ?? "")
  }, [initial])

  const statusOptions = useMemo(
    () => [
      "PENDING",
      "PAID",
      "PROCESSING",
      "READY_TO_SHIP",
      "HANDED_OVER",
      "SHIPPED",
      "DELIVERED",
      "COMPLETE",
      "CUSTOMER_CANCELED",
      "MERCHANT_CANCELED",
      "TRANSIT_LACK",
      "RE_TRANSIT",
      "REFUND_REQUEST",
      "AWAITING_RETURN",
      "RECEIVE_RETURN",
      "RETURN_VERIFIED",
      "RETURN_FAIL",
      "REFUND_APPROVED",
      "REFUND_PROCESSING",
      "REFUND_SUCCESS",
      "REFUND_FAIL",
      "REFUND_RETRY"
    ],
    []
  )

  const apply = () => onApply({ q, statuses, sortBy, sortDir, hasTracking })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search order id / order code…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button onClick={apply}>Search</Button>
        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="h-4 w-4 mr-1" /> Clear
        </Button>
        <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* multi status */}
        <MultiSelect value={statuses} onValueChange={setStatuses}>
          <MultiSelectTrigger>
            <MultiSelectValue placeholder="Filter by statuses..." />
          </MultiSelectTrigger>
          <MultiSelectContent>
            {statusOptions.map((s) => (
              <MultiSelectItem key={s} value={s}>
                {s}
              </MultiSelectItem>
            ))}
          </MultiSelectContent>
        </MultiSelect>

        {/* tracking */}
        <Select
          value={hasTracking === "" ? ALL : hasTracking}
          onValueChange={(v) =>
            setHasTracking(v === ALL ? "" : (v as "true" | "false"))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Tracking filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All</SelectItem>
            <SelectItem value="true">With tracking</SelectItem>
            <SelectItem value="false">No tracking</SelectItem>
          </SelectContent>
        </Select>

        {/* sort */}
        <div className="flex gap-2">
          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as SortField)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort field" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Created</SelectItem>
              <SelectItem value="updatedAt">Updated</SelectItem>
              <SelectItem value="id">ID</SelectItem>
              <SelectItem value="grandTotalMinor">Grand total</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortDir}
            onValueChange={(v) => setSortDir(v as SortDir)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DESC">Descending</SelectItem>
              <SelectItem value="ASC">Ascending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
