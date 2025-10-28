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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Clock } from "lucide-react"
import { OrderStatus } from "@/types/props/orderProp"
import { useOrderStatus } from "@/hooks/useOrderStatus"
import Swal from "sweetalert2" // ⬅️ NEW

interface OrderStatusManagerProps {
  currentStatus: OrderStatus
  statusHistory: OrderStatus[]
  orderId: string
  trackingNumber?: string
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void
  onTrackingNumberUpdate: (orderId: string, trackingNumber: string) => void
  onHandedOver?: (
    orderId: string,
    trackingNumber: string,
    carrier?: string
  ) => void
}

export function OrderStatusManager({
  currentStatus,
  orderId,
  trackingNumber,
  statusHistory,
  onStatusChange,
  onTrackingNumberUpdate,
  onHandedOver
}: OrderStatusManagerProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null)
  const [newTrackingNumber, setNewTrackingNumber] = useState(
    trackingNumber || ""
  )
  const [carrier, setCarrier] = useState<string>("")

  const {
    getMergedTimeline,
    getMerchantEditableStatuses,
    getStatusIcon,
    getStatusText,
    getStatusTextForReal,
    getStatusColor
  } = useOrderStatus()

  const timelineToDisplay = getMergedTimeline(currentStatus, statusHistory)
  const editableStatuses = getMerchantEditableStatuses(currentStatus)

  async function confirmAndApply(status?: OrderStatus) {
    const target =
      status ||
      selectedStatus ||
      (editableStatuses.length === 1 ? editableStatuses[0] : null)
    if (!target) return

    // สร้างข้อความสรุปก่อนยืนยัน
    const parts: string[] = [
      `From: "${getStatusText(currentStatus)}"`,
      `To: "${getStatusText(target)}"`
    ]
    // if (newTrackingNumber) parts.push(`Tracking: ${newTrackingNumber}`)
    if (carrier) parts.push(`Carrier: ${carrier}`)

    const { isConfirmed } = await Swal.fire({
      title: "Confirm Status Change",
      html: parts.join("<br/>"),
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Confirm",
      cancelButtonText: "Cancel",
      reverseButtons: true
    })
    if (!isConfirmed) return

    // ส่งต่อไปให้ parent ทำงาน (parent จะขึ้น loading + success/error เอง)
    if (target === "HANDED_OVER") {
      onHandedOver?.(orderId, newTrackingNumber, carrier || undefined)
    } else {
      onStatusChange(orderId, target)
      // ถ้ามีการแก้ tracking แต่ไม่ใช่ HANDED_OVER ให้ยิงอัปเดต tracking แยก
      if (newTrackingNumber !== trackingNumber) {
        onTrackingNumberUpdate(orderId, newTrackingNumber)
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Order Status Management</CardTitle>
        <CardDescription>Track and update order status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timeline */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Order Timeline</h4>
          <div className="relative flex flex-col">
            {timelineToDisplay.map((status, index) => {
              const isActive = status === currentStatus
              const isStatusInHistory = statusHistory.includes(status)
              const isPassed = isStatusInHistory && !isActive
              return (
                <div key={`${status}-${index}`} className="flex items-start">
                  <div className="flex flex-col items-center mr-4">
                    <div
                      className={`
                        w-10 h-10 rounded-full border-2 flex items-center justify-center z-10
                        ${getStatusColor(status, isActive, isPassed)}
                      `}
                    >
                      {getStatusIcon(status)}
                    </div>
                    {index < timelineToDisplay.length - 1 && (
                      <div className="w-0.5 h-12 bg-gray-200" />
                    )}
                  </div>
                  <div
                    className={`pt-1.5 ${
                      isActive
                        ? "font-bold"
                        : isPassed
                          ? "text-foreground"
                          : "text-muted-foreground"
                    }`}
                  >
                    <p className="text-sm">{getStatusText(status)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        {editableStatuses.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium text-sm">Update Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Selection */}
              <div className="space-y-3">
                {editableStatuses.length > 1 ? (
                  <div className="space-y-2">
                    <Label>Select next status:</Label>
                    <Select
                      value={selectedStatus || ""}
                      onValueChange={(value) =>
                        setSelectedStatus(value as OrderStatus)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose status to update" />
                      </SelectTrigger>
                      <SelectContent>
                        {editableStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(status)}
                              <span>{getStatusTextForReal(status)}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => confirmAndApply()}
                      disabled={!selectedStatus}
                      className="w-full"
                    >
                      Confirm Status Update
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Next status:</Label>
                    <div className="p-3 border rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(editableStatuses[0])}
                        <span className="font-medium">
                          {getStatusText(editableStatuses[0])}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => confirmAndApply(editableStatuses[0])}
                      className="w-full"
                    >
                      Proceed to Next Step
                    </Button>
                  </div>
                )}
              </div>

              {/* Tracking + Carrier Inputs */}
              {(currentStatus === "READY_TO_SHIP" ||
                editableStatuses.includes("HANDED_OVER")) && (
                <div className="space-y-2">
                  <Label htmlFor="tracking">Tracking Number:</Label>
                  <Input
                    id="tracking"
                    placeholder="Enter tracking number"
                    value={newTrackingNumber}
                    onChange={(e) => setNewTrackingNumber(e.target.value)}
                  />
                  <Label className="mt-3">Carrier:</Label>
                  <Select value={carrier} onValueChange={setCarrier}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select carrier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kerry">Kerry Express</SelectItem>
                      <SelectItem value="flash">Flash Express</SelectItem>
                      <SelectItem value="j&t">J&T Express</SelectItem>
                      <SelectItem value="thailand-post">
                        Thailand Post
                      </SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Tracking number and carrier will be updated upon status
                    change.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No actions */}
        {editableStatuses.length === 0 && (
          <div className="p-4 bg-gray-50 border rounded-lg">
            <div className="flex items-center gap-3 text-gray-700">
              <Clock className="h-5 w-5" />
              <div>
                <span className="font-medium">No actions available</span>
                <p className="text-sm text-gray-500 mt-0.5">
                  Waiting for system or customer update.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
