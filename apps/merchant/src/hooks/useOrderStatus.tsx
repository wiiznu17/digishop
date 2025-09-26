"use client"

import {
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  CreditCard,
  AlertTriangle,
  RotateCcw,
  Ban,
  PackageCheck,
  Home,
  ThumbsUp,
  Package,
  Undo2,
  Repeat2
} from "lucide-react"
import { OrderStatus } from "@/types/props/orderProp"

export const useOrderStatus = () => {
  const isTerminalStatus = (status: OrderStatus): boolean => {
    return [
      "COMPLETE",
      "CUSTOMER_CANCELED",
      "REFUND_SUCCESS",
      "RETURN_FAIL"
    ].includes(status)
  }

  const NORMAL_FLOW: OrderStatus[] = [
    "PENDING",
    "PAID",
    "PROCESSING",
    "READY_TO_SHIP",
    "HANDED_OVER",
    "SHIPPED",
    "DELIVERED",
    "COMPLETE"
  ]

  const REFUND_FLOW_FROM_PAID: OrderStatus[] = [
    "REFUND_REQUEST",
    "REFUND_APPROVED",
    "REFUND_PROCESSING",
    "REFUND_SUCCESS"
  ]

  const REFUND_FLOW_FROM_DELIVERED: OrderStatus[] = [
    "REFUND_REQUEST",
    "AWAITING_RETURN",
    "RECEIVE_RETURN",
    "RETURN_VERIFIED",
    "REFUND_APPROVED",
    "REFUND_PROCESSING",
    "REFUND_SUCCESS"
  ]

  const REFUND_FAMILY = new Set<OrderStatus>([
    "REFUND_REQUEST",
    "AWAITING_RETURN",
    "RECEIVE_RETURN",
    "RETURN_VERIFIED",
    "RETURN_FAIL",
    "REFUND_REJECTED",
    "REFUND_APPROVED",
    "REFUND_PROCESSING",
    "REFUND_SUCCESS",
    "REFUND_FAIL",
    "REFUND_RETRY"
  ])

  const RETURN_SIDE_HINT = new Set<OrderStatus>([
    "AWAITING_RETURN",
    "RECEIVE_RETURN",
    "RETURN_VERIFIED",
    "RETURN_FAIL"
  ])

  const uniqInOrder = (arr: OrderStatus[]) => {
    const seen = new Set<OrderStatus>()
    const out: OrderStatus[] = []
    for (const s of arr) {
      if (!seen.has(s)) {
        seen.add(s)
        out.push(s)
      }
    }
    return out
  }

  // const getMergedTimeline = (
  //   currentStatus: OrderStatus,
  //   history: OrderStatus[]
  // ): OrderStatus[] => {
  //   const hist = history && history.length ? history : [currentStatus]
  //   const last = hist[hist.length - 1]
  //   if (isTerminalStatus(last)) return hist

  //   let composite: OrderStatus[] = [...NORMAL_FLOW]

  //   const hasTransitLack =
  //     hist.includes("TRANSIT_LACK") || currentStatus === "TRANSIT_LACK"
  //   const hasReTransit =
  //     hist.includes("RE_TRANSIT") || currentStatus === "RE_TRANSIT"

  //   if (hasTransitLack || hasReTransit) {
  //     const shippedIdx = composite.indexOf("SHIPPED")
  //     const deliveredIdx = composite.indexOf("DELIVERED")
  //     if (
  //       shippedIdx !== -1 &&
  //       deliveredIdx !== -1 &&
  //       shippedIdx < deliveredIdx
  //     ) {
  //       const middle: OrderStatus[] = []
  //       if (hasTransitLack) middle.push("TRANSIT_LACK")
  //       if (hasReTransit) middle.push("RE_TRANSIT")
  //       composite = [
  //         ...composite.slice(0, shippedIdx + 1),
  //         ...middle,
  //         ...composite.slice(deliveredIdx)
  //       ]
  //     }
  //   }

  //   const isRefundCase =
  //     hist.some((s) => REFUND_FAMILY.has(s)) || REFUND_FAMILY.has(currentStatus)

  //   if (isRefundCase) {
  //     const firstRefundIdx = hist.findIndex((s) => REFUND_FAMILY.has(s))
  //     const wentDeliveredBeforeRefund =
  //       hist.includes("DELIVERED") ||
  //       RETURN_SIDE_HINT.has(currentStatus) ||
  //       (firstRefundIdx > -1 &&
  //         hist.slice(0, firstRefundIdx).includes("DELIVERED"))

  //     const refundSegment = wentDeliveredBeforeRefund
  //       ? REFUND_FLOW_FROM_DELIVERED
  //       : REFUND_FLOW_FROM_PAID
  //     const pivot = wentDeliveredBeforeRefund ? "DELIVERED" : "PAID"
  //     const pivotIdx = composite.indexOf(pivot)
  //     const baseUpToPivot =
  //       pivotIdx >= 0 ? composite.slice(0, pivotIdx + 1) : [...composite]

  //     composite = [...baseUpToPivot, ...refundSegment]

  //     if (hist.includes("REFUND_REJECTED")) {
  //       if (wentDeliveredBeforeRefund) {
  //         composite = uniqInOrder([
  //           ...baseUpToPivot,
  //           "REFUND_REQUEST",
  //           "REFUND_REJECTED",
  //           "COMPLETE"
  //         ])
  //       } else {
  //         const afterPaid = NORMAL_FLOW.slice(NORMAL_FLOW.indexOf("PAID") + 1)
  //         composite = uniqInOrder([
  //           ...baseUpToPivot,
  //           "REFUND_REQUEST",
  //           "REFUND_REJECTED",
  //           ...afterPaid
  //         ])
  //       }
  //     }

  //     // แทรก RE-TRY ระหว่าง APPROVED ↔ PROCESSING ถ้าเคย fail
  //     if (hist.includes("REFUND_FAIL") || currentStatus === "REFUND_RETRY") {
  //       const idxApproved = composite.indexOf("REFUND_APPROVED")
  //       if (idxApproved !== -1) {
  //         // แทรก REFUND_RETRY หลัง APPROVED เผื่อเกิดการลองใหม่
  //         composite = uniqInOrder([
  //           ...composite.slice(0, idxApproved + 1),
  //           "REFUND_RETRY",
  //           ...composite.slice(idxApproved + 1)
  //         ])
  //       }
  //     }
  //   }

  //   const lastIdxInComposite = composite.indexOf(last)
  //   const remaining =
  //     lastIdxInComposite >= 0
  //       ? composite.slice(lastIdxInComposite + 1)
  //       : composite
  //   return uniqInOrder([...hist, ...remaining])
  // }
  const getMergedTimeline = (
    currentStatus: OrderStatus,
    history: OrderStatus[]
  ): OrderStatus[] => {
    const hist = history && history.length ? history : [currentStatus]
    //const last = hist[hist.length - 1]
    return hist
  }

  const getMerchantEditableStatuses = (
    currentStatus: OrderStatus
  ): OrderStatus[] => {
    switch (currentStatus) {
      case "PAID":
        return ["PROCESSING", "MERCHANT_CANCELED"]
      case "PROCESSING":
        return ["READY_TO_SHIP"]
      case "READY_TO_SHIP":
        return ["HANDED_OVER"]
      case "REFUND_REQUEST":
        return ["REFUND_APPROVED", "REFUND_REJECTED"]
      case "REFUND_FAIL":
        return ["REFUND_RETRY"] // NEW: retry ปลอดภัย
      case "AWAITING_RETURN":
        return ["RECEIVE_RETURN", "RETURN_FAIL"]
      case "RECEIVE_RETURN":
        return ["RETURN_VERIFIED", "RETURN_FAIL"]
      case "RETURN_VERIFIED":
        return ["REFUND_APPROVED"]
      default:
        return []
    }
  }

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4" />
      case "PAID":
        return <CreditCard className="h-4 w-4" />
      case "PROCESSING":
        return <Package className="h-4 w-4" />
      case "READY_TO_SHIP":
        return <PackageCheck className="h-4 w-4" />
      case "HANDED_OVER":
      case "SHIPPED":
        return <Truck className="h-4 w-4" />
      case "DELIVERED":
        return <Home className="h-4 w-4" />
      case "COMPLETE":
        return <ThumbsUp className="h-4 w-4" />
      case "CUSTOMER_CANCELED":
        return <Ban className="h-4 w-4" />
      case "MERCHANT_CANCELED":
        return <Ban className="h-4 w-4" />
      case "REFUND_REQUEST":
        return <RotateCcw className="h-4 w-4" />
      case "REFUND_REJECTED":
        return <XCircle className="h-4 w-4" />
      case "AWAITING_RETURN":
        return <Undo2 className="h-4 w-4" />
      case "RECEIVE_RETURN":
        return <Package className="h-4 w-4" />
      case "RETURN_VERIFIED":
        return <CheckCircle className="h-4 w-4" />
      case "RETURN_FAIL":
        return <XCircle className="h-4 w-4" />
      case "REFUND_APPROVED":
        return <CheckCircle className="h-4 w-4" />
      case "REFUND_PROCESSING":
        return <Repeat2 className="h-4 w-4" />
      case "REFUND_SUCCESS":
        return <CheckCircle className="h-4 w-4" />
      case "REFUND_FAIL":
        return <XCircle className="h-4 w-4" />
      case "REFUND_RETRY":
        return <Repeat2 className="h-4 w-4" />
      case "TRANSIT_LACK":
        return <AlertTriangle className="h-4 w-4" />
      case "RE_TRANSIT":
        return <Repeat2 className="h-4 w-4" />
    }
  }

  const getStatusText = (status: OrderStatus) => {
    const statusMap: Record<OrderStatus, string> = {
      PENDING: "Awaiting payment",
      PAID: "Payment completed",
      PROCESSING: "Processing order",
      READY_TO_SHIP: "Ready to ship",
      HANDED_OVER: "Handed over to courier",
      SHIPPED: "Shipped",
      DELIVERED: "Delivered",
      COMPLETE: "Completed",
      CUSTOMER_CANCELED: "Customer canceled",
      MERCHANT_CANCELED: "Order canceled by merchant",
      REFUND_REQUEST: "Refund requested",
      REFUND_REJECTED: "Refund rejected",
      AWAITING_RETURN: "Awaiting return",
      RECEIVE_RETURN: "Return received",
      RETURN_VERIFIED: "Return verified",
      RETURN_FAIL: "Return failed",
      REFUND_APPROVED: "Refund approved",
      REFUND_PROCESSING: "Refund processing",
      REFUND_SUCCESS: "Refund successful",
      REFUND_FAIL: "Refund failed",
      REFUND_RETRY: "Retrying refund",
      TRANSIT_LACK: "Shipping issue",
      RE_TRANSIT: "Reshipping"
    }
    return statusMap[status]
  }

  const getStatusTextForReal = (status: OrderStatus) => {
    const statusMap: Record<OrderStatus, string> = {
      PENDING: "Awaiting payment",
      PAID: "Payment completed",
      PROCESSING: "Processing order",
      READY_TO_SHIP: "Ready to ship",
      HANDED_OVER: "Handed over to courier",
      SHIPPED: "Shipped",
      DELIVERED: "Delivered",
      COMPLETE: "Completed",
      CUSTOMER_CANCELED: "Canceled by customer",
      MERCHANT_CANCELED: "Canceled order",
      REFUND_REQUEST: "Refund requested",
      REFUND_REJECTED: "Refund rejected",
      AWAITING_RETURN: "Awaiting return",
      RECEIVE_RETURN: "Return received",
      RETURN_VERIFIED: "Return verified",
      RETURN_FAIL: "Return failed",
      REFUND_APPROVED: "Refund approved",
      REFUND_PROCESSING: "Refund processing",
      REFUND_SUCCESS: "Refund successful",
      REFUND_FAIL: "Refund failed",
      REFUND_RETRY: "Retry refund",
      TRANSIT_LACK: "Shipping issue",
      RE_TRANSIT: "Reshipping"
    }
    return statusMap[status]
  }

  const getStatusColor = (
    status: OrderStatus,
    isActive = false,
    isPassed = false
  ) => {
    if (isActive) {
      switch (status) {
        case "PENDING":
          return "bg-yellow-500 border-yellow-500 text-white"
        case "PAID":
          return "bg-green-500 border-green-500 text-white"
        case "PROCESSING":
          return "bg-blue-500 border-blue-500 text-white"
        case "READY_TO_SHIP":
          return "bg-indigo-500 border-indigo-500 text-white"
        case "HANDED_OVER":
          return "bg-sky-500 border-sky-500 text-white"
        case "SHIPPED":
          return "bg-purple-500 border-purple-500 text-white"
        case "DELIVERED":
          return "bg-emerald-500 border-emerald-500 text-white"
        case "CUSTOMER_CANCELED":
          return "bg-gray-500 border-gray-500 text-white"
        case "MERCHANT_CANCELED":
          return "bg-red-500 border-red-700 text-white"
        case "REFUND_REQUEST":
        case "AWAITING_RETURN":
        case "RECEIVE_RETURN":
        case "REFUND_PROCESSING":
        case "REFUND_FAIL":
          return "bg-red-500 border-red-700 text-white"
        case "REFUND_RETRY":
          return "bg-orange-500 border-orange-500 text-white"
        case "REFUND_REJECTED":
        case "TRANSIT_LACK":
          return "bg-red-500 border-red-500 text-white"
        default:
          return "bg-blue-500 border-blue-500 text-white"
      }
    } else if (isPassed) {
      return "bg-green-100 border-green-300 text-green-800"
    } else {
      return "bg-gray-100 border-gray-300 text-gray-500"
    }
  }

  const getStatusBadgeColor = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "PAID":
        return "bg-green-100 text-green-800 border-green-300"
      case "PROCESSING":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "READY_TO_SHIP":
        return "bg-indigo-100 text-indigo-800 border-indigo-300"
      case "HANDED_OVER":
        return "bg-sky-100 text-sky-800 border-sky-300"
      case "SHIPPED":
        return "bg-purple-100 text-purple-800 border-purple-300"
      case "DELIVERED":
      case "COMPLETE":
        return "bg-emerald-100 text-emerald-800 border-emerald-300"
      case "CUSTOMER_CANCELED":
        return "bg-gray-100 text-gray-800 border-gray-300"
      case "MERCHANT_CANCELED":
        return "bg-red-100 text-red-800 border-red-300"
      case "REFUND_REQUEST":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "AWAITING_RETURN":
      case "RECEIVE_RETURN":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "RETURN_VERIFIED":
        return "bg-green-100 text-green-800 border-green-300"
      case "RETURN_FAIL":
        return "bg-red-100 text-red-800 border-red-300"
      case "REFUND_APPROVED":
      case "REFUND_SUCCESS":
        return "bg-green-100 text-green-800 border-green-300"
      case "REFUND_PROCESSING":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "REFUND_FAIL":
      case "REFUND_REJECTED":
      case "TRANSIT_LACK":
        return "bg-red-100 text-red-800 border-red-300"
      case "REFUND_RETRY":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "RE_TRANSIT":
        return "bg-orange-100 text-orange-800 border-orange-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  return {
    isTerminalStatus,
    // getStatusTimeline,
    getMergedTimeline,
    getMerchantEditableStatuses,
    getStatusIcon,
    getStatusText,
    getStatusTextForReal,
    getStatusColor,
    getStatusBadgeColor
  }
}

