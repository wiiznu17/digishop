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
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [newTrackingNumber, setNewTrackingNumber] = useState(
    trackingNumber || ""
  )
  const [carrier, setCarrier] = useState<string>("") // NEW

  // --- Hook helpers for order status ---
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

  const handleStatusUpdate = () => {
    if (selectedStatus) {
      if (selectedStatus === "HANDED_OVER") {
        // ต้องมี tracking + carrier
        onHandedOver?.(orderId, newTrackingNumber, carrier)
      } else {
        onStatusChange(orderId, selectedStatus)
      }
    } else if (editableStatuses.length === 1) {
      const next = editableStatuses[0]
      if (next === "HANDED_OVER") {
        onHandedOver?.(orderId, newTrackingNumber, carrier)
      } else {
        onStatusChange(orderId, next)
      }
    }

    // update tracking number แยก กรณี status อื่น
    if (
      newTrackingNumber !== trackingNumber &&
      selectedStatus !== "HANDED_OVER"
    ) {
      onTrackingNumberUpdate(orderId, newTrackingNumber)
    }

    setIsConfirmDialogOpen(false)
    setSelectedStatus(null)
  }

  const handleConfirm = (status?: OrderStatus) => {
    const statusToConfirm = status || selectedStatus
    if (statusToConfirm) {
      setSelectedStatus(statusToConfirm)
      setIsConfirmDialogOpen(true)
    }
  }

  const getConfirmMessage = () => {
    const targetStatus = selectedStatus
    if (!targetStatus) return ""
    return `Do you want to change the status from "${getStatusText(
      currentStatus
    )}" to "${getStatusText(targetStatus)}"?`
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
                      onClick={() => handleConfirm()}
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
                      onClick={() => handleConfirm(editableStatuses[0])}
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

      {/* Confirm Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>{getConfirmMessage()}</DialogDescription>
          </DialogHeader>

          {newTrackingNumber && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-1">
              <p className="text-sm text-blue-800">
                <strong>Tracking:</strong> {newTrackingNumber}
              </p>
              {carrier && (
                <p className="text-sm text-blue-800">
                  <strong>Carrier:</strong> {carrier}
                </p>
              )}
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
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
