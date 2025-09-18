// apps/portal/src/app/(main)/admin/payments/page.tsx
"use client"

import { useMemo, useEffect, useRef, useState } from "react"
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
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"

type Payment = {
  id: number
  orderCode: string
  provider: "stripe" | "omise" | "paypal" | "mock"
  method: "card" | "qr" | "promptpay" | "account"
  status: "AUTHORIZED" | "CAPTURED" | "REFUNDED" | "FAILED"
  amountMinor: number
  createdAt: string
}

const MOCK: Payment[] = Array.from({ length: 90 }).map((_, i) => ({
  id: 8000 + i,
  orderCode: `ORD-${(6000 + i).toString(36).toUpperCase()}`,
  provider: (["stripe", "omise", "paypal", "mock"] as Payment["provider"][])[
    i % 4
  ],
  method: (["card", "qr", "promptpay", "account"] as Payment["method"][])[
    i % 4
  ],
  status: (
    ["AUTHORIZED", "CAPTURED", "REFUNDED", "FAILED"] as Payment["status"][]
  )[i % 4],
  amountMinor: 19900 + (i % 5) * 1000,
  createdAt: new Date(Date.now() - i * 3600000).toISOString()
}))
const formatTHB = (m: number) =>
  (m / 100).toLocaleString("th-TH", { style: "currency", currency: "THB" })

function Pager({ page, pageSize, total, onPage, onPageSize }: any) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className="flex items-center justify-between py-3">
      <div className="text-sm text-muted-foreground">{total} payments</div>
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
function useDebounce<T>(v: T, ms = 300) {
  const [s, setS] = useState(v)
  useEffect(() => {
    const t = setTimeout(() => setS(v), ms)
    return () => clearTimeout(t)
  }, [v, ms])
  return s
}

export default function AdminPaymentsPage() {
  const router = useRouter()
  const [q, setQ] = useState("")
  const [provider, setProvider] = useState<Payment["provider"] | "ALL">("ALL")
  const [status, setStatus] = useState<Payment["status"] | "ALL">("ALL")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [openSuggest, setOpenSuggest] = useState(false)
  const [loadingSuggest, setLoadingSuggest] = useState(false)
  const debounceQ = useDebounce(q, 300)
  const timer = useRef<number | null>(null)
  const [suggest, setSuggest] = useState<Payment[]>([])

  useEffect(() => {
    if (!debounceQ.trim()) {
      setOpenSuggest(false)
      setSuggest([])
      return
    }
    setLoadingSuggest(true)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      const t = debounceQ.toLowerCase()
      setSuggest(
        MOCK.filter((p) => p.orderCode.toLowerCase().includes(t)).slice(0, 8)
      )
      setLoadingSuggest(false)
      setOpenSuggest(true)
    }, 220)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [debounceQ])

  const filtered = useMemo(() => {
    let base = MOCK
    const t = q.toLowerCase().trim()
    if (t) base = base.filter((p) => p.orderCode.toLowerCase().includes(t))
    if (provider !== "ALL") base = base.filter((p) => p.provider === provider)
    if (status !== "ALL") base = base.filter((p) => p.status === status)
    return base
  }, [q, provider, status])

  const total = filtered.length
  const rows = useMemo(() => {
    const s = (page - 1) * pageSize
    return filtered.slice(s, s + pageSize)
  }, [filtered, page, pageSize])

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>Transaction records (mock)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Search</label>
              <Popover open={openSuggest} onOpenChange={setOpenSuggest}>
                <PopoverAnchor asChild>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Order code"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      onFocus={() => {
                        if (q.trim()) setOpenSuggest(true)
                      }}
                      onBlur={() =>
                        setTimeout(() => setOpenSuggest(false), 120)
                      }
                    />
                    <Button onClick={() => setOpenSuggest(false)}>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                  </div>
                </PopoverAnchor>
                <PopoverContent
                  className="w-[520px] p-0"
                  align="start"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <div className="max-h-80 overflow-auto">
                    {loadingSuggest ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        Searching...
                      </div>
                    ) : suggest.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No suggestions
                      </div>
                    ) : (
                      suggest.map((s) => (
                        <button
                          key={s.id}
                          className="w-full text-left px-3 py-2 hover:bg-accent"
                          onClick={() => {
                            setQ(s.orderCode)
                            setOpenSuggest(false)
                          }}
                        >
                          <div className="text-sm font-medium">
                            {s.orderCode}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {s.provider}/{s.method} · {s.status} ·{" "}
                            {formatTHB(s.amountMinor)}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm mb-1">Provider</label>
                <Select
                  value={provider}
                  onValueChange={(v) => {
                    setProvider(v as any)
                    setPage(1)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="stripe">stripe</SelectItem>
                    <SelectItem value="omise">omise</SelectItem>
                    <SelectItem value="paypal">paypal</SelectItem>
                    <SelectItem value="mock">mock</SelectItem>
                  </SelectContent>
                </Select>
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
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="AUTHORIZED">AUTHORIZED</SelectItem>
                    <SelectItem value="CAPTURED">CAPTURED</SelectItem>
                    <SelectItem value="REFUNDED">REFUNDED</SelectItem>
                    <SelectItem value="FAILED">FAILED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Provider/Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.orderCode}</TableCell>
                    <TableCell>
                      {r.provider}/{r.method}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatTHB(r.amountMinor)}
                    </TableCell>
                    <TableCell>
                      {new Date(r.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => router.push(`/admin/payments/${r.id}`)}
                      >
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
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

          <Pager
            page={page}
            pageSize={pageSize}
            total={total}
            onPage={setPage}
            onPageSize={(s: number) => {
              setPageSize(s)
              setPage(1)
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