// const getStatusTimeline = (currentStatus: OrderStatus): OrderStatus[] => {
//   if (
//     [
//       "PENDING",
//       "PAID",
//       "PROCESSING",
//       "READY_TO_SHIP",
//       "HANDED_OVER",
//       "SHIPPED",
//       "DELIVERED",
//       "COMPLETE"
//     ].includes(currentStatus)
//   )
//     return NORMAL_FLOW

//   if (
//     [
//       "REFUND_REQUEST",
//       "AWAITING_RETURN",
//       "RECEIVE_RETURN",
//       "RETURN_VERIFIED",
//       "REFUND_APPROVED",
//       "REFUND_PROCESSING",
//       "REFUND_SUCCESS",
//       "REFUND_RETRY"
//     ].includes(currentStatus)
//   )
//     return [
//       ...REFUND_FLOW_FROM_DELIVERED.slice(0, -1),
//       "REFUND_RETRY",
//       "REFUND_SUCCESS"
//     ]

//   if (["RETURN_FAIL", "REFUND_FAIL"].includes(currentStatus)) {
//     return [
//       "REFUND_REQUEST",
//       "AWAITING_RETURN",
//       "RECEIVE_RETURN",
//       "RETURN_VERIFIED",
//       "REFUND_FAIL"
//     ]
//   }

//   if (["TRANSIT_LACK", "RE_TRANSIT"].includes(currentStatus)) {
//     return [
//       "PENDING",
//       "PAID",
//       "PROCESSING",
//       "READY_TO_SHIP",
//       "HANDED_OVER",
//       "SHIPPED",
//       "TRANSIT_LACK",
//       "RE_TRANSIT",
//       "DELIVERED",
//       "COMPLETE"
//     ]
//   }

//   if (currentStatus === "CUSTOMER_CANCELED")
//     return ["PENDING", "CUSTOMER_CANCELED"]
//   if (currentStatus === "MERCHANT_CANCELED")
//     return [
//       "PENDING",
//       "PAID",
//       "MERCHANT_CANCELED",
//       "REFUND_PROCESSING",
//       "REFUND_SUCCESS"
//     ]

//   if (currentStatus === "REFUND_REJECTED")
//     return ["PENDING", "PAID", "REFUND_REQUEST", "REFUND_REJECTED"]

//   return NORMAL_FLOW
// }
