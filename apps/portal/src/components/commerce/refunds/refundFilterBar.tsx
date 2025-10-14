"use client"

import * as React from "react"
import { X, Search, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

type Filters = {
  q?: string
  orderCode?: string
  status?: string // "ALL" | ...
  dateFrom?: string // ISO-8601 string for <input type="datetime-local">
  dateTo?: string
}

export type RefundsFilterBarProps = {
  defaultFilters?: Filters
  className?: string
  onApply: (filters: Filters) => void
  onClear?: () => void
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "REQUESTED", label: "REQUESTED" },
  { value: "APPROVED", label: "APPROVED" },
  { value: "PROCESSING", label: "PROCESSING" },
  { value: "SUCCESS", label: "SUCCESS" },
  { value: "FAIL", label: "FAIL" }
]

export default function RefundsFilterBar({
  defaultFilters,
  className,
  onApply,
  onClear
}: RefundsFilterBarProps) {
  const [q, setQ] = React.useState(defaultFilters?.q ?? "")
  const [orderCode, setOrderCode] = React.useState(
    defaultFilters?.orderCode ?? ""
  )
  const [status, setStatus] = React.useState(defaultFilters?.status ?? "ALL")
  const [dateFrom, setDateFrom] = React.useState(defaultFilters?.dateFrom ?? "")
  const [dateTo, setDateTo] = React.useState(defaultFilters?.dateTo ?? "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onApply({
      q: q.trim() || undefined,
      orderCode: orderCode.trim() || undefined,
      status: status || "ALL",
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined
    })
  }

  const handleClear = () => {
    setQ("")
    setOrderCode("")
    setStatus("ALL")
    setDateFrom("")
    setDateTo("")
    onApply({
      q: undefined,
      orderCode: undefined,
      status: "ALL",
      dateFrom: undefined,
      dateTo: undefined
    })
    onClear?.()
  }

  const hasAnyFilter =
    !!q.trim() ||
    !!orderCode.trim() ||
    (status && status !== "ALL") ||
    !!dateFrom ||
    !!dateTo

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "w-full rounded-xl border bg-background/50 p-3 sm:p-4 shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:flex-wrap">
        {/* ค้นหาชื่อลูกค้า */}
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs font-medium mb-1">
            Customer name
          </label>
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search customer name…"
              className="w-full rounded-md border px-8 py-2 text-sm"
            />
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
            {!!q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
                aria-label="clear"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Suggest: Order Code */}
        <div className="min-w-[200px]">
          <label className="block text-xs font-medium mb-1">Order code</label>
          <input
            value={orderCode}
            onChange={(e) => setOrderCode(e.target.value)}
            placeholder="e.g. DGS172…"
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        {/* Status */}
        <div className="min-w-[170px]">
          <label className="block text-xs font-medium mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date range — ทำให้ช่องแคบลง */}
        <div className="min-w-[160px]">
          <label className="block text-xs font-medium mb-1">From</label>
          <input
            type="datetime-local"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40 sm:w-44 rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="min-w-[160px]">
          <label className="block text-xs font-medium mb-1">To</label>
          <input
            type="datetime-local"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40 sm:w-44 rounded-md border px-3 py-2 text-sm"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-md border bg-primary/90 text-primary-foreground hover:bg-primary px-4 py-2 text-sm"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-md border px-3 py-2 text-sm hover:bg-muted inline-flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Clear filters
          </button>
        </div>
      </div>

      {/* แสดงว่ามีตัวกรองอยู่ */}
      {hasAnyFilter && (
        <div className="mt-2 text-xs text-muted-foreground">
          Filters applied. Click{" "}
          <span className="font-medium">Clear filters</span> to reset.
        </div>
      )}
    </form>
  )
}
