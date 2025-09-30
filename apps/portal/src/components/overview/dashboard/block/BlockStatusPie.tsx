"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts"
import type { DashboardStatusDist } from "@/types/admin/dashboard"
import { fetchDashboardStatusDist } from "@/utils/requesters/dashboardRequester"

const PIE = ["#4f46e5", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"]

export default function BlockStatusPie({
  from,
  to,
  refreshKey
}: {
  from: string
  to: string
  refreshKey: number
}) {
  const [dist, setDist] = useState<DashboardStatusDist[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const d = await fetchDashboardStatusDist({ from, to })
        if (!mounted) return
        setDist(d)
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
        <CardTitle>Order status distribution</CardTitle>
        <CardDescription>
          {loading ? "Loading…" : "สัดส่วนสถานะออเดอร์"}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              dataKey="value"
              data={dist}
              nameKey="name"
              outerRadius={120}
              label
              isAnimationActive
            >
              {dist.map((_, i) => (
                <Cell key={String(i)} fill={PIE[i % PIE.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {dist.map((s, i) => (
            <div key={s.name} className="text-sm">
              <span
                className="inline-block h-3 w-3 rounded-full mr-2"
                style={{ background: PIE[i % PIE.length] }}
              />
              {s.name}: {s.value.toLocaleString()}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
