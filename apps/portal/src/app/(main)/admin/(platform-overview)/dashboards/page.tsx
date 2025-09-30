"use client"

import { useEffect, useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { CalendarDays, DownloadCloud, Activity } from "lucide-react"
import BlockKpis from "@/components/overview/dashboard/block/BlockKpis"
import BlockGmvOverTime from "@/components/overview/dashboard/block/BlockGmvOverTime"
import BlockOrdersOverTime from "@/components/overview/dashboard/block/BlockOrdersOverTime"
import BlockStatusPie from "@/components/overview/dashboard/block/BlockStatusPie"
import BlockTopStores from "@/components/overview/dashboard/block/BlockTopStores"
import AuthGuard from "@/components/AuthGuard"

const startOfMonth = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
const endOfMonth = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)

function AdminDashboardPage() {
  const [period, setPeriod] = useState<
    "THIS_MONTH" | "LAST_7" | "LAST_30" | "CUSTOM"
  >("THIS_MONTH")
  const [from, setFrom] = useState(startOfMonth().toISOString().slice(0, 10))
  const [to, setTo] = useState(endOfMonth().toISOString().slice(0, 10))
  const [pendingApply, setPendingApply] = useState(false)
  const [applied, setApplied] = useState<{ from: string; to: string }>({
    from,
    to
  })
  const [refreshKey, setRefreshKey] = useState(0)

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

  const handleApply = () => {
    setPendingApply(true)
    setApplied({ from, to })
    setRefreshKey((k) => k + 1)
    setTimeout(() => setPendingApply(false), 400)
  }

  return (
    <div className="p-4 space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Overview — press Apply to refresh all blocks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <DownloadCloud className="h-4 w-4" />
            Export
          </Button>
          <Button
            onClick={handleApply}
            disabled={pendingApply}
            className="gap-2"
          >
            <Activity className="h-4 w-4" />
            Apply
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>
            Select the date range and press Apply to refresh all
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm mb-1">Period</label>
            <Select
              value={period}
              onValueChange={(
                v: "THIS_MONTH" | "LAST_7" | "LAST_30" | "CUSTOM"
              ) => setPeriod(v)}
            >
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
        </CardContent>
      </Card>

      {/* applying indicator */}
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

      {/* KPI cards */}
      <BlockKpis from={applied.from} to={applied.to} refreshKey={refreshKey} />

      {/* Charts row 1 */}
      <motion.div layout className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <BlockGmvOverTime
          from={applied.from}
          to={applied.to}
          refreshKey={refreshKey}
        />
        <BlockOrdersOverTime
          from={applied.from}
          to={applied.to}
          refreshKey={refreshKey}
        />
      </motion.div>

      {/* Charts row 2 */}
      <motion.div layout className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <BlockStatusPie
          from={applied.from}
          to={applied.to}
          refreshKey={refreshKey}
        />
        <BlockTopStores
          from={applied.from}
          to={applied.to}
          refreshKey={refreshKey}
        />
      </motion.div>
    </div>
  )
}

function Guard({ children }: { children: React.ReactNode }) {
  "use client"
  return <AuthGuard requiredPerms={["DASHBOARD_VIEW"]}>{children}</AuthGuard>
}

export default function Page() {
  return (
    <Guard>
      <AdminDashboardPage />
    </Guard>
  )
}
