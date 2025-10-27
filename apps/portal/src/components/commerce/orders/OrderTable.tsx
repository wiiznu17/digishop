// apps/portal/src/components/commerce/orders/OrdersTable.tsx
"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Eye } from "lucide-react"
import { AdminOrderListItem } from "@/types/commerce/orders"
import { StatusBadge } from "./StatusBadge"

const THB = (n?: number | null) =>
  n == null
    ? "-"
    : (n / 100).toLocaleString("th-TH", { style: "currency", currency: "THB" })

type OrdersTableProps = {
  rows: AdminOrderListItem[]
  loading: boolean
  onQuickView: (row: AdminOrderListItem) => void
  onDetail: (row: AdminOrderListItem) => void
}

export const OrdersTable = React.memo(function OrdersTable({
  rows,
  loading,
  onQuickView,
  onDetail
}: OrdersTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-center">Total</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-center">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} className="hover:bg-accent/40">
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <button
                    className="text-left hover:text-primary"
                    onClick={() => onDetail(row)}
                    title="Open detail"
                  >
                    {row.orderCode}
                  </button>
                  <span className="text-xs text-muted-foreground">
                    Order ID: {row.id}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{row.customerName}</span>
                  <span className="text-xs text-muted-foreground">
                    {row.customerEmail}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge status={row.status} />
              </TableCell>
              <TableCell className="text-center">
                {THB(row.grandTotalMinor)}
              </TableCell>
              <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  className="mr-2"
                  onClick={() => onQuickView(row)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={() => onDetail(row)}>
                  Detail
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {!loading && rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                No data
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
})
