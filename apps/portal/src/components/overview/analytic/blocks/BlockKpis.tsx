/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, ShoppingCart, Store, Users } from "lucide-react"
import { ResponsiveContainer, AreaChart, Area } from "recharts"
import {
  fetchAnaKpis,
  fetchAnaTrends
} from "@/utils/requesters/analyticsRequester"
import type { AnalyticsKpis, TrendsPoint } from "@/types/admin/analytics"

const toNum = (x: unknown) => (Number.isFinite(Number(x ?? 0)) ? Number(x) : 0)
const fmtTHB = (minor: number) =>
  (minor / 100).toLocaleString("th-TH", { style: "currency", currency: "THB" })

function useAnimatedNumber(value: number, duration = 400) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const rafRef = useRef<number | null>(null)
  useEffect(() => {
    const from = fromRef.current,
      to = value,
      start = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
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

function TinySparkline({ data }: { data: { x: string; y: number }[] }) {
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
          dataKey="y"
          stroke="var(--primary)"
          fill="url(#spark)"
          strokeWidth={2}
          isAnimationActive
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function MetricMoney({
  title,
  valueMinor,
  icon: Icon,
  series
}: {
  title: string
  valueMinor: number
  icon: any
  series: { x: string; y: number }[]
}) {
  const anim = useAnimatedNumber(valueMinor)
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{fmtTHB(anim)}</div>
        <div className="mt-3 -mb-2">
          <TinySparkline data={series} />
        </div>
      </CardContent>
    </Card>
  )
}

function MetricCount({
  title,
  value,
  icon: Icon,
  series
}: {
  title: string
  value: number
  icon: any
  series: { x: string; y: number }[]
}) {
  const anim = useAnimatedNumber(value)
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{anim.toLocaleString()}</div>
        <div className="mt-3 -mb-2">
          <TinySparkline data={series} />
        </div>
      </CardContent>
    </Card>
  )
}

export default function BlockKpis({
  from,
  to,
  refreshKey
}: {
  from: string
  to: string
  refreshKey: number
}) {
  const [kpis, setKpis] = useState<AnalyticsKpis | null>(null)
  const [trends, setTrends] = useState<TrendsPoint[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const [k, t] = await Promise.all([
          fetchAnaKpis({ from, to }),
          fetchAnaTrends({ from, to })
        ])
        if (!mounted) return
        setKpis(k)
        setTrends(t)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [from, to, refreshKey])

  const toSpark = (key: "gmvMinor" | "orders" | "aovMinor") =>
    (trends ?? []).map((d) => ({ x: d.date, y: toNum(d[key]) }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <MetricMoney
        title="GMV"
        icon={TrendingUp}
        valueMinor={kpis?.gmvMinor ?? 0}
        series={toSpark("gmvMinor")}
      />
      <MetricCount
        title="Orders"
        icon={ShoppingCart}
        value={kpis?.orders ?? 0}
        series={toSpark("orders")}
      />
      <MetricMoney
        title="AOV"
        icon={Store}
        valueMinor={kpis?.aovMinor ?? 0}
        series={toSpark("aovMinor")}
      />
      <MetricCount
        title="Paid %"
        icon={Users}
        value={Math.round((kpis?.paidRate ?? 0) * 100)}
        series={toSpark("orders")}
      />
      {/* แสดงอัตราอื่นๆแบบย่อใต้การ์ดสุดท้าย */}
      <div className="md:col-span-4 grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="py-3 text-sm">
            Cancel Rate: <b>{Math.round((kpis?.cancelRate ?? 0) * 100)}%</b>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-sm">
            Refund Rate: <b>{Math.round((kpis?.refundRate ?? 0) * 100)}%</b>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 text-sm">
            Repeat Rate: <b>{Math.round((kpis?.repeatRate ?? 0) * 100)}%</b>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
