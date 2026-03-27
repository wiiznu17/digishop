'use client'

import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts'
import type { DashboardSeriesPoint } from '@/types/admin/dashboard'
import { fetchDashboardSeries } from '@/utils/requesters/dashboardRequester'
import { fmtDateShort } from '../format'

export default function BlockOrdersOverTime({
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders over time</CardTitle>
        <CardDescription>
          {loading ? 'Loading…' : 'จำนวนคำสั่งซื้อรายวัน'}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={series}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={fmtDateShort}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar
              dataKey="orders"
              name="Orders"
              fill="#4f46e5"
              isAnimationActive
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
