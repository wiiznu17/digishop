import {
  Clock,
  Ban,
  CreditCard,
  Package,
  PackageCheck,
  Truck,
  Home,
  RotateCcw,
  AlertTriangle,
  Undo2,
  XCircle,
  CheckCircle,
  ThumbsUp
} from "lucide-react"
import { OrderStatus } from "@/types/props/orderProp"

export const useOrderStatus = () => {
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

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "CUSTOMER_CANCELED":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "PAID":
        return "bg-green-100 text-green-800 border-green-200"
      case "PROCESSING":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "READY_TO_SHIP":
        return "bg-indigo-100 text-indigo-800 border-indigo-200"
      case "SHIPPED":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "DELIVERED":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "REFUND_REQUEST":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "TRANSIT_LACK":
        return "bg-red-100 text-red-800 border-red-200"
      case "AWAITING_RETURN":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "RETURN_FAIL":
        return "bg-red-100 text-red-800 border-red-200"
      case "RETURN_VERIFIED":
        return "bg-green-100 text-green-800 border-green-200"
      case "REFUND_APPROVED":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "REFUND_FAIL":
        return "bg-red-100 text-red-800 border-red-200"
      case "REFUND_SUCCESS":
        return "bg-green-100 text-green-800 border-green-200"
      case "COMPLETE":
        return "bg-green-100 text-green-800 border-green-200"
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

  const getMerchantEditableStatuses = (
    currentStatus: OrderStatus
  ): OrderStatus[] => {
    switch (currentStatus) {
      case "PAID":
        return ["PROCESSING"]
      case "PROCESSING":
        return ["READY_TO_SHIP"]
      case "READY_TO_SHIP":
        return ["SHIPPED"]
      case "SHIPPED":
        return ["DELIVERED", "TRANSIT_LACK"]
      case "TRANSIT_LACK":
        return ["SHIPPED", "READY_TO_SHIP"]
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

  return {
    getStatusIcon,
    getStatusColor,
    getStatusText,
    getMerchantEditableStatuses
  }
}
