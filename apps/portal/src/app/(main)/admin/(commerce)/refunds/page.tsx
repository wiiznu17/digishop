"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  fetchAdminRefundListRequester,
  fetchAdminOrderSuggestByCode,
  AdminRefundLite
} from "@/utils/requesters/refundRequester"
import { Pager } from "@/components/common/Pager"
import AuthGuard from "@/components/AuthGuard"

const formatTHB = (m: number) =>
  (m / 100).toLocaleString("th-TH", { style: "currency", currency: "THB" })

function AdminRefundsPage() {
  const router = useRouter()

  // Filters
  const [status, setStatus] = useState<string>("ALL")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")
  // Search (order id / customer name)
  const [q, setQ] = useState<string>("")
  // Suggest (order_code)
  const [orderCode, setOrderCode] = useState<string>("")
  const [suggests, setSuggests] = useState<
    Array<{ id: number; orderCode: string }>
  >([])

  // Paging
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Data
  const [rows, setRows] = useState<AdminRefundLite[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  // Load list
  const load = async () => {
    setLoading(true)
    const response = await fetchAdminRefundListRequester({
      q,
      orderCode,
      status,
      dateFrom,
      dateTo,
      page,
      pageSize,
      sortBy: "createdAt",
      sortDir: "desc"
    })
    if (response) {
      setRows(response.data)
      setTotal(response.meta.total)
    } else {
      setRows([])
      setTotal(0)
    }
    setLoading(false)
  }

  // Search button
  const doSearch = () => {
    setPage(1)
    void load()
  }

  useEffect(() => {
    void load()
  }, [page, pageSize])

  // Suggest debounce 250ms
  useEffect(() => {
    const t = setTimeout(async () => {
      const q = orderCode.trim()
      if (!q) {
        setSuggests([])
        return
      }
      const s = await fetchAdminOrderSuggestByCode(q)
      const uniq = Array.from(
        new Map(s.map((r) => [r.orderCode, r])).values()
      ).slice(0, 8)
      setSuggests(uniq)
    }, 250)
    return () => clearTimeout(t)
  }, [orderCode])

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  )

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Refunds</CardTitle>
          <CardDescription>Refund requests & results</CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
            {/* Suggest: order_code */}
            <div className="lg:col-span-2">
              <label className="block text-sm mb-1">Order Code</label>
              <div className="relative">
                <Input
                  list="orderCodeList"
                  placeholder="e.g. DS12345678"
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value)}
                />
                <datalist id="orderCodeList">
                  {suggests.map((s) => (
                    <option key={s.orderCode} value={s.orderCode} />
                  ))}
                </datalist>
                {!!orderCode && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute right-1 top-1 h-7 px-2"
                    onClick={() => setOrderCode("")}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Search: order id / customer name */}
            <div className="lg:col-span-2">
              <label className="block text-sm mb-1">Customer name</label>
              <Input
                placeholder="e.g. Alice"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm mb-1">Status</label>
              <Select value={status} onValueChange={(v) => setStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "ALL",
                    "REQUESTED",
                    "APPROVED",
                    "SUCCESS",
                    "FAIL",
                    "CANCELED"
                  ].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date range */}
            <div className="lg:col-span-1.5">
              <label className="block text-sm mb-1">From</label>
              <Input
                type="datetime-local"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="lg:col-span-1.5">
              <label className="block text-sm mb-1">To</label>
              <Input
                type="datetime-local"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            {/* Search btn */}
            <div className="flex items-end">
              <Button className="w-full" onClick={doSearch}>
                Search
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Requested / Created</TableHead>
                  <TableHead className="text-right">Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{r.orderCode}</span>
                        <span className="text-xs text-muted-foreground">
                          Order ID: {r.orderId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{r.customerName ?? "—"}</span>
                        <span className="text-xs text-muted-foreground">
                          {r.customerEmail ?? ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatTHB(r.amountMinor)} {r.currencyCode}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs">
                          Req:{" "}
                          {r.requestedAt
                            ? new Date(r.requestedAt).toLocaleString()
                            : "—"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Created: {new Date(r.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/orders/${r.orderId}`)
                        }
                      >
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && !loading && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No data
                    </TableCell>
                  </TableRow>
                )}
                {loading && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      Loading…
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <Pager
            page={page}
            pageSize={pageSize}
            total={total}
            onPage={(p: number) => {
              setPage(p)
            }}
            onPageSize={(s: number) => {
              setPageSize(s)
              setPage(1)
            }}
          />

          {/* Quick info */}
          <div className="text-xs text-muted-foreground">
            Page {page} / {totalPages}. Filters apply to Refund created_at.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Guard({ children }: { children: React.ReactNode }) {
  "use client"
  return <AuthGuard requiredPerms={["REFUNDS_READ"]}>{children}</AuthGuard>
}

export default function Page() {
  return (
    <Guard>
      <AdminRefundsPage />
    </Guard>
  )
}
