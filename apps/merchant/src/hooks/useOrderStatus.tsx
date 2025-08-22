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
   * ตรวจสอบว่าสถานะที่ระบุเป็นสถานะสิ้นสุด (Terminal Status) หรือไม่
   * ใช้สำหรับตัดสินใจว่าจะแสดง Ideal Timeline หรือ ประวัติที่เกิดขึ้นจริง
   */
  const isTerminalStatus = (status: OrderStatus): boolean => {
    return [
      "COMPLETE",
      "CUSTOMER_CANCELED",
      "MERCHANT_REJECT", // สถานะใหม่: ร้านค้ายกเลิก
      "REFUND_SUCCESS",
      "REFUND_FAIL"
    ].includes(status)
  }
  /**
   * รวม Timeline จริง + Ideal Path ต่อจากสถานะปัจจุบัน
   */

  const getMergedTimeline = (
    currentStatus: OrderStatus,
    history: OrderStatus[]
  ): OrderStatus[] => {
    const idealTimeline = getStatusTimeline(currentStatus)
    const lastStatus = history[history.length - 1]

    // หาตำแหน่ง lastStatus ใน ideal path
    const lastIndex = idealTimeline.indexOf(lastStatus)

    // ถ้าเจอ ให้ตัดเฉพาะส่วนที่ยังไม่เกิดขึ้นจริง
    const remainingPath =
      lastIndex >= 0 ? idealTimeline.slice(lastIndex + 1) : idealTimeline

    return [...history, ...remainingPath]
  }

  /**
   * กำหนด Timeline ในอุดมคติ (Ideal Path) สำหรับแต่ละ Flow ของออเดอร์
   */
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
        "RECIEVE_RETURN", // สถานะใหม่: ได้รับของคืน
        "RETURN_VERIFIED",
        "REFUND_APPROVED",
        "REFUND_SUCCESS"
      ].includes(currentStatus)
    ) {
      return [
        "REFUND_REQUEST",
        "AWAITING_RETURN",
        "RECIEVE_RETURN",
        "RETURN_VERIFIED",
        "REFUND_APPROVED",
        "REFUND_SUCCESS"
      ]
    }

    // Refund fail flow
    if (["RETURN_FAIL", "REFUND_FAIL"].includes(currentStatus)) {
      return [
        "REFUND_REQUEST",
        "AWAITING_RETURN",
        "RECIEVE_RETURN",
        "RETURN_VERIFIED",
        "REFUND_FAIL" // หรืออาจจะเป็น RETURN_FAIL ขึ้นอยู่กับจะแสดงผลอย่างไร
      ]
    }

    // Problem during transit flow
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

    // Canceled by Customer flow
    if (["CUSTOMER_CANCELED"].includes(currentStatus)) {
      return ["PENDING", "CUSTOMER_CANCELED"]
    }

    // Canceled by Merchant flow (สถานะใหม่)
    if (["MERCHANT_REJECT"].includes(currentStatus)) {
      return ["PENDING", "PAID", "MERCHANT_REJECT"]
    }

    // Default to normal flow if no match
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

  /**
   * กำหนดว่าร้านค้าสามารถเปลี่ยนสถานะเป็นอะไรได้บ้างจากสถานะปัจจุบัน
   */
  const getMerchantEditableStatuses = (
    currentStatus: OrderStatus
  ): OrderStatus[] => {
    switch (currentStatus) {
      case "PAID":
        // ร้านค้าสามารถ: ยืนยันออเดอร์, คืนเงินทันที, หรือปฏิเสธออเดอร์
        return ["PROCESSING", "REFUND_APPROVED", "MERCHANT_REJECT"]
      case "PROCESSING":
        return ["READY_TO_SHIP"]
      case "READY_TO_SHIP":
        return ["SHIPPED"]
      case "REFUND_REQUEST":
        return ["REFUND_APPROVED"]
      case "AWAITING_RETURN":
        return ["RETURN_FAIL"]
      case "RECIEVE_RETURN": // สถานะใหม่: ได้รับของคืนแล้ว
        return ["RETURN_VERIFIED", "RETURN_FAIL"]
      case "RETURN_VERIFIED":
        return ["REFUND_APPROVED"]
      default:
        return []
    }
  }

  /**
   * กำหนดไอคอนสำหรับแต่ละสถานะ
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
        return <Ban className="h-4 w-4 text-red-500" /> // ไอคอนใหม่
      case "REFUND_REQUEST":
        return <RotateCcw className="h-4 w-4" />
      case "AWAITING_RETURN":
        return <Undo2 className="h-4 w-4" />
      case "RECIEVE_RETURN":
        return <Package className="h-4 w-4" /> // ไอคอนใหม่
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
   * กำหนดข้อความสำหรับแต่ละสถานะ
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
      MERCHANT_REJECT: "Order Canceled by Merchant", // ข้อความใหม่
      REFUND_REQUEST: "Refund requested",
      AWAITING_RETURN: "Awaiting return",
      RECIEVE_RETURN: "Return received", // ข้อความใหม่
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
   * กำหนดสีสำหรับ Timeline (Active, Passed, Future)
   */
  const getStatusColor = (
    status: OrderStatus,
    isActive: boolean = false,
    isPassed: boolean = false
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
          return "bg-red-500 border-red-500 text-white" // สีใหม่
        case "REFUND_REQUEST":
          return "bg-orange-500 border-orange-500 text-white"
        case "AWAITING_RETURN":
          return "bg-orange-500 border-orange-500 text-white"
        case "RECIEVE_RETURN":
          return "bg-orange-500 border-orange-500 text-white" // สีใหม่
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
   * กำหนดสีสำหรับ Badge ที่ใช้แสดงในตารางหรือลิสต์
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
        return "bg-red-100 text-red-800 border-red-300" // Badge ใหม่
      case "REFUND_REQUEST":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "AWAITING_RETURN":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "RECIEVE_RETURN":
        return "bg-yellow-100 text-yellow-800 border-yellow-300" // Badge ใหม่
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

  // ส่งออกฟังก์ชันทั้งหมดเพื่อให้ Component อื่นนำไปใช้
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
