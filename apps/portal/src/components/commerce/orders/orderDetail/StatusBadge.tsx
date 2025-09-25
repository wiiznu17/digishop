"use client"

import { Badge } from "@/components/ui/badge"

export const ORDER_STATUS_CLASS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-300",
  PAID: "bg-emerald-100 text-emerald-800 border-emerald-300",
  PROCESSING: "bg-blue-100 text-blue-800 border-blue-300",
  READY_TO_SHIP: "bg-cyan-100 text-cyan-800 border-cyan-300",
  HANDED_OVER: "bg-sky-100 text-sky-800 border-sky-300",
  SHIPPED: "bg-indigo-100 text-indigo-800 border-indigo-300",
  DELIVERED: "bg-green-100 text-green-800 border-green-300",
  COMPLETE: "bg-green-200 text-green-900 border-green-300",
  MERCHANT_CANCELED: "bg-rose-100 text-rose-800 border-rose-300",
  REFUND_REQUEST: "bg-amber-100 text-amber-800 border-amber-300",
  REFUND_PROCESSING: "bg-yellow-100 text-yellow-800 border-yellow-300",
  REFUND_SUCCESS: "bg-teal-100 text-teal-800 border-teal-300",
  REFUND_FAIL: "bg-red-100 text-red-800 border-red-300"
}

export const PAYMENT_STATUS_CLASS: Record<string, string> = {
  SUCCESS: "bg-emerald-100 text-emerald-800 border-emerald-300",
  FAILED: "bg-red-100 text-red-800 border-red-300",
  PENDING: "bg-amber-100 text-amber-800 border-amber-300"
}

export const REFUND_STATUS_CLASS: Record<string, string> = {
  REQUESTED: "bg-amber-100 text-amber-800 border-amber-300",
  APPROVED: "bg-blue-100 text-blue-800 border-blue-300",
  SUCCESS: "bg-emerald-100 text-emerald-800 border-emerald-300",
  FAIL: "bg-red-100 text-red-800 border-red-300",
  CANCELED: "bg-slate-100 text-slate-800 border-slate-300"
}

export function StatusBadge({
  text,
  className
}: {
  text: string
  className: string
}) {
  return (
    <Badge variant="outline" className={`border font-medium ${className}`}>
      {text}
    </Badge>
  )
}
