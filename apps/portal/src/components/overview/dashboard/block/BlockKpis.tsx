'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, ShoppingCart, Store, Users } from 'lucide-react'
import type {
  DashboardKpis,
  DashboardSeriesPoint
} from '@/types/admin/dashboard'
import {
  fetchDashboardKpis,
  fetchDashboardSeries
} from '@/utils/requesters/dashboardRequester'
import MetricMoney from '../MetricMoney'
import { toNum } from '../format'
import MetricCount from '../MetricCount'

function useDateSparks(series: DashboardSeriesPoint[]) {
  const toSpark = (key: 'gmvMinor' | 'orders') =>
    (series ?? []).map((d) => ({ x: d.date, y: d[key] }))
  return { toSpark }
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
  const [kpis, setKpis] = useState<DashboardKpis | null>(null)
  const [series, setSeries] = useState<DashboardSeriesPoint[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const [k, s] = await Promise.all([
          fetchDashboardKpis({ from, to }),
          fetchDashboardSeries({ from, to })
        ])
        if (!mounted) return
        setKpis(k)
        setSeries(s)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [from, to, refreshKey])

  const { toSpark } = useDateSparks(series)

  return (
    <motion.div layout className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <MetricMoney
        title="GMV"
        valueMinor={toNum(kpis?.gmvMinor ?? 0)}
        icon={TrendingUp}
        hint={loading ? 'Loading…' : 'Live'}
        series={toSpark('gmvMinor')}
      />
      <MetricCount
        title="Orders"
        value={toNum(kpis?.orders ?? 0)}
        icon={ShoppingCart}
        hint={loading ? 'Loading…' : 'Live'}
        series={toSpark('orders')}
      />
      <MetricCount
        title="Active Stores"
        value={toNum(kpis?.activeStores ?? 0)}
        icon={Store}
        hint={loading ? 'Loading…' : 'Live'}
        series={toSpark('orders').map((x) => ({
          ...x,
          y: Math.round(x.y * 0.35)
        }))}
      />
      <MetricCount
        title="New Users"
        value={toNum(kpis?.newUsers ?? 0)}
        icon={Users}
        hint={loading ? 'Loading…' : 'Live'}
        series={toSpark('orders').map((x) => ({
          ...x,
          y: Math.round(x.y * 0.55)
        }))}
      />
    </motion.div>
  )
}
