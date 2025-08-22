"use client"

import { useEffect, useState } from "react"
import { MerchantHeader } from "@/components/dashboard-header"
import { Order, OrderStatus } from "@/types/props/orderProp"
import { initialOrders } from "@/constants/mock/mock-order"
import { OrderDetailDialog } from "@/components/order/order-detail-dialog"
import { OrdersTable } from "@/components/order/orders-table"
import { OrderStats } from "@/components/order/order-stats"
import { useOrderStatus } from "@/hooks/useOrderStatus"

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")

  // << 1. ลดการเรียกใช้ hook เหลือเฉพาะที่จำเป็นในหน้านี้
  const { getStatusIcon, getStatusBadgeColor, getStatusText } = useOrderStatus()

  // Sync selectedOrder with the main orders array to reflect updates
  useEffect(() => {
    if (selectedOrder) {
      const updatedOrder = orders.find((order) => order.id === selectedOrder.id)
      if (updatedOrder) {
        setSelectedOrder(updatedOrder)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, selectedOrder?.id])

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          // << 2. อัปเดตทั้ง status และ statusHistory พร้อมกัน
          // นี่คือส่วนที่สำคัญที่สุด!
          const newHistory = [
            ...(order.statusHistory || [order.status]),
            newStatus
          ]
          return { ...order, status: newStatus, statusHistory: newHistory }
        }
        return order
      })
    )
  }

  const handleTrackingNumberUpdate = (
    orderId: string,
    trackingNumber: string
  ) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, trackingNumber } : order
      )
    )
  }

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setIsDetailOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDetailOpen(false)
    // Delay setting selectedOrder to null to prevent content flicker during closing animation
    setTimeout(() => setSelectedOrder(null), 300)
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
  }

  return (
    <div>
      <MerchantHeader
        title="Order Management"
        description="Track and manage customer orders"
      />

      <div className="flex flex-1 flex-col gap-6 p-4">
        <OrderStats orders={orders} />

        <OrdersTable
          orders={orders}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onSearchChange={handleSearchChange}
          onStatusFilterChange={handleStatusFilterChange}
          onViewDetails={viewOrderDetails}
          getStatusIcon={getStatusIcon}
          getStatusBadgeColor={getStatusBadgeColor}
          getStatusText={getStatusText}
        />
      </div>

      {/* << 3. ลบ props ที่ไม่จำเป็นออกทั้งหมด */}
      <OrderDetailDialog
        order={selectedOrder}
        isOpen={isDetailOpen}
        onClose={handleCloseDialog}
        onStatusChange={handleStatusChange}
        onTrackingNumberUpdate={handleTrackingNumberUpdate}
      />
    </div>
  )
}
