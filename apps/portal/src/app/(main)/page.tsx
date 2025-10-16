/* eslint-disable @typescript-eslint/no-explicit-any */
// middleware ไม่กันหน้านี้ อาจจะทำเป็น plublic
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import {
  CalendarDays,
  Search,
  TrendingUp,
  ShoppingCart,
  Store,
  Users,
  DownloadCloud,
  Activity
} from "lucide-react"

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts"

// ============ Helpers ============
const toNum = (x: unknown) => {
  const n = Number(x ?? 0)
  return Number.isFinite(n) ? n : 0
}
const fmtTHB = (minor: unknown) =>
  (toNum(minor) / 100).toLocaleString("th-TH", {
    style: "currency",
    currency: "THB"
  })
const fmtCompact = (n: unknown) =>
  new Intl.NumberFormat("en", { notation: "compact" }).format(toNum(n))
const fmtDateShort = (iso: unknown) => {
  const d = new Date(String(iso))
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("th-TH", { month: "short", day: "numeric" })
}

// const fmtTHB = (minor: number) =>
//   (minor / 100).toLocaleString("th-TH", { style: "currency", currency: "THB" })

const startOfMonth = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
const endOfMonth = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)

function dateRangeArray(from: Date, to: Date) {
  const out: Date[] = []
  const cur = new Date(from)
  cur.setHours(0, 0, 0, 0)
  const end = new Date(to)
  end.setHours(0, 0, 0, 0)
  while (cur.getTime() <= end.getTime()) {
    out.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

// deterministic random-ish for stable mock
function hashStr(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h >>> 0)
}
function prand(seed: number) {
  let x = seed || 123456789
  return () => {
    // xorshift32
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    return (x >>> 0) / 0xffffffff
  }
}

type Channel = "ONLINE" | "OFFLINE"
type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"

type DayPoint = {
  date: string // yyyy-mm-dd
  gmvMinor: number
  orders: number
  byStatus: Record<OrderStatus, number> // count per status
  byChannel: Record<Channel, number> // orders per channel
}

// mock stores
const STORES = Array.from({ length: 90 }).map((_, i) => ({
  id: 3000 + i,
  name: `Store ${i + 1}`,
  email: `store${i + 1}@digishop.dev`
}))

function buildSeries(opts: {
  from: string
  to: string
  storeName?: string | null
  status: "ALL" | OrderStatus
  channel: "ALL" | Channel
}) {
  const from = new Date(opts.from)
  const to = new Date(opts.to)
  const dates = dateRangeArray(from, to)

  const seedStr = `${opts.from}_${opts.to}_${opts.storeName ?? "ALL"}_${opts.status}_${opts.channel}`
  const rnd = prand(hashStr(seedStr))

  const dayRows: DayPoint[] = dates.map((d) => {
    const dateStr = d.toISOString().slice(0, 10)
    const dow = d.getDay()
    const base = 50 + Math.round(rnd() * 40) + (dow === 6 || dow === 0 ? 30 : 0) // weekend boost

    const onlineRatio = 0.7 + (rnd() - 0.5) * 0.2 // 0.6..0.8
    const offline = Math.max(0, Math.round(base * (1 - onlineRatio)))
    const online = Math.max(0, base - offline)

    const paid = Math.round(base * (0.55 + (rnd() - 0.5) * 0.08))
    const processing = Math.round(base * (0.18 + (rnd() - 0.5) * 0.05))
    const shipped = Math.round(base * (0.12 + (rnd() - 0.5) * 0.04))
    const delivered = Math.max(0, base - paid - processing - shipped - 2)
    const pending = 1 + Math.round(rnd() * 2)
    const cancelled = Math.max(
      0,
      base - (pending + paid + processing + shipped + delivered)
    )

    const aov = 60000 + Math.round(rnd() * 38000) // minor
    const gmvMinor = base * aov

    const row: DayPoint = {
      date: dateStr,
      gmvMinor,
      orders: base,
      byStatus: {
        PENDING: pending,
        PAID: paid,
        PROCESSING: processing,
        SHIPPED: shipped,
        DELIVERED: delivered,
        CANCELLED: cancelled
      },
      byChannel: { ONLINE: online, OFFLINE: offline }
    }

    let keepOrders = row.orders
    if (opts.channel !== "ALL") keepOrders = row.byChannel[opts.channel]
    if (opts.status !== "ALL") keepOrders = row.byStatus[opts.status]
    const ratio = keepOrders / Math.max(1, row.orders)

    return {
      ...row,
      orders: keepOrders,
      gmvMinor: Math.round(row.gmvMinor * ratio)
    }
  })

  return dayRows
}

function groupByWeek(dayRows: DayPoint[]) {
  const out: Array<DayPoint & { label: string }> = []
  for (let i = 0; i < dayRows.length; i += 7) {
    const chunk = dayRows.slice(i, i + 7)
    const label = `${chunk[0]?.date ?? ""} ~ ${chunk.at(-1)?.date ?? ""}`
    const merged = chunk.reduce<DayPoint>(
      (acc, cur) => {
        acc.gmvMinor += cur.gmvMinor
        acc.orders += cur.orders
        ;(
          Object.keys(acc.byStatus) as Array<keyof typeof acc.byStatus>
        ).forEach((k) => {
          acc.byStatus[k] += cur.byStatus[k]
        })
        ;(
          Object.keys(acc.byChannel) as Array<keyof typeof acc.byChannel>
        ).forEach((k) => {
          acc.byChannel[k] += cur.byChannel[k]
        })
        return acc
      },
      {
        date: chunk[0]?.date ?? "",
        gmvMinor: 0,
        orders: 0,
        byStatus: {
          PENDING: 0,
          PAID: 0,
          PROCESSING: 0,
          SHIPPED: 0,
          DELIVERED: 0,
          CANCELLED: 0
        },
        byChannel: { ONLINE: 0, OFFLINE: 0 }
      }
    )
    out.push({ ...merged, label })
  }
  return out
}

// ===== Animated number (smooth) =====
function useAnimatedNumber(value: number, duration = 480) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const rafRef = useRef<number | null>(null)
  useEffect(() => {
    const from = fromRef.current
    const to = value
    const start = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic
      const v = Math.round(from + (to - from) * eased)
      setDisplay(v)
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
      else fromRef.current = to
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration])
  return display
}

