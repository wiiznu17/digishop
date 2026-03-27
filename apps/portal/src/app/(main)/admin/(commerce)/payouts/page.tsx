// apps/portal/src/app/(main)/admin/payouts/page.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Eye, Search, Timer } from 'lucide-react'

// ================= Mock data =================

type Merchant = {
  id: number
  storeName: string
  email: string
}

type Txn = {
  merchantId: number
  createdAt: string // ISO
  amountMinor: number
  feeMinor: number
}

type PayoutStatus =
  | 'PENDING' // ยังไม่ยิงจ่าย
  | 'SCHEDULED' // cron ตั้งคิวไว้แล้ว
  | 'PROCESSING' // กำลังโอน
  | 'PAID' // โอนสำเร็จ
  | 'FAILED' // โอนล้มเหลว
  | 'ON_HOLD' // ระงับ

// ร้านค้า (สมมติ)
const MERCHANTS: Merchant[] = Array.from({ length: 36 }).map((_, i) => ({
  id: 1000 + i,
  storeName: `Store ${i + 1}`,
  email: `store${i + 1}@shop.mail`
}))

// สุ่มธุรกรรมย้อนหลัง ~120 วัน
const TXNS: Txn[] = (() => {
  const rows: Txn[] = []
  for (const m of MERCHANTS) {
    for (let i = 0; i < 40; i++) {
      const daysAgo = Math.floor(Math.random() * 120)
      const created = new Date(Date.now() - daysAgo * 86400000)
      const amt = 10000 + (i % 7) * 2500 + Math.floor(Math.random() * 1500)
      const fee = Math.floor(amt * 0.03) + 300 // 3% + 3.00 THB (minor)
      rows.push({
        merchantId: m.id,
        createdAt: created.toISOString(),
        amountMinor: amt,
        feeMinor: fee
      })
    }
  }
  return rows
})()

// ================= Helpers =================

const fmtTHB = (minor: number) =>
  (minor / 100).toLocaleString('th-TH', { style: 'currency', currency: 'THB' })

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
}
function endOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
}
function lastMonthRange() {
  const d = new Date()
  const first = new Date(d.getFullYear(), d.getMonth() - 1, 1, 0, 0, 0, 0)
  const last = new Date(d.getFullYear(), d.getMonth(), 0, 23, 59, 59, 999)
  return { from: first, to: last }
}

function useDebounce<T>(val: T, ms = 300) {
  const [v, setV] = useState(val)
  useEffect(() => {
    const t = setTimeout(() => setV(val), ms)
    return () => clearTimeout(t)
  }, [val, ms])
  return v
}

// ================= Page =================

type PeriodMode = 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM'

type Row = {
  merchantId: number
  storeName: string
  email: string
  totalOrders: number
  grossMinor: number
  feeMinor: number
  netMinor: number
  status: PayoutStatus
  scheduledAt?: string
}

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
        Showing{' '}
        <span className="font-medium">
          {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)}
        </span>{' '}
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

