"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Undo2
} from "lucide-react"

type OrderStatus =
  | "PENDING"
  | "CUSTOMER_CANCELED"
  | "PAID"
  | "PROCESSING"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "DELIVERED"
  | "REFUND_REQUEST"
  | "TRANSIT_LACK"
  | "AWAITING_RETURN"
  | "RETURN_FAIL"
  | "RETURN_VERIFIED"
  | "REFUND_APPROVED"
  | "REFUND_FAIL"
  | "REFUND_SUCCESS"
  | "COMPLETE"

interface OrderStatusManagerProps {
  currentStatus: OrderStatus
  orderId: string
  trackingNumber?: string
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void
  onTrackingNumberUpdate: (orderId: string, trackingNumber: string) => void
}

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
  if (["TRANSIT_LACK"].includes(currentStatus)) {
    return [
      "PENDING",
      "PAID",
      "PROCESSING",
      "READY_TO_SHIP",
      "SHIPPED",
      "TRANSIT_LACK",
      "READY_TO_SHIP",
      "SHIPPED",
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

const getStatusColor = (
  status: OrderStatus,
  isActive: boolean,
  isPassed: boolean
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
      default:
        return "bg-blue-500 border-blue-500 text-white"
    }
  } else if (isPassed) {
    return "bg-green-100 border-green-300 text-green-800"
  } else {
    return "bg-gray-100 border-gray-300 text-gray-500"
  }
}

export function OrderStatusManager({
  currentStatus,
  orderId,
  trackingNumber,
  onStatusChange,
  onTrackingNumberUpdate
}: OrderStatusManagerProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [newTrackingNumber, setNewTrackingNumber] = useState(
    trackingNumber || ""
  )

  const editableStatuses = getMerchantEditableStatuses(currentStatus)
  const timeline = getStatusTimeline(currentStatus)
  const currentIndex = timeline.indexOf(currentStatus)

  const handleStatusUpdate = () => {
    if (selectedStatus) {
      onStatusChange(orderId, selectedStatus)
      if (newTrackingNumber !== trackingNumber) {
        onTrackingNumberUpdate(orderId, newTrackingNumber)
      }
    } else if (editableStatuses.length === 1) {
      onStatusChange(orderId, editableStatuses[0])
      if (newTrackingNumber !== trackingNumber) {
        onTrackingNumberUpdate(orderId, newTrackingNumber)
      }
    }
    setIsConfirmDialogOpen(false)
    setSelectedStatus(null)
  }

  const handleConfirm = (status?: OrderStatus) => {
    if (status) {
      setSelectedStatus(status)
    }
    setIsConfirmDialogOpen(true)
  }

  const getConfirmMessage = () => {
    const targetStatus =
      selectedStatus ||
      (editableStatuses.length === 1 ? editableStatuses[0] : null)
    if (!targetStatus) return ""

    return `คุณต้องการเปลี่ยนสถานะจาก "${getStatusText(currentStatus)}" เป็น "${getStatusText(targetStatus)}" หรือไม่?`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">จัดการสถานะคำสั่งซื้อ</CardTitle>
        <CardDescription>
          ติดตามและอัพเดตสถานะตามขั้นตอนการจัดส่ง
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Timeline */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">ขั้นตอนการดำเนินการ</h4>
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 -translate-y-1/2" />
            <div
              className="absolute top-6 left-6 h-0.5 bg-green-400 -translate-y-1/2 transition-all duration-300"
              style={{
                width:
                  currentIndex >= 0
                    ? `${(currentIndex / (timeline.length - 1)) * 100}%`
                    : "0%"
              }}
            />

            {/* Status Circles */}
            <div className="relative flex justify-between">
              {timeline.map((status, index) => {
                const isActive = status === currentStatus
                const isPassed = index < currentIndex

                return (
                  <div
                    key={status}
                    className="flex flex-col items-center space-y-2"
                  >
                    <div
                      className={`
                        w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300
                        ${getStatusColor(status, isActive, isPassed)}
                      `}
                    >
                      {getStatusIcon(status)}
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-medium max-w-20 leading-tight">
                        {getStatusText(status)}
                      </div>
                      {isActive && (
                        <div className="text-xs text-blue-600 font-medium mt-1">
                          ปัจจุบัน
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Status Management */}
        {editableStatuses.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium text-sm">อัพเดตสถานะ</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Selection */}
              <div className="space-y-3">
                {editableStatuses.length > 1 ? (
                  /* Multiple Options - Show Dropdown */
                  <div className="space-y-2">
                    <Label>เลือกสถานะถัดไป:</Label>
                    <Select
                      value={selectedStatus || ""}
                      onValueChange={(value) =>
                        setSelectedStatus(value as OrderStatus)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกสถานะที่ต้องการอัพเดต" />
                      </SelectTrigger>
                      <SelectContent>
                        {editableStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(status)}
                              <span>{getStatusText(status)}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => handleConfirm()}
                      disabled={!selectedStatus}
                      className="w-full"
                    >
                      ยืนยันการอัพเดตสถานะ
                    </Button>
                  </div>
                ) : (
                  /* Single Option - Show Confirm Button */
                  <div className="space-y-2">
                    <Label>สถานะถัดไป:</Label>
                    <div className="p-3 border rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(editableStatuses[0])}
                        <span className="font-medium">
                          {getStatusText(editableStatuses[0])}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleConfirm(editableStatuses[0])}
                      className="w-full"
                    >
                      ยืนยันไปยังขั้นตอนถัดไป
                    </Button>
                  </div>
                )}
              </div>

              {/* Tracking Number Input */}
              {(currentStatus === "SHIPPED" ||
                currentStatus === "READY_TO_SHIP" ||
                editableStatuses.includes("SHIPPED")) && (
                <div className="space-y-2">
                  <Label htmlFor="tracking">หมายเลขติดตาม:</Label>
                  <Input
                    id="tracking"
                    placeholder="กรอกหมายเลขติดตาม"
                    value={newTrackingNumber}
                    onChange={(e) => setNewTrackingNumber(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    หมายเลขติดตามจะถูกส่งให้ลูกค้าอัตโนมัติ
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการเปลี่ยนสถานะ</DialogTitle>
            <DialogDescription>{getConfirmMessage()}</DialogDescription>
          </DialogHeader>

          {newTrackingNumber !== trackingNumber && newTrackingNumber && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>หมายเลขติดตาม:</strong> {newTrackingNumber}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsConfirmDialogOpen(false)
                setSelectedStatus(null)
              }}
            >
              ยกเลิก
            </Button>
            <Button onClick={handleStatusUpdate}>ยืนยัน</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
