"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line
} from "recharts"
import { fmtCompact, fmtDateShort, fmtTHB, toNum } from "../format"
import type { DashboardSeriesPoint } from "@/types/admin/dashboard"
import { fetchDashboardSeries } from "@/utils/requesters/dashboardRequester"

export default function BlockGmvOverTime({
  from,
  to,
  refreshKey
}: {
  from: string
  to: string
  refreshKey: number
}) {
  const [series, setSeries] = useState<DashboardSeriesPoint[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const s = await fetchDashboardSeries({ from, to })
        if (!mounted) return
        setSeries(s)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [from, to, refreshKey])

  const chartData = useMemo(() => {
    const w = 5
    const base = (series ?? []).map((d) => ({
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
  }, [series])

  return (
    <Card className="xl:col-span-2">
      <CardHeader>
        <CardTitle>GMV over time</CardTitle>
        <CardDescription>
          {loading ? "Loading…" : "ยอดขายรวมตามวัน"}
        </CardDescription>
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
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={fmtDateShort}
            />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={fmtCompact} />
            <Tooltip
              formatter={(v: unknown, name: unknown) => {
                const key = String(name ?? "")
                if (key === "gmvMinor" || key === "gmvMA")
                  return [fmtTHB(v), key === "gmvMA" ? "GMV (MA)" : "GMV"]
                return [String(toNum(v)), key]
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
  )
}
