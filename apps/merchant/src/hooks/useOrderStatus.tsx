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
  // กำหนด timeline สำหรับแต่ละ flow
  const getStatusTimeline = (currentStatus: OrderStatus): OrderStatus[] => {
    // Normal order flow
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
      return [
        "PENDING",
        "PAID",
        "PROCESSING",
        "READY_TO_SHIP",
        "SHIPPED",
        "DELIVERED",
        "COMPLETE"
      ]
    }

    // Refund flow
    if (
      [
        "REFUND_REQUEST",
        "AWAITING_RETURN",
        "RETURN_VERIFIED",
        "REFUND_APPROVED",
        "REFUND_SUCCESS"
      ].includes(currentStatus)
    ) {
      return [
        "REFUND_REQUEST",
        "AWAITING_RETURN",
        "RETURN_VERIFIED",
        "REFUND_APPROVED",
        "REFUND_SUCCESS"
      ]
    }

    // Problem flow
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

    // Canceled flow
    if (["CUSTOMER_CANCELED"].includes(currentStatus)) {
      return ["PENDING", "CUSTOMER_CANCELED"]
    }

    // Default normal flow
    return [
      "PENDING",
      "PAID",
      "PROCESSING",
      "READY_TO_SHIP",
      "SHIPPED",
      "DELIVERED",
      "COMPLETE"
    ]
  }

  const getMerchantEditableStatuses = (
    currentStatus: OrderStatus
  ): OrderStatus[] => {
    switch (currentStatus) {
      case "PAID":
        return ["PROCESSING", "REFUND_APPROVED"]
      case "PROCESSING":
        return ["READY_TO_SHIP"]
      case "READY_TO_SHIP":
        return ["SHIPPED"]
      case "SHIPPED":
        return ["DELIVERED", "TRANSIT_LACK"]
      case "TRANSIT_LACK":
        return ["RE_TRANSIT"]
      case "RE_TRANSIT":
        return ["TRANSIT_LACK", "DELIVERED"]
      case "REFUND_REQUEST":
        return ["REFUND_APPROVED"]
      case "AWAITING_RETURN":
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
      case "CUSTOMER_CANCELED":
        return <Ban className="h-4 w-4" />
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
      case "REFUND_REQUEST":
        return <RotateCcw className="h-4 w-4" />
      case "TRANSIT_LACK":
        return <AlertTriangle className="h-4 w-4" />
      case "RE_TRANSIT":
        return <Repeat2 className="h-4 w-4" />
      case "AWAITING_RETURN":
        return <Undo2 className="h-4 w-4" />
      case "RETURN_FAIL":
        return <XCircle className="h-4 w-4" />
      case "RETURN_VERIFIED":
        return <CheckCircle className="h-4 w-4" />
      case "REFUND_APPROVED":
        return <CheckCircle className="h-4 w-4" />
      case "REFUND_FAIL":
        return <XCircle className="h-4 w-4" />
      case "REFUND_SUCCESS":
        return <CheckCircle className="h-4 w-4" />
      case "COMPLETE":
        return <ThumbsUp className="h-4 w-4" />
    }
  }

  const getStatusText = (status: OrderStatus) => {
    const statusMap = {
      PENDING: "รอการชำระเงิน",
      CUSTOMER_CANCELED: "ลูกค้ายกเลิก",
      PAID: "ชำระเงินแล้ว",
      PROCESSING: "กำลังเตรียมสินค้า",
      READY_TO_SHIP: "พร้อมจัดส่ง",
      SHIPPED: "จัดส่งแล้ว",
      DELIVERED: "จัดส่งสำเร็จ",
      REFUND_REQUEST: "ขอคืนเงิน",
      TRANSIT_LACK: "ปัญหาการจัดส่ง",
      RE_TRANSIT: "กำลังจัดส่งใหม่อีกครั้ง",
      AWAITING_RETURN: "รอการส่งคืน",
      RETURN_FAIL: "ส่งคืนไม่สำเร็จ",
      RETURN_VERIFIED: "ยืนยันการส่งคืน",
      REFUND_APPROVED: "อนุมัติคืนเงิน",
      REFUND_FAIL: "คืนเงินไม่สำเร็จ",
      REFUND_SUCCESS: "คืนเงินสำเร็จ",
      COMPLETE: "เสร็จสิ้น"
    }
    return statusMap[status]
  }

  const getStatusColor = (
    status: OrderStatus,
    isActive: boolean = false,
    isPassed: boolean = false
  ) => {
    if (isActive) {
      switch (status) {
        case "PENDING":
          return "bg-yellow-500 border-yellow-500 text-white"
        case "CUSTOMER_CANCELED":
          return "bg-gray-500 border-gray-500 text-white"
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
        case "REFUND_REQUEST":
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

  // Simple badge colors for table/list views
  const getStatusBadgeColor = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "CUSTOMER_CANCELED":
        return "bg-gray-100 text-gray-800 border-gray-300"
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
      case "REFUND_REQUEST":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "TRANSIT_LACK":
        return "bg-red-100 text-red-800 border-red-300"
      case "RE_TRANSIT":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "AWAITING_RETURN":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "RETURN_FAIL":
        return "bg-red-100 text-red-800 border-red-300"
      case "RETURN_VERIFIED":
        return "bg-green-100 text-green-800 border-green-300"
      case "REFUND_APPROVED":
        return "bg-green-100 text-green-800 border-green-300"
      case "REFUND_FAIL":
        return "bg-red-100 text-red-800 border-red-300"
      case "REFUND_SUCCESS":
        return "bg-green-100 text-green-800 border-green-300"
      case "COMPLETE":
        return "bg-emerald-100 text-emerald-800 border-emerald-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  return {
    getStatusTimeline,
    getMerchantEditableStatuses,
    getStatusIcon,
    getStatusText,
    getStatusColor,
    getStatusBadgeColor
  }
}
