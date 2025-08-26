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
  /**
   * Check if a status is terminal (order cannot progress further)
   */
  const isTerminalStatus = (status: OrderStatus): boolean => {
    return [
      "COMPLETE",
      "CUSTOMER_CANCELED",
      "MERCHANT_REJECT", // canceled by merchant
      "REFUND_SUCCESS",
      "REFUND_FAIL",
      "RETURN_FAIL" // end state
    ].includes(status)
  }

  /**
   * Merge real history + remaining ideal timeline
   */
  const NORMAL_FLOW: OrderStatus[] = [
    "PENDING",
    "PAID",
    "PROCESSING",
    "READY_TO_SHIP",
    "SHIPPED",
    "DELIVERED",
    "COMPLETE"
  ]

  const REFUND_FLOW_FROM_PAID: OrderStatus[] = [
    "REFUND_REQUEST",
    "REFUND_APPROVED",
    "REFUND_SUCCESS" // can end in success or fail
  ]

  const REFUND_FLOW_FROM_DELIVERED: OrderStatus[] = [
    "REFUND_REQUEST",
    "AWAITING_RETURN",
    "RECEIVE_RETURN",
    "RETURN_VERIFIED",
    "REFUND_APPROVED",
    "REFUND_SUCCESS"
  ]

  // All refund-related statuses
  const REFUND_FAMILY = new Set<OrderStatus>([
    "REFUND_REQUEST",
    "AWAITING_RETURN",
    "RECEIVE_RETURN",
    "RETURN_VERIFIED",
    "RETURN_FAIL",
    "REFUND_APPROVED",
    "REFUND_SUCCESS",
    "REFUND_FAIL"
  ])

  // Hint: refund branch comes from delivered side
  const RETURN_SIDE_HINT = new Set<OrderStatus>([
    "AWAITING_RETURN",
    "RECEIVE_RETURN",
    "RETURN_VERIFIED",
    "RETURN_FAIL"
  ])

  // Dedupe while preserving order
  const uniqInOrder = (arr: OrderStatus[]) => {
    const seen = new Set<OrderStatus>()
    const out: OrderStatus[] = []
    for (const s of arr) {
      if (!seen.has(s)) {
        seen.add(s)
        out.push(s)
      }
    }
    console.log("Timeline", out)
    return out
  }

  /**
   * Build merged timeline:
   * - start from normal flow
   * - insert transit issues if exist
   * - insert refund branch if exist
   * - append remaining ideal path after history
   * - dedupe
   */
  const getMergedTimeline = (
    currentStatus: OrderStatus,
    history: OrderStatus[]
  ): OrderStatus[] => {
    const hist = history && history.length ? history : [currentStatus]
    // console.log("History", hist)
    // stop if last status is terminal
    const last = hist[hist.length - 1]
    if (isTerminalStatus(last)) {
      return hist
    }

    // 1) base = normal flow
    let composite: OrderStatus[] = [...NORMAL_FLOW]

    // 2) insert transit issues (TRANSIT_LACK / RE_TRANSIT) if present
    const hasTransitLack =
      hist.includes("TRANSIT_LACK") || currentStatus === "TRANSIT_LACK"
    const hasReTransit =
      hist.includes("RE_TRANSIT") || currentStatus === "RE_TRANSIT"

    if (hasTransitLack || hasReTransit) {
      const shippedIdx = composite.indexOf("SHIPPED")
      const deliveredIdx = composite.indexOf("DELIVERED")
      if (
        shippedIdx !== -1 &&
        deliveredIdx !== -1 &&
        shippedIdx < deliveredIdx
      ) {
        const middle: OrderStatus[] = []
        if (hasTransitLack) middle.push("TRANSIT_LACK")
        if (hasReTransit) middle.push("RE_TRANSIT")
        composite = [
          ...composite.slice(0, shippedIdx + 1),
          ...middle,
          ...composite.slice(deliveredIdx)
        ]
      }
    }

    // 3) add refund branch if exists
    const isRefundCase =
      hist.some((s) => REFUND_FAMILY.has(s)) || REFUND_FAMILY.has(currentStatus)

    if (isRefundCase) {
      const wentDeliveredBeforeRefund =
        hist.includes("DELIVERED") ||
        RETURN_SIDE_HINT.has(currentStatus) ||
        hist.some((s) => RETURN_SIDE_HINT.has(s))

      const refundSegment = wentDeliveredBeforeRefund
        ? REFUND_FLOW_FROM_DELIVERED
        : REFUND_FLOW_FROM_PAID

      const pivot = wentDeliveredBeforeRefund ? "DELIVERED" : "PAID"
      const pivotIdx = composite.indexOf(pivot)
      const baseUpToPivot =
        pivotIdx >= 0 ? composite.slice(0, pivotIdx + 1) : [...composite]

      composite = [...baseUpToPivot, ...refundSegment]
    }

    // 4) merge history + remaining path
    const lastIdxInComposite = composite.indexOf(last)
    const remaining =
      lastIdxInComposite >= 0
        ? composite.slice(lastIdxInComposite + 1)
        : composite

    // 5) return merged + deduped
    return uniqInOrder([...hist, ...remaining])
  }

  /**
   * Ideal timelines for different flows
   */
  const getStatusTimeline = (currentStatus: OrderStatus): OrderStatus[] => {
    if (
      [
        "PENDING",
        "PAID",
        "PROCESSING",
        "READY_TO_SHIP",
        "SHIPPED",
        "DELIVERED",
        "COMPLETE"
      ].includes(currentStatus)
    ) {
      return NORMAL_FLOW
    }

    if (
      [
        "REFUND_REQUEST",
        "AWAITING_RETURN",
        "RECEIVE_RETURN",
        "RETURN_VERIFIED",
        "REFUND_APPROVED",
        "REFUND_SUCCESS"
      ].includes(currentStatus)
    ) {
      return REFUND_FLOW_FROM_DELIVERED
    }

    if (["RETURN_FAIL", "REFUND_FAIL"].includes(currentStatus)) {
      return [
        "REFUND_REQUEST",
        "AWAITING_RETURN",
        "RECEIVE_RETURN",
        "RETURN_VERIFIED",
        "REFUND_FAIL"
      ]
    }

    if (["TRANSIT_LACK", "RE_TRANSIT"].includes(currentStatus)) {
      return [
        "PENDING",
        "PAID",
        "PROCESSING",
        "READY_TO_SHIP",
        "SHIPPED",
        "TRANSIT_LACK",
        "RE_TRANSIT",
        "DELIVERED",
        "COMPLETE"
      ]
    }

    if (["CUSTOMER_CANCELED"].includes(currentStatus)) {
      return ["PENDING", "CUSTOMER_CANCELED"]
    }

    if (["MERCHANT_REJECT"].includes(currentStatus)) {
      return ["PENDING", "PAID", "MERCHANT_REJECT"]
    }

    return NORMAL_FLOW
  }

  /**
   * Merchant editable statuses from current state
   */
  const getMerchantEditableStatuses = (
    currentStatus: OrderStatus
  ): OrderStatus[] => {
    switch (currentStatus) {
      case "PAID":
        return ["PROCESSING", "REFUND_APPROVED", "MERCHANT_REJECT"]
      case "PROCESSING":
        return ["READY_TO_SHIP"]
      case "READY_TO_SHIP":
        return ["SHIPPED"]
      case "REFUND_REQUEST":
        return ["REFUND_APPROVED"]
      case "AWAITING_RETURN":
        return ["RETURN_FAIL"]
      case "RECEIVE_RETURN":
        return ["RETURN_VERIFIED", "RETURN_FAIL"]
      case "RETURN_VERIFIED":
        return ["REFUND_APPROVED"]
      default:
        return []
    }
  }

  /**
   * Map status -> icon
   */
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
      case "SHIPPED":
        return <Truck className="h-4 w-4" />
      case "DELIVERED":
        return <Home className="h-4 w-4" />
      case "COMPLETE":
        return <ThumbsUp className="h-4 w-4" />
      case "CUSTOMER_CANCELED":
        return <Ban className="h-4 w-4" />
      case "MERCHANT_REJECT":
        return <Ban className="h-4 w-4 text-red-500" />
      case "REFUND_REQUEST":
        return <RotateCcw className="h-4 w-4" />
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
      case "REFUND_SUCCESS":
        return <CheckCircle className="h-4 w-4" />
      case "REFUND_FAIL":
        return <XCircle className="h-4 w-4" />
      case "TRANSIT_LACK":
        return <AlertTriangle className="h-4 w-4" />
      case "RE_TRANSIT":
        return <Repeat2 className="h-4 w-4" />
    }
  }

  /**
   * Map status -> label text
   */
  const getStatusText = (status: OrderStatus) => {
    const statusMap = {
      PENDING: "Awaiting payment",
      PAID: "Payment completed",
      PROCESSING: "Processing order",
      READY_TO_SHIP: "Ready to ship",
      SHIPPED: "Shipped",
      DELIVERED: "Delivered",
      COMPLETE: "Completed",
      CUSTOMER_CANCELED: "Customer canceled",
      MERCHANT_REJECT: "Order Canceled by Merchant",
      REFUND_REQUEST: "Refund requested",
      AWAITING_RETURN: "Awaiting return",
      RECEIVE_RETURN: "Return received",
      RETURN_VERIFIED: "Return verified",
      RETURN_FAIL: "Return failed",
      REFUND_APPROVED: "Refund approved",
      REFUND_SUCCESS: "Refund successful",
      REFUND_FAIL: "Refund failed",
      TRANSIT_LACK: "Shipping issue",
      RE_TRANSIT: "Reshipping"
    }
    return statusMap[status]
  }

  /**
   * Status color in timeline (active/passed/future)
   */
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
        case "SHIPPED":
          return "bg-purple-500 border-purple-500 text-white"
        case "DELIVERED":
          return "bg-emerald-500 border-emerald-500 text-white"
        case "CUSTOMER_CANCELED":
          return "bg-gray-500 border-gray-500 text-white"
        case "MERCHANT_REJECT":
          return "bg-red-500 border-red-500 text-white"
        case "REFUND_REQUEST":
          return "bg-orange-500 border-orange-500 text-white"
        case "AWAITING_RETURN":
          return "bg-orange-500 border-orange-500 text-white"
        case "RECEIVE_RETURN":
          return "bg-orange-500 border-orange-500 text-white"
        case "TRANSIT_LACK":
          return "bg-red-500 border-red-500 text-white"
        case "RE_TRANSIT":
          return "bg-orange-100 text-orange-800 border-orange-200"
        default:
          return "bg-blue-500 border-blue-500 text-white"
      }
    } else if (isPassed) {
      return "bg-green-100 border-green-300 text-green-800"
    } else {
      return "bg-gray-100 border-gray-300 text-gray-500"
    }
  }

  /**
   * Status badge color for table/list
   */
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
      case "SHIPPED":
        return "bg-purple-100 text-purple-800 border-purple-300"
      case "DELIVERED":
        return "bg-emerald-100 text-emerald-800 border-emerald-300"
      case "COMPLETE":
        return "bg-emerald-100 text-emerald-800 border-emerald-300"
      case "CUSTOMER_CANCELED":
        return "bg-gray-100 text-gray-800 border-gray-300"
      case "MERCHANT_REJECT":
        return "bg-red-100 text-red-800 border-red-300"
      case "REFUND_REQUEST":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "AWAITING_RETURN":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "RECEIVE_RETURN":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "RETURN_VERIFIED":
        return "bg-green-100 text-green-800 border-green-300"
      case "RETURN_FAIL":
        return "bg-red-100 text-red-800 border-red-300"
      case "REFUND_APPROVED":
        return "bg-green-100 text-green-800 border-green-300"
      case "REFUND_SUCCESS":
        return "bg-green-100 text-green-800 border-green-300"
      case "REFUND_FAIL":
        return "bg-red-100 text-red-800 border-red-300"
      case "TRANSIT_LACK":
        return "bg-red-100 text-red-800 border-red-300"
      case "RE_TRANSIT":
        return "bg-orange-100 text-orange-800 border-orange-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  return {
    isTerminalStatus,
    getStatusTimeline,
    getMergedTimeline,
    getMerchantEditableStatuses,
    getStatusIcon,
    getStatusText,
    getStatusColor,
    getStatusBadgeColor
  }
}
