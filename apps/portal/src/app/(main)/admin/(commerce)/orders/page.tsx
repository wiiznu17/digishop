// apps/portal/src/app/(main)/admin/orders/page.tsx
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
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
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Eye, Search } from "lucide-react"

type OrderRow = {
  id: number
  orderCode: string
  customerName: string
  email: string
  status:
    | "PENDING"
    | "PAID"
    | "PROCESSING"
    | "READY_TO_SHIP"
    | "HANDED_OVER"
    | "SHIPPED"
    | "DELIVERED"
    | "COMPLETE"
    | "MERCHANT_CANCELED"
    | "REFUND_REQUEST"
    | "REFUND_PROCESSING"
    | "REFUND_SUCCESS"
    | "REFUND_FAIL"
  total: number
  createdAt: string
}

const MOCK: OrderRow[] = Array.from({ length: 137 }).map((_, i) => ({
  id: 5000 + i,
  orderCode: `ORD-${(5000 + i).toString(36).toUpperCase()}`,
  customerName: ["Alice", "Bob", "Carol", "David", "Eve"][i % 5],
  email: ["a@x.com", "b@x.com", "c@x.com", "d@x.com", "e@x.com"][i % 5],
  status: (
    [
      "PENDING",
      "PAID",
      "PROCESSING",
      "READY_TO_SHIP",
      "HANDED_OVER",
      "SHIPPED",
      "DELIVERED",
      "COMPLETE",
      "MERCHANT_CANCELED",
      "REFUND_REQUEST",
      "REFUND_PROCESSING",
      "REFUND_SUCCESS",
      "REFUND_FAIL"
    ] as OrderRow["status"][]
  )[i % 13],
  total: 1000 + (i % 8) * 250,
  createdAt: new Date(Date.now() - i * 86400000).toISOString()
}))

const STATUS_OPTIONS: { value: OrderRow["status"] | "ALL"; label: string }[] = [
  { value: "ALL", label: "All status" },
  { value: "PENDING", label: "PENDING" },
  { value: "PAID", label: "PAID" },
  { value: "PROCESSING", label: "PROCESSING" },
  { value: "READY_TO_SHIP", label: "READY_TO_SHIP" },
  { value: "HANDED_OVER", label: "HANDED_OVER" },
  { value: "SHIPPED", label: "SHIPPED" },
  { value: "DELIVERED", label: "DELIVERED" },
  { value: "COMPLETE", label: "COMPLETE" },
  { value: "MERCHANT_CANCELED", label: "MERCHANT_CANCELED" },
  { value: "REFUND_REQUEST", label: "REFUND_REQUEST" },
  { value: "REFUND_PROCESSING", label: "REFUND_PROCESSING" },
  { value: "REFUND_SUCCESS", label: "REFUND_SUCCESS" },
  { value: "REFUND_FAIL", label: "REFUND_FAIL" }
]

// ——— tiny utils
const formatTHB = (n: number) =>
  (n || 0).toLocaleString("th-TH", { style: "currency", currency: "THB" })

function useDebounce<T>(val: T, ms = 400) {
  const [v, setV] = useState(val)
  useEffect(() => {
    const t = setTimeout(() => setV(val), ms)
    return () => clearTimeout(t)
  }, [val, ms])
  return v
}

