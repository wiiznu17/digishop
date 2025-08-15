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

interface OrderDetailDialogProps {
  order: Order | null
  isOpen: boolean
  onClose: () => void
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void
  onTrackingNumberUpdate: (orderId: string, trackingNumber: string) => void
  getStatusIcon: (status: OrderStatus) => React.ReactNode
  getStatusBadgeColor: (status: OrderStatus) => string
  getStatusText: (status: OrderStatus) => string
  getMerchantEditableStatuses: (currentStatus: OrderStatus) => OrderStatus[]
}

export function OrderDetailDialog({
  order,
  isOpen,
  onClose,
  onStatusChange,
  onTrackingNumberUpdate,
  getStatusIcon,
  getStatusBadgeColor,
  getStatusText,
  getMerchantEditableStatuses
}: OrderDetailDialogProps) {
  if (!order) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            รายละเอียดคำสั่งซื้อ - {order.id}
          </DialogTitle>
          <DialogDescription>
            ข้อมูลครบถ้วนของคำสั่งซื้อและสินค้า
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* สถานะและการชำระเงิน */}
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
                  <span className="font-medium">เหตุผลขอคืน: </span>
                  <span className="text-muted-foreground">
                    {order.refundReason}
                  </span>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                ฿{order.totalPrice.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                {order.paymentMethod}
              </div>
              {order.refundAmount && (
                <div className="text-sm text-red-600">
                  ยอดคืน: ฿{order.refundAmount.toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* ข้อมูลลูกค้าและการจัดส่ง */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4" />
                  ข้อมูลลูกค้า
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{order.customerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customerEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customerPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {new Date(order.createdAt).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  ที่อยู่จัดส่ง
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <p>{order.shippingAddress.street}</p>
                  <p>{order.shippingAddress.district}</p>
                  <p>
                    {order.shippingAddress.province}{" "}
                    {order.shippingAddress.postalCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                </div>
                {order.trackingNumber && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        หมายเลขติดตาม:
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

          {/* รายการสินค้า */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">รายการสินค้า</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>สินค้า</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-center">จำนวน</TableHead>
                    <TableHead className="text-right">ราคา/ชิ้น</TableHead>
                    <TableHead className="text-right">รวม</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.orderitems.map((item) => (
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
                        ฿{item.price.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ฿{(item.quantity * item.price).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* สรุปยอดเงิน */}
              <div className="mt-4 space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>ยอดรวมสินค้า:</span>
                  <span>
                    ฿
                    {(
                      order.totalPrice -
                      order.shippingCost -
                      order.tax
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>ค่าจัดส่ง:</span>
                  <span>฿{order.shippingCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>ภาษี:</span>
                  <span>฿{order.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>ยอดรวมทั้งสิ้น:</span>
                  <span>฿{order.totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* การจัดการสถานะ */}
          {getMerchantEditableStatuses(order.status).length >= 0 && (
            <OrderStatusManager
              currentStatus={order.status}
              orderId={order.id}
              trackingNumber={order.trackingNumber}
              onStatusChange={onStatusChange}
              onTrackingNumberUpdate={onTrackingNumberUpdate}
            />
          )}

          {/* หมายเหตุ */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">หมายเหตุ</CardTitle>
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
