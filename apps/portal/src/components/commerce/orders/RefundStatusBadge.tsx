"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"

export type RefundStatus =
  | "REQUESTED"
  | "APPROVED"
  | "SUCCESS"
  | "FAIL"
  | "CANCELED"

const REFUND_STATUS_CLASS: Record<RefundStatus, string> = {
  REQUESTED: "bg-amber-100 text-amber-800 border-amber-300",
  APPROVED: "bg-blue-100 text-blue-800 border-blue-300",
  SUCCESS: "bg-emerald-100 text-emerald-800 border-emerald-300",
  FAIL: "bg-rose-100 text-rose-800 border-rose-300",
  CANCELED: "bg-slate-100 text-slate-800 border-slate-300"
}

export const RefundStatusBadge = React.memo(function RefundStatusBadge({
  status
}: {
  status: RefundStatus
}) {
  return (
    <Badge
      variant="outline"
      className={`border ${REFUND_STATUS_CLASS[status]} font-medium`}
    >
      {status}
    </Badge>
  )
})
