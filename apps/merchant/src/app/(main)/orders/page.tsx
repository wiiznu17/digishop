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

  const {
    getStatusIcon,
    getStatusColor,
    getStatusText,
    getMerchantEditableStatuses
  } = useOrderStatus()

  // sync selectedOrder กับ orders array
  useEffect(() => {
    if (selectedOrder && isDetailOpen) {
      const updatedOrder = orders.find((order) => order.id === selectedOrder.id)
      if (updatedOrder) {
        setSelectedOrder(updatedOrder)
      }
    }
  }, [orders, selectedOrder?.id, isDetailOpen])

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
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
    setSelectedOrder(null)
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
        title="จัดการคำสั่งซื้อ"
        description="ติดตามและจัดการคำสั่งซื้อของลูกค้า"
      />

      <div className="flex flex-1 flex-col gap-6 p-4">
        {/* สถิติภาพรวม */}
        <OrderStats orders={orders} />

        {/* รายการคำสั่งซื้อ */}
        <OrdersTable
          orders={orders}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onSearchChange={handleSearchChange}
          onStatusFilterChange={handleStatusFilterChange}
          onViewDetails={viewOrderDetails}
          getStatusIcon={getStatusIcon}
          getStatusColor={getStatusColor}
          getStatusText={getStatusText}
        />
      </div>

      {/* Order Detail Dialog */}
      <OrderDetailDialog
        order={selectedOrder}
        isOpen={isDetailOpen}
        onClose={handleCloseDialog}
        onStatusChange={handleStatusChange}
        onTrackingNumberUpdate={handleTrackingNumberUpdate}
        getStatusIcon={getStatusIcon}
        getStatusColor={getStatusColor}
        getStatusText={getStatusText}
        getMerchantEditableStatuses={getMerchantEditableStatuses}
      />
    </div>
  )
}
