// apps/portal/src/app/(main)/admin/analytics/page.tsx
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { CalendarDays, Search, Eye } from "lucide-react"

type Store = { id: number; name: string; email: string }
type Row = {
  storeId: number
  storeName: string
  orders: number
  gmvMinor: number
  aovMinor: number
}

const STORES: Store[] = Array.from({ length: 40 }).map((_, i) => ({
  id: 2000 + i,
  name: `Store ${i + 1}`,
  email: `store${i + 1}@shop.mail`
}))

const fmtTHB = (minor: number) =>
  (minor / 100).toLocaleString("th-TH", { style: "currency", currency: "THB" })

function useDebounce<T>(v: T, ms = 300) {
  const [s, setS] = useState(v)
  useEffect(() => {
    const t = setTimeout(() => setS(v), ms)
    return () => clearTimeout(t)
  }, [v, ms])
  return s
}

export default function AnalyticsPage() {
  // Search + suggest
  const [q, setQ] = useState("")
  const dq = useDebounce(q, 250)
  const [openSuggest, setOpenSuggest] = useState(false)
  const [loadingSuggest, setLoadingSuggest] = useState(false)
  const [suggest, setSuggest] = useState<Store[]>([])
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (!dq.trim()) {
      setOpenSuggest(false)
      setSuggest([])
      return
    }
    setLoadingSuggest(true)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      const t = dq.toLowerCase()
      setSuggest(
        STORES.filter(
          (s) =>
            s.name.toLowerCase().includes(t) ||
            s.email.toLowerCase().includes(t)
        ).slice(0, 8)
      )
      setLoadingSuggest(false)
      setOpenSuggest(true)
    }, 200)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [dq])

  // Filters
  const [period, setPeriod] = useState<"THIS_MONTH" | "LAST_30" | "CUSTOM">(
    "THIS_MONTH"
  )
  const [from, setFrom] = useState(() =>
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10)
  )
  const [to, setTo] = useState(() =>
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10)
  )
  const [segment, setSegment] = useState<"ALL" | "TOP" | "LOW">("ALL")

  // mock rows
  const rows: Row[] = useMemo(() => {
    const base = STORES.map((s, i) => {
      const ord = 50 + ((i * 13) % 120)
      const gmv = ord * (5000 + (i % 5) * 1200)
      const aov = Math.round(gmv / ord)
      return {
        storeId: s.id,
        storeName: s.name,
        orders: ord,
        gmvMinor: gmv,
        aovMinor: aov
      }
    })
    let f = base
    if (q.trim()) {
      const t = q.toLowerCase()
      f = f.filter((r) => r.storeName.toLowerCase().includes(t))
    }
    if (segment === "TOP")
      f = [...f].sort((a, b) => b.gmvMinor - a.gmvMinor).slice(0, 10)
    if (segment === "LOW")
      f = [...f].sort((a, b) => a.gmvMinor - b.gmvMinor).slice(0, 10)
    return [...f].sort((a, b) => b.gmvMinor - a.gmvMinor)
  }, [q, segment])

  // paging
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const total = rows.length
  const pageRows = useMemo(() => {
    const s = (page - 1) * pageSize
    return rows.slice(s, s + pageSize)
  }, [rows, page, pageSize])

  // quick view
  const [openQV, setOpenQV] = useState(false)
  const [current, setCurrent] = useState<Row | null>(null)

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>สรุปผลการขายและร้านค้ายอดนิยม</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* search + suggest */}
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Search store</label>
            <Popover open={openSuggest} onOpenChange={setOpenSuggest}>
              <PopoverAnchor asChild>
                <div className="flex gap-2">
                  <Input
                    placeholder="Store name / email"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
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
                          setQ(s.name)
                          setOpenSuggest(false)
                        }}
                      >
                        <div className="text-sm font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.email}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="block text-sm mb-1">Period</label>
            <Select
              value={period}
              onValueChange={(v: any) => {
                setPeriod(v)
                if (v === "THIS_MONTH") {
                  const f = new Date(
                    new Date().getFullYear(),
                    new Date().getMonth(),
                    1
                  )
                  const t = new Date(
                    new Date().getFullYear(),
                    new Date().getMonth() + 1,
                    0
                  )
                  setFrom(f.toISOString().slice(0, 10))
                  setTo(t.toISOString().slice(0, 10))
                } else if (v === "LAST_30") {
                  const t = new Date()
                  const f = new Date(Date.now() - 29 * 86400000)
                  setFrom(f.toISOString().slice(0, 10))
                  setTo(t.toISOString().slice(0, 10))
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="THIS_MONTH">This month</SelectItem>
                <SelectItem value="LAST_30">Last 30 days</SelectItem>
                <SelectItem value="CUSTOM">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm mb-1">From</label>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={from}
                  disabled={period !== "CUSTOM"}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">To</label>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={to}
                  disabled={period !== "CUSTOM"}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Segment</label>
            <Select
              value={segment}
              onValueChange={(v: any) => {
                setSegment(v)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="TOP">Top 10 (GMV)</SelectItem>
                <SelectItem value="LOW">Lowest 10 (GMV)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Top stores table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Stores (by GMV)</CardTitle>
          <CardDescription>
            เรียงจากมากไปน้อยในช่วงวันที่ที่เลือก
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">GMV</TableHead>
                  <TableHead className="text-right">AOV</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((r, idx) => (
                  <TableRow key={r.storeId}>
                    <TableCell>{(page - 1) * pageSize + idx + 1}</TableCell>
                    <TableCell>{r.storeName}</TableCell>
                    <TableCell className="text-right">
                      {r.orders.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {fmtTHB(r.gmvMinor)}
                    </TableCell>
                    <TableCell className="text-right">
                      {fmtTHB(r.aovMinor)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCurrent(r)
                          setOpenQV(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {pageRows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-sm text-muted-foreground"
                    >
                      No data
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* pager */}
          <div className="flex items-center justify-between gap-3 py-3">
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1}-
              {Math.min(page * pageSize, total)} of {total}
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  const s = Number(v)
                  setPageSize(s)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50].map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setPage(Math.min(Math.ceil(total / pageSize), page + 1))
                }
                disabled={page >= Math.ceil(total / pageSize)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick view */}
      <Dialog open={openQV} onOpenChange={setOpenQV}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Store quick view</DialogTitle>
          </DialogHeader>
          {current && (
            <div className="text-sm space-y-2">
              <div>
                Store: <span className="font-medium">{current.storeName}</span>
              </div>
              <div>Orders: {current.orders.toLocaleString()}</div>
              <div>GMV: {fmtTHB(current.gmvMinor)}</div>
              <div>AOV: {fmtTHB(current.aovMinor)}</div>
              <div className="text-muted-foreground">* Mock analytics only</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
