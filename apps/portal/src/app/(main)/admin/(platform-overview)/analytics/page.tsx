"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { CalendarDays, Activity } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import BlockKpis from "@/components/overview/analytic/blocks/BlockKpis"
import BlockTrends from "@/components/overview/analytic/blocks/BlockTrends"
import BlockStatusPie from "@/components/overview/analytic/blocks/BlockStatusPie"
import BlockStoreLeaderboard from "@/components/overview/analytic/blocks/BlockStoreLeaderboard"

const startOfMonth = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
const endOfMonth = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<"THIS_MONTH" | "LAST_30" | "CUSTOM">(
    "THIS_MONTH"
  )
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
    setTimeout(() => setPendingApply(false), 350)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            กด Apply เพื่อรีเฟรชทุกบล็อก
          </p>
        </div>
        <Button onClick={handleApply} disabled={pendingApply} className="gap-2">
          <Activity className="h-4 w-4" /> Apply
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>เลือกช่วงวันที่แล้วกด Apply</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm mb-1">Period</label>
            <Select
              value={period}
              onValueChange={(v: "THIS_MONTH" | "LAST_30" | "CUSTOM") =>
                setPeriod(v)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="THIS_MONTH">This month</SelectItem>
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

      <BlockKpis from={applied.from} to={applied.to} refreshKey={refreshKey} />

      <motion.div layout className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <BlockTrends
          from={applied.from}
          to={applied.to}
          refreshKey={refreshKey}
        />
        <BlockStatusPie
          from={applied.from}
          to={applied.to}
          refreshKey={refreshKey}
        />
      </motion.div>

      <BlockStoreLeaderboard
        from={applied.from}
        to={applied.to}
        refreshKey={refreshKey}
      />
    </div>
  )
}
