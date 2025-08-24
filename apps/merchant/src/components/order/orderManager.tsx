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
}

export function OrderStatusManager({
  currentStatus,
  orderId,
  trackingNumber,
  statusHistory,
  onStatusChange,
  onTrackingNumberUpdate
}: OrderStatusManagerProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [newTrackingNumber, setNewTrackingNumber] = useState(
    trackingNumber || ""
  )

  // --- Hook helpers for order status ---
  const {
    isTerminalStatus,
    getStatusTimeline,
    getMergedTimeline,
    getMerchantEditableStatuses,
    getStatusIcon,
    getStatusText,
    getStatusColor
  } = useOrderStatus()

  // --- Determine which timeline to show ---
  const isOrderFinished = isTerminalStatus(currentStatus)

  // Merge history + ideal path (instead of raw history/ideal only)
  const timelineToDisplay = getMergedTimeline(currentStatus, statusHistory)

  const editableStatuses = getMerchantEditableStatuses(currentStatus)

  const handleStatusUpdate = () => {
    if (selectedStatus) {
      onStatusChange(orderId, selectedStatus)
    } else if (editableStatuses.length === 1) {
      onStatusChange(orderId, editableStatuses[0])
    }
    // update tracking number separately if changed
    if (newTrackingNumber !== trackingNumber) {
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
        {/* --- Order Timeline Section --- */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Order Timeline</h4>
          <div className="relative flex flex-col">
            {timelineToDisplay.map((status, index) => {
              const isActive = status === currentStatus
              const isStatusInHistory = statusHistory.includes(status)
              const isPassed = isStatusInHistory && !isActive // past statuses

              return (
                <div key={`${status}-${index}`} className="flex items-start">
                  {/* Left: Circle + connector */}
                  <div className="flex flex-col items-center mr-4">
                    <div
                      className={`
                        w-10 h-10 rounded-full border-2 flex items-center justify-center z-10
                        ${getStatusColor(status, isActive, isPassed)}
                      `}
                    >
                      {getStatusIcon(status)}
                    </div>
                    {/* Connector line */}
                    {index < timelineToDisplay.length - 1 && (
                      <div className="w-0.5 h-12 bg-gray-200" />
                    )}
                  </div>
                  {/* Right: Label */}
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
        {/* --- End Timeline --- */}

        {/* --- Actions Section --- */}
        {editableStatuses.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium text-sm">Update Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Selection */}
              <div className="space-y-3">
                {editableStatuses.length > 1 ? (
                  // Multiple options -> show dropdown
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
                      Confirm Status Update
                    </Button>
                  </div>
                ) : (
                  // Single option -> show button only
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

              {/* Tracking Number Input */}
              {(currentStatus === "READY_TO_SHIP" ||
                editableStatuses.includes("SHIPPED")) && (
                <div className="space-y-2">
                  <Label htmlFor="tracking">Tracking Number:</Label>
                  <Input
                    id="tracking"
                    placeholder="Enter tracking number"
                    value={newTrackingNumber}
                    onChange={(e) => setNewTrackingNumber(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tracking number will be updated upon status change.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No available actions */}
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

      {/* --- Confirmation Dialog --- */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>{getConfirmMessage()}</DialogDescription>
          </DialogHeader>

          {newTrackingNumber !== trackingNumber && newTrackingNumber && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Tracking Number will be updated to:</strong>{" "}
                {newTrackingNumber}
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
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