// ——— Pagination mini
function Pager({
  page,
  pageSize,
  total,
  onPage,
  onPageSize
}: {
  page: number
  pageSize: number
  total: number
  onPage: (p: number) => void
  onPageSize: (s: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-medium">
          {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)}
        </span>{" "}
        of <span className="font-medium">{total}</span>
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSize(Number(v))}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 50, 100].map((s) => (
              <SelectItem key={s} value={String(s)}>
                {s} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          Prev
        </Button>
        <div className="text-sm">
          {page} / {totalPages}
        </div>
        <Button
          variant="outline"
          onClick={() => onPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

export default function AdminOrdersPage() {
  const router = useRouter()
  const sp = useSearchParams()

  // URL state
  const [q, setQ] = useState(sp.get("q") ?? "")
  const [status, setStatus] = useState<OrderRow["status"] | "ALL">(
    (sp.get("status") as any) ?? "ALL"
  )
  const [page, setPage] = useState<number>(Number(sp.get("page") ?? 1))
  const [pageSize, setPageSize] = useState<number>(
    Number(sp.get("pageSize") ?? 20)
  )

  // suggest state
  const [openSuggest, setOpenSuggest] = useState(false)
  const [loadingSuggest, setLoadingSuggest] = useState(false)
  const debounceQ = useDebounce(q, 300)
  const timeoutRef = useRef<number | null>(null)
  const [suggestList, setSuggestList] = useState<OrderRow[]>([])

  useEffect(() => {
    // mock async suggest
    if (debounceQ.trim().length === 0) {
      setSuggestList([])
      setOpenSuggest(false)
      return
    }
    setLoadingSuggest(true)
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => {
      const t = debounceQ.toLowerCase()
      const picked = MOCK.filter(
        (o) =>
          o.orderCode.toLowerCase().includes(t) ||
          o.customerName.toLowerCase().includes(t) ||
          o.email.toLowerCase().includes(t)
      ).slice(0, 8)
      setSuggestList(picked)
      setLoadingSuggest(false)
      setOpenSuggest(true)
    }, 250)
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [debounceQ])

  // filter + paginate client-side (mock)
  const filtered = useMemo(() => {
    const t = q.toLowerCase().trim()
    let base = MOCK
    if (t) {
      base = base.filter(
        (o) =>
          o.orderCode.toLowerCase().includes(t) ||
          o.customerName.toLowerCase().includes(t) ||
          o.email.toLowerCase().includes(t)
      )
    }
    if (status !== "ALL") base = base.filter((o) => o.status === status)
    return base
  }, [q, status])

  const total = filtered.length
  const sliced = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  // quick view
  const [openQV, setOpenQV] = useState(false)
  const [current, setCurrent] = useState<OrderRow | null>(null)

  const openQuickView = (row: OrderRow) => {
    setCurrent(row)
    setOpenQV(true)
  }

  const goDetail = (row: OrderRow) => router.push(`/admin/orders/${row.id}`) // หน้า detail จริงค่อยทำเพิ่ม

  // keep URL in sync (optional)
  useEffect(() => {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (status && status !== "ALL") params.set("status", status)
    if (page !== 1) params.set("page", String(page))
    if (pageSize !== 20) params.set("pageSize", String(pageSize))
    history.replaceState(null, "", `/admin/orders?${params.toString()}`)
  }, [q, status, page, pageSize])

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle>Orders</CardTitle>
          <CardDescription>Search & manage all orders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Search + filter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Search</label>
              <Popover open={openSuggest} onOpenChange={setOpenSuggest}>
                <PopoverAnchor asChild>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Order code / customer / email"
                      value={q}
                      onChange={(e) => {
                        setQ(e.target.value)
                      }}
                      onFocus={() => {
                        if (q.trim()) setOpenSuggest(true)
                      }}
                      onBlur={() => {
                        setTimeout(() => setOpenSuggest(false), 120)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setOpenSuggest(false)
                      }}
                    />
                    <Button
                      onClick={() => setOpenSuggest(false)}
                      className="shrink-0"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                  </div>
                </PopoverAnchor>
                <PopoverContent
                  className="w-[560px] p-0"
                  align="start"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <div className="max-h-80 overflow-auto">
                    {loadingSuggest && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        Searching...
                      </div>
                    )}
                    {!loadingSuggest && suggestList.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No suggestions
                      </div>
                    ) : (
                      suggestList.map((s) => (
                        <button
                          key={s.id}
                          className="w-full text-left px-3 py-2 hover:bg-accent"
                          onClick={() => {
                            setQ(s.orderCode)
                            setOpenSuggest(false)
                          }}
                        >
                          <div className="text-sm font-medium">
                            {s.orderCode} — {s.customerName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {s.email} · {s.status} · {formatTHB(s.total)}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="block text-sm mb-1">Status</label>
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v as any)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sliced.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      {row.orderCode}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{row.customerName}</span>
                        <span className="text-xs text-muted-foreground">
                          {row.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatTHB(row.total)}
                    </TableCell>
                    <TableCell>
                      {new Date(row.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-2"
                        onClick={() => openQuickView(row)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" onClick={() => goDetail(row)}>
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {sliced.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <div className="text-sm text-muted-foreground">
                        No data
                      </div>
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
            onPage={setPage}
            onPageSize={(s) => {
              setPageSize(s)
              setPage(1)
            }}
          />
        </CardContent>
      </Card>

      {/* Quick view dialog */}
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
                {current.customerName} ({current.email})
              </div>
              <div>
                <span className="text-muted-foreground">Status: </span>
                {current.status}
              </div>
              <div>
                <span className="text-muted-foreground">Total: </span>
                {formatTHB(current.total)}
              </div>
              <div>
                <span className="text-muted-foreground">Created: </span>
                {new Date(current.createdAt).toLocaleString()}
              </div>
              <Button
                className="mt-2"
                onClick={() => {
                  setOpenQV(false)
                  if (current) router.push(`/admin/orders/${current.id}`)
                }}
              >
                Open detail
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
