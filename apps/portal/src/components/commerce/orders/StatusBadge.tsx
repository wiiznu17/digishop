"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { AdminOrderStatus } from "@/types/commerce/orders"

const ORDER_STATUS_CLASS: Record<AdminOrderStatus, string> = {
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
  REFUND_FAIL: "bg-red-100 text-red-800 border-red-300",
  CUSTOMER_CANCELED: "bg-rose-100 text-rose-800 border-rose-300",
  REFUND_REJECTED: "bg-rose-100 text-rose-800 border-rose-300",
  AWAITING_RETURN: "bg-purple-100 text-purple-800 border-purple-300",
  RECEIVE_RETURN: "bg-purple-200 text-purple-900 border-purple-300",
  RETURN_VERIFIED: "bg-purple-200 text-purple-900 border-purple-300",
  RETURN_FAIL: "bg-red-100 text-red-800 border-red-300",
  REFUND_APPROVED: "bg-blue-100 text-blue-800 border-blue-300",
  REFUND_RERY: "bg-yellow-100 text-yellow-800 border-yellow-300",
  TRANSIT_LACK: "bg-red-100 text-red-800 border-red-300",
  RE_TRANSIT: "bg-yellow-100 text-yellow-800 border-yellow-300"
}

export const StatusBadge = React.memo(function StatusBadge({
  status
}: {
  status: AdminOrderStatus
}) {
  return (
    <Badge
      variant="outline"
      className={`border ${ORDER_STATUS_CLASS[status]} font-medium`}
    >
      {status}
    </Badge>
  )
})
