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
import { Clock } from "lucide-react"
import { OrderStatus } from "@/types/props/orderProp"
import { useOrderStatus } from "@/hooks/useOrderStatus"

interface OrderStatusManagerProps {
  currentStatus: OrderStatus
  orderId: string
  trackingNumber?: string
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void
  onTrackingNumberUpdate: (orderId: string, trackingNumber: string) => void
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

  const {
    getStatusTimeline,
    getMerchantEditableStatuses,
    getStatusIcon,
    getStatusText,
    getStatusColor
  } = useOrderStatus()

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
        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-medium text-sm">อัพเดตสถานะ</h4>

          {editableStatuses.length > 0 ? (
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
          ) : (
            /* No Merchant Actions Available */
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Waiting for customer action</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                ขณะนี้ไม่สามารถอัพเดตสถานะได้ กรุณารอการดำเนินการจากลูกค้า
              </p>
            </div>
          )}
        </div>
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