// ===== Tiny sparkline (smooth) =====
function TinySparkline({
  data,
  dataKey = "y"
}: {
  data: { x: string; y: number }[]
  dataKey?: string
}) {
  return (
    <ResponsiveContainer width="100%" height={44}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke="var(--primary)"
          fill="url(#spark)"
          strokeWidth={2}
          isAnimationActive
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function Metric({
  title,
  valueMinor,
  icon: Icon,
  hint,
  series
}: {
  title: string
  valueMinor: number
  icon: any
  hint?: string
  series: { x: string; y: number }[]
}) {
  const anim = useAnimatedNumber(valueMinor)
  return (
    <motion.div layout>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{fmtTHB(anim)}</div>
          {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
          <div className="mt-3 -mb-2">
            <TinySparkline data={series} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function MetricCount({
  title,
  value,
  icon: Icon,
  hint,
  series
}: {
  title: string
  value: number
  icon: any
  hint?: string
  series: { x: string; y: number }[]
}) {
  const anim = useAnimatedNumber(value)
  return (
    <motion.div layout>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{anim.toLocaleString()}</div>
          {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
          <div className="mt-3 -mb-2">
            <TinySparkline data={series} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ============ Page ============
export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<
    "THIS_MONTH" | "LAST_7" | "LAST_30" | "CUSTOM"
  >("THIS_MONTH")
  const [from, setFrom] = useState(startOfMonth().toISOString().slice(0, 10))
  const [to, setTo] = useState(endOfMonth().toISOString().slice(0, 10))
  const [groupBy, setGroupBy] = useState<"DAY" | "WEEK">("DAY")
  const [status, setStatus] = useState<"ALL" | OrderStatus>("ALL")
  const [channel, setChannel] = useState<"ALL" | Channel>("ALL")

  const [pendingApply, setPendingApply] = useState(false)

  // Store search + suggest
  const [storeQ, setStoreQ] = useState("")
  const [storeOpen, setStoreOpen] = useState(false)
  const [storeSuggest, setStoreSuggest] = useState<typeof STORES>([])
  const suggestTimer = useRef<number | null>(null)
  const [storePicked, setStorePicked] = useState<{
    id: number
    name: string
  } | null>(null)

  useEffect(() => {
    if (!storeQ.trim()) {
      setStoreSuggest([])
      setStoreOpen(false)
      return
    }
    if (suggestTimer.current) window.clearTimeout(suggestTimer.current)
    suggestTimer.current = window.setTimeout(() => {
      const t = storeQ.toLowerCase()
      const s = STORES.filter(
        (x) =>
          x.name.toLowerCase().includes(t) || x.email.toLowerCase().includes(t)
      ).slice(0, 8)
      setStoreSuggest(s)
      setStoreOpen(true)
    }, 220)
    return () => {
      if (suggestTimer.current) window.clearTimeout(suggestTimer.current)
    }
  }, [storeQ])

  useEffect(() => {
    if (period === "THIS_MONTH") {
      setFrom(startOfMonth().toISOString().slice(0, 10))
      setTo(endOfMonth().toISOString().slice(0, 10))
    } else if (period === "LAST_7") {
      const t = new Date()
      const f = new Date(Date.now() - 6 * 86400000)
      setFrom(f.toISOString().slice(0, 10))
      setTo(t.toISOString().slice(0, 10))
    } else if (period === "LAST_30") {
      const t = new Date()
      const f = new Date(Date.now() - 29 * 86400000)
      setFrom(f.toISOString().slice(0, 10))
      setTo(t.toISOString().slice(0, 10))
    }
  }, [period])

  // Fake "apply filters" loading for smooth UX
  const [applied, setApplied] = useState({
    from,
    to,
    status,
    channel,
    store: storePicked?.name ?? null
  })
  const handleApply = () => {
    setPendingApply(true)
    setTimeout(() => {
      setApplied({
        from,
        to,
        status,
        channel,
        store: storePicked?.name ?? null
      })
      setPendingApply(false)
    }, 480) // mimic network delay for animation
  }

  // Build series
  const daySeries = useMemo(() => {
    return buildSeries({
      from: applied.from,
      to: applied.to,
      storeName: applied.store,
      status: applied.status as any,
      channel: applied.channel as any
    })
  }, [applied])

  const weekSeries = useMemo(() => groupByWeek(daySeries), [daySeries])
  const lineData = groupBy === "DAY" ? daySeries : weekSeries
  const xKey = groupBy === "DAY" ? "date" : "label"

  // KPI summary
  const totals = useMemo(() => {
    const list = daySeries
    const gmv = list.reduce((s, d) => s + d.gmvMinor, 0)
    const orders = list.reduce((s, d) => s + d.orders, 0)
    const activeStores = Math.max(
      1,
      Math.min(90, Math.round(list.length / 2) + (applied.store ? 1 : 40))
    )
    const newUsers = 380 + Math.round(list.length * 6)
    return { gmv, orders, activeStores, newUsers }
  }, [daySeries, applied.store])

  const toSpark = (key: "gmvMinor" | "orders") =>
    (daySeries ?? []).map((d) => ({ x: d.date, y: d[key] }))

  // status distribution
  const statusDist = useMemo(() => {
    const agg = {
      PENDING: 0,
      PAID: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0
    } as Record<OrderStatus, number>
    daySeries.forEach((d) => {
      ;(Object.keys(agg) as OrderStatus[]).forEach((k) => {
        agg[k] += d.byStatus[k]
      })
    })
    return Object.entries(agg).map(([name, value]) => ({ name, value }))
  }, [daySeries])

  // top stores
  const topStores = useMemo(() => {
    const baseSeed = hashStr(
      `${applied.from}_${applied.to}_${applied.status}_${applied.channel}`
    )
    const r = prand(baseSeed)
    const candidates = [...STORES]
    if (applied.store) {
      const top = { id: -1, name: applied.store }
      candidates.sort(() => r() - 0.5)
      const rest = candidates.filter((s) => s.name !== top.name).slice(0, 9)
      const all = [top, ...rest]
      return all.map((s, i) => ({
        name: s.name,
        gmvMinor: Math.round((1 - i * 0.08) * (980_000 + r() * 800_000))
      }))
    }
    candidates.sort(() => r() - 0.5)
    return candidates.slice(0, 10).map((s, i) => ({
      name: s.name,
      gmvMinor: Math.round((1 - i * 0.07) * (1_000_000 + r() * 900_000))
    }))
  }, [applied])

  const pieColors = [
    "#4f46e5",
    "#06b6d4",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6"
  ]
  // สร้างชุดข้อมูลสำหรับกราฟ (กัน NaN + คำนวณ MA)
  const chartData = useMemo(() => {
    const w = 5 // window size สำหรับ MA
    const base = (lineData ?? []).map((d: any) => ({
      ...d,
      gmvMinor: toNum(d?.gmvMinor),
      orders: toNum(d?.orders)
    }))
    return base.map((row, idx, arr) => {
      const half = Math.floor(w / 2)
      const s = Math.max(0, idx - half)
      const e = Math.min(arr.length, s + w)
      const slice = arr.slice(s, e)
      const avg =
        slice.reduce((sum, it) => sum + toNum(it.gmvMinor), 0) /
        Math.max(slice.length, 1)
      return { ...row, gmvMA: Math.round(avg) }
    })
  }, [lineData])

  return (
    <div className="p-4 space-y-4">
      {/* ===== Top bar ===== */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Overview with smooth charts and interactive filters
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <DownloadCloud className="h-4 w-4" />
            Export
          </Button>
          <Button
            className="gap-2"
            onClick={handleApply}
            disabled={pendingApply}
          >
            <Activity className="h-4 w-4" />
            Apply Filters
          </Button>
        </div>
      </div>

      {/* ===== Filters ===== */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>
            Refine charts with multiple dimensions
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-6 gap-3">
          {/* Store search + suggestion */}
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Store (optional)</label>
            <Popover open={storeOpen} onOpenChange={setStoreOpen}>
              <PopoverAnchor asChild>
                <div className="flex gap-2">
                  <Input
                    placeholder={
                      storePicked?.name ?? "Type to search stores..."
                    }
                    value={storeQ}
                    onChange={(e) => setStoreQ(e.target.value)}
                    onFocus={() => {
                      if (storeQ.trim()) setStoreOpen(true)
                    }}
                    onBlur={() => {
                      setTimeout(() => setStoreOpen(false), 120)
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStorePicked(null)
                      setStoreQ("")
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </PopoverAnchor>
              <PopoverContent
                className="w-[520px] p-0"
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <div className="max-h-80 overflow-auto">
                  {storeSuggest.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No suggestions
                    </div>
                  ) : (
                    storeSuggest.map((s) => (
                      <button
                        key={s.id}
                        className="w-full text-left px-3 py-2 hover:bg-accent"
                        onClick={() => {
                          setStorePicked({ id: s.id, name: s.name })
                          setStoreQ(s.name)
                          setStoreOpen(false)
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
            {storePicked && (
              <div className="mt-2 text-xs">
                Selected: <Badge variant="outline">{storePicked.name}</Badge>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm mb-1">Period</label>
            <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="THIS_MONTH">This month</SelectItem>
                <SelectItem value="LAST_7">Last 7 days</SelectItem>
                <SelectItem value="LAST_30">Last 30 days</SelectItem>
                <SelectItem value="CUSTOM">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

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

          <div>
            <label className="block text-sm mb-1">Group by</label>
            <Select value={groupBy} onValueChange={(v: any) => setGroupBy(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAY">Day</SelectItem>
                <SelectItem value="WEEK">Week</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm mb-1">Channel</label>
            <Select value={channel} onValueChange={(v: any) => setChannel(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="ONLINE">ONLINE</SelectItem>
                <SelectItem value="OFFLINE">OFFLINE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm mb-1">Order Status</label>
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="PENDING">PENDING</SelectItem>
                <SelectItem value="PAID">PAID</SelectItem>
                <SelectItem value="PROCESSING">PROCESSING</SelectItem>
                <SelectItem value="SHIPPED">SHIPPED</SelectItem>
                <SelectItem value="DELIVERED">DELIVERED</SelectItem>
                <SelectItem value="CANCELLED">CANCELLED</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ===== Loading indicator (smooth) ===== */}
      <AnimatePresence>
        {pendingApply && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground"
          >
            Applying filters…
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== KPIs ===== */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Metric
          title="GMV"
          valueMinor={totals.gmv}
          icon={TrendingUp}
          hint="Mock data"
          series={toSpark("gmvMinor")}
        />
        <MetricCount
          title="Orders"
          value={totals.orders}
          icon={ShoppingCart}
          hint="Mock data"
          series={toSpark("orders")}
        />
        <MetricCount
          title="Active Stores"
          value={totals.activeStores}
          icon={Store}
          hint="Mock data"
          series={toSpark("orders").map((x) => ({
            ...x,
            y: Math.round(x.y * 0.3)
          }))}
        />
        <MetricCount
          title="New Users"
          value={totals.newUsers}
          icon={Users}
          hint="Mock data"
          series={toSpark("orders").map((x) => ({
            ...x,
            y: Math.round(x.y * 0.5)
          }))}
        />
      </motion.div>

      {/* ===== Charts Row 1 ===== */}
      <motion.div layout className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        {/* GMV over time (Area + avg line) */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>GMV over time</CardTitle>
            <CardDescription>ยอดขายรวมเทียบตามช่วงเวลา</CardDescription>
          </CardHeader>
          <CardContent className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gmvGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey={xKey} // เช่น "date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={fmtDateShort} // กัน NaN และทำให้อ่านง่าย
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={fmtCompact} // 1K, 1M ฯลฯ
                />

                <Tooltip
                  formatter={(value: unknown, name: unknown) => {
                    const key = String(name ?? "")
                    if (key === "gmvMinor" || key === "gmvMA")
                      return [
                        fmtTHB(value),
                        key === "gmvMA" ? "GMV (MA)" : "GMV"
                      ]
                    return [String(toNum(value)), key]
                  }}
                  labelFormatter={(label: unknown) => fmtDateShort(label)}
                />

                <Area
                  type="monotone"
                  dataKey="gmvMinor"
                  name="GMV (THB)"
                  stroke="#4f46e5"
                  fill="url(#gmvGradient)"
                  strokeWidth={2}
                  isAnimationActive
                />

                {/* เส้นค่าเฉลี่ยเคลื่อนที่ (MA) — ใช้ key เป็น string ไม่ใช่ฟังก์ชัน */}
                <Line
                  type="monotone"
                  dataKey="gmvMA"
                  name="Avg (MA5)"
                  stroke="#06b6d4"
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive
                  strokeDasharray="4 4"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders over time (Stacked by channel) */}
        <Card>
          <CardHeader>
            <CardTitle>Orders over time</CardTitle>
            <CardDescription>
              จำนวนคำสั่งซื้อราย{groupBy === "DAY" ? "วัน" : "สัปดาห์"}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar
                  dataKey="byChannel.ONLINE"
                  stackId="o"
                  name="ONLINE"
                  fill="#22c55e"
                  isAnimationActive
                />
                <Bar
                  dataKey="byChannel.OFFLINE"
                  stackId="o"
                  name="OFFLINE"
                  fill="#f59e0b"
                  isAnimationActive
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== Charts Row 2 ===== */}
      <motion.div layout className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        {/* Status distribution (Pie) */}
        <Card>
          <CardHeader>
            <CardTitle>Order status distribution</CardTitle>
            <CardDescription>สัดส่วนสถานะออเดอร์ในช่วงที่เลือก</CardDescription>
          </CardHeader>
          <CardContent className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  dataKey="value"
                  data={statusDist}
                  nameKey="name"
                  outerRadius={120}
                  label
                  isAnimationActive
                >
                  {statusDist.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 flex flex-wrap gap-2">
              {statusDist.map((s, i) => (
                <Badge key={s.name} variant="outline" className="gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ background: pieColors[i % pieColors.length] }}
                  />
                  {s.name}: {s.value.toLocaleString()}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top stores by GMV (horizontal bar) */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Top stores by GMV</CardTitle>
            <CardDescription>10 อันดับแรกในช่วงวันที่เลือก</CardDescription>
          </CardHeader>
          <CardContent className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[...topStores].reverse()}
                layout="vertical"
                margin={{ left: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tickFormatter={(v) => (v / 100).toLocaleString()}
                />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip formatter={(v: number) => fmtTHB(v)} />
                <Bar
                  dataKey="gmvMinor"
                  name="GMV (THB)"
                  fill="#4f46e5"
                  isAnimationActive
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