export default function AdminPayoutsPage() {
  const router = useRouter()

  // ------- search + suggest -------
  const [q, setQ] = useState('')
  const debounceQ = useDebounce(q, 300)
  const [openSuggest, setOpenSuggest] = useState(false)
  const [loadingSuggest, setLoadingSuggest] = useState(false)
  const suggestTimer = useRef<number | null>(null)
  const [suggestList, setSuggestList] = useState<Merchant[]>([])

  useEffect(() => {
    if (!debounceQ.trim()) {
      setOpenSuggest(false)
      setSuggestList([])
      return
    }
    setLoadingSuggest(true)
    if (suggestTimer.current) window.clearTimeout(suggestTimer.current)
    suggestTimer.current = window.setTimeout(() => {
      const t = debounceQ.toLowerCase()
      const res = MERCHANTS.filter(
        (m) =>
          m.storeName.toLowerCase().includes(t) ||
          m.email.toLowerCase().includes(t)
      ).slice(0, 8)
      setSuggestList(res)
      setLoadingSuggest(false)
      setOpenSuggest(true)
    }, 220)
    return () => {
      if (suggestTimer.current) window.clearTimeout(suggestTimer.current)
    }
  }, [debounceQ])

  // ------- filters -------
  const [period, setPeriod] = useState<PeriodMode>('THIS_MONTH')
  const [dateFrom, setDateFrom] = useState<string>(() =>
    startOfMonth().toISOString().slice(0, 10)
  )
  const [dateTo, setDateTo] = useState<string>(() =>
    endOfMonth().toISOString().slice(0, 10)
  )
  const [status, setStatus] = useState<PayoutStatus | 'ALL'>('ALL')

  // ------- pagination -------
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // ------- derive period range -------
  const { fromDate, toDate } = useMemo(() => {
    if (period === 'THIS_MONTH') {
      return { fromDate: startOfMonth(), toDate: endOfMonth() }
    }
    if (period === 'LAST_MONTH') {
      const { from, to } = lastMonthRange()
      return { fromDate: from, toDate: to }
    }
    // CUSTOM
    const f = new Date(dateFrom)
    const t = new Date(dateTo)
    if (Number.isNaN(f.getTime()) || Number.isNaN(t.getTime())) {
      const defF = startOfMonth()
      const defT = endOfMonth()
      return { fromDate: defF, toDate: defT }
    }
    t.setHours(23, 59, 59, 999)
    return { fromDate: f, toDate: t }
  }, [period, dateFrom, dateTo])

  // ------- aggregate to rows -------
  const rows: Row[] = useMemo(() => {
    const ftime = fromDate.getTime()
    const ttime = toDate.getTime()
    return MERCHANTS.map((m, idx) => {
      const tx = TXNS.filter(
        (t) =>
          t.merchantId === m.id &&
          new Date(t.createdAt).getTime() >= ftime &&
          new Date(t.createdAt).getTime() <= ttime
      )
      const gross = tx.reduce((s, t) => s + t.amountMinor, 0)
      const fee = tx.reduce((s, t) => s + t.feeMinor, 0)
      const net = gross - fee

      // สถานะสมมติ: ถ้า net=0 ให้ ON_HOLD, ถ้ามากกว่า 0 หมุนเวียนสถานะ
      const statusPool: PayoutStatus[] = [
        'PENDING',
        'SCHEDULED',
        'PROCESSING',
        'PAID',
        'FAILED'
      ]
      const st: PayoutStatus =
        net <= 0 ? 'ON_HOLD' : statusPool[idx % statusPool.length]

      // กำหนดวันโอน (เช่น สิ้นเดือน + 3 วัน)
      const scheduled = new Date(toDate)
      scheduled.setDate(scheduled.getDate() + 3)

      return {
        merchantId: m.id,
        storeName: m.storeName,
        email: m.email,
        totalOrders: tx.length,
        grossMinor: gross,
        feeMinor: fee,
        netMinor: net,
        status: st,
        scheduledAt: net > 0 ? scheduled.toISOString() : undefined
      }
    })
  }, [fromDate, toDate])

  // ------- apply search + filters -------
  const filtered = useMemo(() => {
    const t = q.toLowerCase().trim()
    let base = rows
    if (t)
      base = base.filter(
        (r) =>
          r.storeName.toLowerCase().includes(t) ||
          r.email.toLowerCase().includes(t)
      )
    if (status !== 'ALL') base = base.filter((r) => r.status === status)
    // sort: net desc
    base = [...base].sort((a, b) => b.netMinor - a.netMinor)
    return base
  }, [rows, q, status])

  const total = filtered.length
  const pageRows = useMemo(() => {
    const s = (page - 1) * pageSize
    return filtered.slice(s, s + pageSize)
  }, [filtered, page, pageSize])

  // ------- quick view -------
  const [openQV, setOpenQV] = useState(false)
  const [current, setCurrent] = useState<Row | null>(null)

  // ------- cron meta (mock) -------
  const nextCron = useMemo(() => {
    // สมมติวิ่งทุก 03:00 น.
    const d = new Date()
    d.setHours(3, 0, 0, 0)
    if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1)
    return d
  }, [])

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle>Payouts</CardTitle>
          <CardDescription>
            การโอนเงินให้ร้านค้าตามรอบเวลา (cron) — สรุปยอดตามช่วงวันที่เลือก
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cron info */}
          <div className="flex items-center gap-2 text-sm rounded-md border p-3 bg-muted/30">
            <Timer className="h-4 w-4" />
            <div>
              Next cron run:{' '}
              <span className="font-medium">{nextCron.toLocaleString()}</span> ·
              Policy: โอนภายใน 3 วันหลังสิ้นงวด (mock)
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search + suggest */}
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Search store</label>
              <Popover open={openSuggest} onOpenChange={setOpenSuggest}>
                <PopoverAnchor asChild>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Store / email"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      onFocus={() => {
                        if (q.trim()) setOpenSuggest(true)
                      }}
                      onBlur={() => {
                        setTimeout(() => setOpenSuggest(false), 120)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setOpenSuggest(false)
                      }}
                    />
                    <Button
                      className="shrink-0"
                      onClick={() => setOpenSuggest(false)}
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
                    {loadingSuggest ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        Searching...
                      </div>
                    ) : suggestList.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No suggestions
                      </div>
                    ) : (
                      suggestList.map((s) => (
                        <button
                          key={s.id}
                          className="w-full text-left px-3 py-2 hover:bg-accent"
                          onClick={() => {
                            setQ(s.storeName)
                            setOpenSuggest(false)
                          }}
                        >
                          <div className="text-sm font-medium">
                            {s.storeName}
                          </div>
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

            {/* Period */}
            <div>
              <label className="block text-sm mb-1">Period</label>
              <Select
                value={period}
                onValueChange={(v: PeriodMode) => {
                  setPeriod(v)
                  if (v === 'THIS_MONTH') {
                    setDateFrom(startOfMonth().toISOString().slice(0, 10))
                    setDateTo(endOfMonth().toISOString().slice(0, 10))
                  } else if (v === 'LAST_MONTH') {
                    const { from, to } = lastMonthRange()
                    setDateFrom(from.toISOString().slice(0, 10))
                    setDateTo(to.toISOString().slice(0, 10))
                  }
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="THIS_MONTH">This month</SelectItem>
                  <SelectItem value="LAST_MONTH">Last month</SelectItem>
                  <SelectItem value="CUSTOM">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm mb-1">Payout status</label>
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v as PayoutStatus)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="PENDING">PENDING</SelectItem>
                  <SelectItem value="SCHEDULED">SCHEDULED</SelectItem>
                  <SelectItem value="PROCESSING">PROCESSING</SelectItem>
                  <SelectItem value="PAID">PAID</SelectItem>
                  <SelectItem value="FAILED">FAILED</SelectItem>
                  <SelectItem value="ON_HOLD">ON_HOLD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date range (custom) */}
            <div className="md:col-span-2 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm mb-1">From</label>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dateFrom}
                    disabled={period !== 'CUSTOM'}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">To</label>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dateTo}
                    disabled={period !== 'CUSTOM'}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Fees</TableHead>
                  <TableHead className="text-right">Net payable</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((r) => (
                  <TableRow key={r.merchantId}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{r.storeName}</span>
                        <span className="text-xs text-muted-foreground">
                          {r.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{r.totalOrders}</TableCell>
                    <TableCell className="text-right">
                      {fmtTHB(r.grossMinor)}
                    </TableCell>
                    <TableCell className="text-right">
                      {fmtTHB(r.feeMinor)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={r.netMinor <= 0 ? 'text-destructive' : ''}
                      >
                        {fmtTHB(r.netMinor)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {r.scheduledAt
                        ? new Date(r.scheduledAt).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          r.status === 'PAID'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : r.status === 'FAILED'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                              : r.status === 'PROCESSING'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                : r.status === 'SCHEDULED'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
                                  : r.status === 'ON_HOLD'
                                    ? 'bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                    : ''
                        }
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-2"
                        onClick={() => {
                          setCurrent(r)
                          setOpenQV(true)
                        }}
                        title="Quick View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/payouts/${r.merchantId}`)
                        }
                      >
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {pageRows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-10 text-sm text-muted-foreground"
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
            onPageSize={(s) => {
              setPageSize(s)
              setPage(1)
            }}
          />
        </CardContent>
      </Card>

      {/* Quick View */}
      <Dialog open={openQV} onOpenChange={setOpenQV}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payout quick view</DialogTitle>
          </DialogHeader>
          {current && (
            <div className="text-sm space-y-2">
              <div>
                <span className="text-muted-foreground">Store: </span>
                {current.storeName} ({current.email})
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-muted-foreground">Gross</div>
                  <div className="font-medium">
                    {fmtTHB(current.grossMinor)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Fees</div>
                  <div className="font-medium">{fmtTHB(current.feeMinor)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">
                    Net payable
                  </div>
                  <div
                    className={`font-medium ${
                      current.netMinor <= 0 ? 'text-destructive' : ''
                    }`}
                  >
                    {fmtTHB(current.netMinor)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Orders</div>
                  <div className="font-medium">{current.totalOrders}</div>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Status: </span>
                {current.status}
              </div>
              <div>
                <span className="text-muted-foreground">Scheduled: </span>
                {current.scheduledAt
                  ? new Date(current.scheduledAt).toLocaleString()
                  : '-'}
              </div>
              <Button
                className="mt-2"
                onClick={() => {
                  setOpenQV(false)
                  router.push(`/admin/payouts/${current.merchantId}`)
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
