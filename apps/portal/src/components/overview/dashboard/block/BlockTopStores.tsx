"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts"
import { fmtTHB } from "../format"
import type { DashboardTopStore } from "@/types/admin/dashboard"
import { fetchDashboardTopStores } from "@/utils/requesters/dashboardRequester"

export default function BlockTopStores({
  from,
  to,
  refreshKey
}: {
  from: string
  to: string
  refreshKey: number
}) {
  const [rows, setRows] = useState<DashboardTopStore[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const d = await fetchDashboardTopStores({ from, to })
        if (!mounted) return
        setRows(d)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [from, to, refreshKey])

  return (
    <Card className="xl:col-span-2">
      <CardHeader>
        <CardTitle>Top stores by GMV</CardTitle>
        <CardDescription>
          {loading ? "Loading…" : "10 อันดับแรก"}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={[...rows].reverse()}
            layout="vertical"
            margin={{ left: 100 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              tickFormatter={(v) => (Number(v) / 100).toLocaleString()}
            />
            <YAxis dataKey="name" type="category" width={120} />
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
  )
}
