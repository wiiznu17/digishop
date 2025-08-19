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
import { Pagination } from "@/components/order/pagination"
import { Eye, RotateCcw } from "lucide-react"
import { Order, OrderStatus } from "@/types/props/orderProp"
import { usePagination } from "@/hooks/usePagination"
import { useEffect } from "react"

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
  // Filter orders first
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      statusFilter === "ALL" || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Use pagination hook
  const {
    currentPage,
    totalPages,
    paginatedData,
    totalItems,
    itemsPerPage,
    goToPage,
    resetPage,
    changeItemsPerPage
  } = usePagination({
    data: filteredOrders,
    itemsPerPage: 20
  })

  // Reset to first page when filters change
  useEffect(() => {
    resetPage()
  }, [searchTerm, statusFilter, resetPage])

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

  const clearFilters = () => {
    onSearchChange("")
    onStatusFilterChange("ALL")
  }

  const hasActiveFilters = searchTerm || statusFilter !== "ALL"

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>รายการคำสั่งซื้อ</CardTitle>
            <CardDescription>
              ดูรายการคำสั่งซื้อทั้งหมดและรายละเอียด
            </CardDescription>
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              ล้างตัวกรอง
            </Button>
          )}
        </div>

        {/* ฟิลเตอร์และค้นหา */}
        <div className="flex flex-col gap-4 pt-4 sm:flex-row">
          <div className="flex-1">
            <Input
              placeholder="ค้นหาด้วยรหัสคำสั่งซื้อ, ชื่อลูกค้า หรือ email..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-full sm:w-[250px]">
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

        {/* Summary Info */}
        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>พบ {totalItems.toLocaleString()} รายการ</span>
            {hasActiveFilters && (
              <>
                <span>
                  จากทั้งหมด {orders.length.toLocaleString()} คำสั่งซื้อ
                </span>
                {totalItems !== orders.length && (
                  <Badge variant="secondary" className="text-xs">
                    กรองแล้ว
                  </Badge>
                )}
              </>
            )}
          </div>
          {totalPages > 1 && (
            <p className="text-sm text-muted-foreground">
              หน้า {currentPage} จาก {totalPages}
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Table */}
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
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
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <div className="text-sm">
                          {hasActiveFilters
                            ? "ไม่พบข้อมูลที่ตรงกับการค้นหา"
                            : "ไม่มีคำสั่งซื้อ"}
                        </div>
                        {hasActiveFilters && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearFilters}
                            className="flex items-center gap-2"
                          >
                            <RotateCcw className="h-4 w-4" />
                            ล้างตัวกรอง
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((order, index) => {
                    const globalIndex =
                      (currentPage - 1) * itemsPerPage + index + 1
                    console.log(
                      "badge color: ",
                      getStatusBadgeColor(order.status)
                    )
                    return (
                      <TableRow
                        key={order.id}
                        className="hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => onViewDetails(order)}
                      >
                        <TableCell className="font-mono font-medium">
                          <div className="flex flex-col">
                            <span className="text-sm">{order.id}</span>
                            <span className="text-xs text-muted-foreground">
                              #{globalIndex}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-sm">
                              {order.customerName}
                            </div>
                            <div className="text-xs text-muted-foreground truncate max-w-[180px]">
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
                          <div className="text-sm">
                            ฿{order.totalPrice.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${getStatusBadgeColor(order.status)} text-xs`}
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
                              e.stopPropagation()
                              onViewDetails(order)
                            }}
                            className="w-full text-xs"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            รายละเอียด
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={changeItemsPerPage}
            showItemsPerPageSelector={true}
            itemsPerPageOptions={[10, 20, 50, 100]}
          />
        )}
      </CardContent>
    </Card>
  )
}
