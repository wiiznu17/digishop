'use client'

import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { fetchAnaStatusDist } from '@/utils/requesters/analyticsRequester'
import type { StatusDistItem } from '@/types/admin/analytics'

export default function BlockStatusPie({
  from,
  to,
  refreshKey
}: {
  from: string
  to: string
  refreshKey: number
}) {
  const [dist, setDist] = useState<StatusDistItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const r = await fetchAnaStatusDist({ from, to })
        if (!mounted) return
        setDist(r)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [from, to, refreshKey])

  const pieColors = [
    '#4f46e5',
    '#06b6d4',
    '#22c55e',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6'
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order status distribution</CardTitle>
        <CardDescription>
          {loading ? 'Loading…' : 'สัดส่วนสถานะออเดอร์'}
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
                <Cell key={String(i)} fill={pieColors[i % pieColors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-3 flex flex-wrap gap-2">
          {dist.map((s, i) => (
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
  )
}
