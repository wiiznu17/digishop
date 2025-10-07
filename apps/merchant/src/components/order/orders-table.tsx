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
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/order/pagination"
import { Eye } from "lucide-react"
import { Order, OrderStatus } from "@/types/props/orderProp"

interface OrdersTableProps {
  // data
  orders: Order[]
  total: number
  page: number
  pageSize: number
  loading?: boolean

  // pagination controls
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void

  // row actions + helpers...
  onViewDetails: (order: Order) => void
  getStatusIcon: (status: OrderStatus) => React.ReactNode
  getStatusBadgeColor: (status: OrderStatus) => string
  getStatusText: (status: OrderStatus) => string
}
export function OrdersTable({
  orders,
  total,
  page,
  pageSize,
  loading = false,
  onPageChange,
  onPageSizeChange,
  onViewDetails,
  getStatusIcon,
  getStatusBadgeColor,
  getStatusText
}: OrdersTableProps) {
  // formatters
  const fmtTHB = (n: number) =>
    new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      maximumFractionDigits: 0
    }).format(n)

  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    }).format(new Date(iso))

  const fmtTime = (iso: string) =>
    new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(new Date(iso))

  const startIndex = (page - 1) * pageSize

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Order List</CardTitle>
            <CardDescription>View all orders and their details</CardDescription>
          </div>
        </div>

        {/* Summary */}
        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>
              Showing {orders.length.toLocaleString()} of{" "}
              {total.toLocaleString()} results
            </span>
          </div>
          {total > pageSize && (
            <p className="text-sm text-muted-foreground">
              Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Order no.</TableHead>
                  <TableHead className="w-[140px]">Order ID</TableHead>
                  <TableHead className="min-w-[200px]">Customer</TableHead>
                  <TableHead className="w-[160px]">Date</TableHead>
                  <TableHead className="w-[120px] text-right">
                    Total check out
                  </TableHead>
                  <TableHead className="w-[120px] text-right">
                    Total of order
                  </TableHead>
                  <TableHead className="min-w-[180px]">Status</TableHead>
                  <TableHead className="w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      Loading orders…
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <div className="text-sm">No orders found</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order, index) => {
                    const globalIndex = startIndex + index + 1
                    return (
                      <TableRow
                        key={order.id}
                        className="hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => onViewDetails(order)}
                      >
                        <TableCell className="font-mono font-medium">
                          <div className="flex flex-col">
                            <span className="text-sm">{order.orderCode}</span>
                            <span className="text-xs text-muted-foreground">
                              #{globalIndex}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono font-medium">
                          <div className="flex flex-col">
                            <span className="text-sm">{order.id}</span>
                            {/* <span className="text-xs text-muted-foreground">
                              #{globalIndex}
                            </span> */}
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
                              {fmtDate(order.createdAt)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {fmtTime(order.createdAt)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <div className="text-sm">
                            {fmtTHB(order.payment.captured)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <div className="text-sm">
                            {fmtTHB(order.grandTotal)}
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
                            View Details
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

        {/* Server-side Pagination */}
        {total > 0 && (
          <Pagination
            currentPage={page}
            totalPages={Math.max(1, Math.ceil(total / pageSize))}
            onPageChange={onPageChange}
            totalItems={total}
            itemsPerPage={pageSize}
            onItemsPerPageChange={onPageSizeChange}
            showItemsPerPageSelector
            itemsPerPageOptions={[5, 10, 20, 50, 100]}
          />
        )}
      </CardContent>
    </Card>
  )
}
