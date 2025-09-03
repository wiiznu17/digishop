"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Package,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Truck
} from "lucide-react"
import { Order, OrderStatus } from "@/types/props/orderProp"
import { OrderStatusManager } from "@/components/order/orderManager"
import { useOrderStatus } from "@/hooks/useOrderStatus"

interface OrderDetailDialogProps {
  order: Order | null
  isOpen: boolean
  onClose: () => void
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void
  onTrackingNumberUpdate: (orderId: string, trackingNumber: string) => void
  /** NEW: สำหรับอัพเดตเป็น HANDED_OVER + tracking พร้อมกัน */
  onHandedOver?: (
    orderId: string,
    trackingNumber: string,
    carrier?: string
  ) => void
}

export function OrderDetailDialog({
  order,
  isOpen,
  onClose,
  onStatusChange,
  onTrackingNumberUpdate,
  onHandedOver // <-- NEW
}: OrderDetailDialogProps) {
  const {
    getStatusBadgeColor,
    getStatusIcon,
    getStatusText,
    getMerchantEditableStatuses
  } = useOrderStatus()

  if (!order) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Details - {order.id}
          </DialogTitle>
          <DialogDescription>
            Complete information about the order and products
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Payment */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-4">
              <Badge
                className={`${getStatusBadgeColor(order.status)} px-5 py-4 text-base`}
                variant="outline"
              >
                {getStatusIcon(order.status)}
                <span className="ml-1">{getStatusText(order.status)}</span>
              </Badge>

              {order.refundReason && (
                <div className="text-sm">
                  <span className="font-medium">Refund Reason: </span>
                  <span className="text-muted-foreground">
                    {order.refundReason}
                  </span>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                ฿{order.grandTotal?.toLocaleString() ?? "0"}
              </div>
              <div className="text-sm text-muted-foreground">
                {order.paymentMethod ?? "-"}
              </div>
              {order.refundAmount && (
                <div className="text-sm text-red-600">
                  Refund Amount: ฿{order.refundAmount.toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Customer Information and Shipping */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {order.customerName || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customerEmail || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customerPhone || "-"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })
                      : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.shippingAddress ? (
                  <div className="space-y-1 text-sm">
                    <p>{order.shippingAddress?.street ?? "-"}</p>
                    <p>{order.shippingAddress?.district ?? "-"}</p>
                    <p>
                      {order.shippingAddress?.province ?? "-"}{" "}
                      {order.shippingAddress?.postalCode ?? ""}
                    </p>
                    <p>{order.shippingAddress?.country ?? "-"}</p>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No shipping address available.
                  </div>
                )}

                {order.trackingNumber && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        Tracking Number:
                      </span>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {order.trackingNumber}
                      </code>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Product List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              {order.orderItems?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.orderItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.name}</div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {item.sku}
                          </code>
                        </TableCell>
                        <TableCell className="text-center">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          ฿{item.price?.toLocaleString() ?? "0"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ฿{(item.quantity * item.price).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No products in this order.
                </p>
              )}

              {/* Order Summary */}
              <div className="mt-4 space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>
                    ฿
                    {(
                      order.grandTotal -
                      (order.shippingCost ?? 0) -
                      (order.tax ?? 0)
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping:</span>
                  <span>฿{order.shippingCost?.toLocaleString() ?? "0"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span>฿{order.tax?.toLocaleString() ?? "0"}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>฿{order.grandTotal?.toLocaleString() ?? "0"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Management */}
          <OrderStatusManager
            currentStatus={order.status}
            statusHistory={order.statusHistory ?? []}
            orderId={order.id}
            trackingNumber={order.trackingNumber ?? undefined}
            onStatusChange={onStatusChange}
            onTrackingNumberUpdate={onTrackingNumberUpdate}
            /** ⬇️ ส่ง handler hand over ลงไป */
            onHandedOver={onHandedOver}
          />

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm bg-muted p-3 rounded-lg">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
