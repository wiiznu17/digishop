"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Eye } from "lucide-react"
import { Order, OrderStatus } from "@/types/props/orderProp"

interface OrdersTableProps {
  orders: Order[]
  searchTerm: string
  statusFilter: string
  onSearchChange: (value: string) => void
  onStatusFilterChange: (value: string) => void
  onViewDetails: (order: Order) => void
  getStatusIcon: (status: OrderStatus) => React.ReactNode
  getStatusBadgeColor: (status: OrderStatus) => string
  getStatusText: (status: OrderStatus) => string
}

export function OrdersTable({
  orders,
  searchTerm,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  onViewDetails,
  getStatusIcon,
  getStatusBadgeColor,
  getStatusText
}: OrdersTableProps) {
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === "ALL" || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const statusOptions = [
    { value: "ALL", label: "สถานะทั้งหมด" },
    { value: "PENDING", label: "รอการชำระเงิน" },
    { value: "CUSTOMER_CANCELED", label: "ลูกค้ายกเลิก" },
    { value: "PAID", label: "ชำระเงินแล้ว" },
    { value: "PROCESSING", label: "กำลังเตรียมสินค้า" },
    { value: "READY_TO_SHIP", label: "พร้อมจัดส่ง" },
    { value: "SHIPPED", label: "จัดส่งแล้ว" },
    { value: "RE_TRANSIT", label: "จัดส่งใหม่อีกครั้ง" },
    { value: "DELIVERED", label: "จัดส่งสำเร็จ" },
    { value: "REFUND_REQUEST", label: "ขอคืนเงิน" },
    { value: "COMPLETE", label: "เสร็จสิ้น" }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>รายการคำสั่งซื้อ</CardTitle>
        <CardDescription>
          ดูรายการคำสั่งซื้อทั้งหมดและรายละเอียด
        </CardDescription>

        {/* ฟิลเตอร์และค้นหา */}
        <div className="flex gap-4 pt-4">
          <div className="flex-1">
            <Input
              placeholder="ค้นหาด้วยรหัสคำสั่งซื้อ, ชื่อลูกค้า หรือ email..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-[250px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* Table Header Info */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            แสดง {filteredOrders.length} รายการจากทั้งหมด {orders.length}{" "}
            คำสั่งซื้อ
          </p>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">รหัสคำสั่งซื้อ</TableHead>
                <TableHead className="min-w-[200px]">ลูกค้า</TableHead>
                <TableHead className="w-[160px]">วันที่</TableHead>
                <TableHead className="w-[120px] text-right">ยอดรวม</TableHead>
                <TableHead className="w-[160px]">สถานะ</TableHead>
                <TableHead className="w-[140px]">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {searchTerm || statusFilter !== "ALL"
                      ? "ไม่พบข้อมูลที่ตรงกับการค้นหา"
                      : "ไม่มีคำสั่งซื้อ"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => onViewDetails(order)}
                  >
                    <TableCell className="font-mono font-medium">
                      {order.id}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{order.customerName}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.customerEmail}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {new Date(order.createdAt).toLocaleDateString(
                            "th-TH",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric"
                            }
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleTimeString(
                            "th-TH",
                            {
                              hour: "2-digit",
                              minute: "2-digit"
                            }
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ฿{order.totalPrice.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getStatusBadgeColor(order.status)}
                        variant="outline"
                      >
                        {getStatusIcon(order.status)}
                        <span className="ml-1">
                          {getStatusText(order.status)}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation() // ป้องกันการ trigger row click
                          onViewDetails(order)
                        }}
                        className="w-full"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        ดูรายละเอียด
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination หรือ Load More (ถ้าต้องการ) */}
        {filteredOrders.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              แสดงผลลัพธ์ {filteredOrders.length} รายการ
            </div>
            {/* สามารถเพิ่ม Pagination component ตรงนี้ได้ */}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
