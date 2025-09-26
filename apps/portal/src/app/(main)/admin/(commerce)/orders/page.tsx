// apps/portal/src/app/(main)/admin/(commerce)/orders/page.tsx
"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { DashboardHeader } from "@/components/dashboard-header"

import { OrdersSearchBox } from "@/components/commerce/orders/OrderSearchBox"
import { OrdersFilterBar } from "@/components/commerce/orders/OrderFilterBar"
import { OrdersTable } from "@/components/commerce/orders/OrderTable"
import { StatusBadge } from "@/components/commerce/orders/StatusBadge"
import { Pager } from "@/components/common/Pager"

import {
  AdminFetchOrdersParams,
  AdminOrderListItem,
  AdminOrderStatus
} from "@/types/commerce/orders"

import { fetchAdminOrdersRequester } from "@/utils/requesters/orderRequester"
import { CustomerEmailSearchBox } from "@/components/commerce/orders/CustomerEmailSearchBox"

const THB = (n?: number | null) =>
  n == null
    ? "-"
    : (n / 100).toLocaleString("th-TH", { style: "currency", currency: "THB" })

export default function AdminOrdersPage() {
  const router = useRouter()
  const sp = useSearchParams()

  const [qDraft, setQDraft] = useState(sp.get("q") ?? "")
  const [statusDraft, setStatusDraft] = useState<AdminOrderStatus | "ALL">(
    (sp.get("status") as AdminOrderStatus) ?? "ALL"
  )
  const [dateFromDraft, setDateFromDraft] = useState(sp.get("dateFrom") ?? "")
  const [dateToDraft, setDateToDraft] = useState(sp.get("dateTo") ?? "")

  const [q, setQ] = useState(sp.get("q") ?? "")
  const [status, setStatus] = useState<AdminOrderStatus | "ALL">(
    (sp.get("status") as AdminOrderStatus) ?? "ALL"
  )
  const [dateFrom, setDateFrom] = useState(sp.get("dateFrom") ?? "")
  const [dateTo, setDateTo] = useState(sp.get("dateTo") ?? "")
  const [page, setPage] = useState<number>(Number(sp.get("page") ?? 1))
  const [pageSize, setPageSize] = useState<number>(
    Number(sp.get("pageSize") ?? 20)
  )

  const [rows, setRows] = useState<AdminOrderListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [customerEmailDraft, setCustomerEmailDraft] = useState(
    sp.get("customerEmail") ?? ""
  )
  const [customerEmail, setCustomerEmail] = useState(
    sp.get("customerEmail") ?? ""
  )

  const params: AdminFetchOrdersParams = useMemo(
    () => ({
      q: q || undefined,
      status: status === "ALL" ? undefined : status,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      customerEmail: customerEmail || undefined,
      sortBy: "createdAt",
      sortDir: "desc",
      page,
      pageSize
    }),
    [q, status, dateFrom, dateTo, customerEmail, page, pageSize]
  )

  const fetchList = useCallback(async () => {
    setLoading(true)
    const res = await fetchAdminOrdersRequester(params)
    setLoading(false)
    if (!res) return
    setRows(res.data)
    setTotal(res.meta.total)
  }, [params])

  // ยิงครั้งแรกตอนเปิดหน้า (ใช้ค่าจาก URL เป็น submitted)
  useEffect(() => {
    void fetchList()
  }, [fetchList])
  useEffect(() => {
    const next = new URLSearchParams()
    if (q) next.set("q", q)
    if (status !== "ALL") next.set("status", status)
    if (dateFrom) next.set("dateFrom", dateFrom)
    if (dateTo) next.set("dateTo", dateTo)
    if (customerEmail) next.set("customerEmail", customerEmail) // ⬅️ sync URL
    if (page !== 1) next.set("page", String(page))
    if (pageSize !== 20) next.set("pageSize", String(pageSize))
    router.push(`/admin/orders${next.toString() ? `?${next.toString()}` : ""}`)
  }, [router, q, status, dateFrom, dateTo, customerEmail, page, pageSize])

  const handleSubmitSearch = useCallback(() => {
    setQ(qDraft.trim())
    setStatus(statusDraft)
    setDateFrom(dateFromDraft)
    setDateTo(dateToDraft)
    setCustomerEmail(customerEmailDraft.trim())
    setPage(1)
    void fetchList()
  }, [
    qDraft,
    statusDraft,
    dateFromDraft,
    dateToDraft,
    customerEmailDraft,
    fetchList
  ])
  // เปลี่ยนหน้า/ PageSize ยิงทันที (หลังจากมีผลการค้นหาแล้ว)
  const handlePage = useCallback(
    (p: number) => {
      setPage(p)
      setTimeout(() => {
        void fetchList()
      }, 0)
    },
    [fetchList]
  )
  const handlePageSize = useCallback(
    (s: number) => {
      setPageSize(s)
      setPage(1)
      setTimeout(() => {
        void fetchList()
      }, 0)
    },
    [fetchList]
  )
  const handleClearFilters = useCallback(() => {
    // ล้างค่า draft
    setQDraft("")
    setStatusDraft("ALL")
    setDateFromDraft("")
    setDateToDraft("")
    setCustomerEmailDraft("")

    // ล้างค่า submitted
    setQ("")
    setStatus("ALL")
    setDateFrom("")
    setDateTo("")
    setCustomerEmail("")

    // รีเซ็ตหน้า
    setPage(1)

    // ยิงโหลดใหม่หลัง state set แล้ว
    setTimeout(() => {
      void fetchList()
    }, 0)
  }, [fetchList])

  // Handlers สำหรับตาราง
  const [openQV, setOpenQV] = useState(false)
  const [current, setCurrent] = useState<AdminOrderListItem | null>(null)
  const handleDetail = useCallback(
    (row: AdminOrderListItem) => router.push(`/admin/orders/${row.id}`),
    [router]
  )
  const handleQuickView = useCallback((row: AdminOrderListItem) => {
    setCurrent(row)
    setOpenQV(true)
  }, [])

  return (
    <div>
      <DashboardHeader
        title="Orders"
        description="View all orders (per store)"
      />

      <div className="p-4 space-y-4">
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>Orders (Admin)</CardTitle>
            <CardDescription>Search &amp; filter orders</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              {/* Order code */}
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Order code</label>
                <OrdersSearchBox value={qDraft} onChange={setQDraft} />
              </div>

              {/* Customer email */}
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Customer email</label>
                <CustomerEmailSearchBox
                  value={customerEmailDraft}
                  onChange={setCustomerEmailDraft}
                />
              </div>

              <OrdersFilterBar
                status={statusDraft}
                onStatusChange={(v) => setStatusDraft(v)}
                dateFrom={dateFromDraft}
                onDateFromChange={setDateFromDraft}
                dateTo={dateToDraft}
                onDateToChange={setDateToDraft}
              />

              {/* ปุ่มชิดขวา ขวาสุด = Clear */}
              <div className="flex items-end justify-end gap-2">
                <Button onClick={handleSubmitSearch} className="mt-2 md:mt-6">
                  Search
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="mt-2 md:mt-6"
                >
                  Clear filter
                </Button>
              </div>
            </div>

            {/* Table */}
            <OrdersTable
              rows={rows}
              loading={loading}
              onQuickView={handleQuickView}
              onDetail={handleDetail}
            />

            <Pager
              page={page}
              pageSize={pageSize}
              total={total}
              onPage={handlePage}
              onPageSize={handlePageSize}
            />
          </CardContent>
        </Card>

        {/* Quick view */}
        <Dialog open={openQV} onOpenChange={setOpenQV}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Order Quick View {current ? `— ${current.orderCode}` : ""}
              </DialogTitle>
            </DialogHeader>
            {current && (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Customer: </span>
                  {current.customerName} ({current.customerEmail})
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Status: </span>
                  <StatusBadge status={current.status} />
                </div>
                <div>
                  <span className="text-muted-foreground">Total: </span>
                  {THB(current.grandTotalMinor)}
                </div>
                <div>
                  <span className="text-muted-foreground">Created: </span>
                  {new Date(current.createdAt).toLocaleString()}
                </div>
                <Button
                  className="mt-2"
                  onClick={() => {
                    setOpenQV(false)
                    router.push(`/admin/orders/${current.id}`)
                  }}
                >
                  Open detail
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
