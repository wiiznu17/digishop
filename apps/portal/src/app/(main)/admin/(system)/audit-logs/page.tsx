// apps/portal/src/app/(main)/admin/system/audit-logs/page.tsx
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { CalendarDays, Search, Eye } from "lucide-react"
import Link from "next/link"

type LogRow = {
  id: number
  actor: string // email
  actorName: string
  action: "LOGIN" | "LOGOUT" | "CREATE" | "UPDATE" | "DELETE" | "ASSIGN_ROLE"
  resource: string // PATH or entity
  ip: string
  createdAt: string
  meta?: Record<string, any>
}

const MOCK_LOGS: LogRow[] = Array.from({ length: 120 }).map((_, i) => ({
  id: 10000 + i,
  actor: `admin${(i % 22) + 1}@digishop.local`,
  actorName: `Admin ${(i % 22) + 1}`,
  action: (
    ["LOGIN", "CREATE", "UPDATE", "ASSIGN_ROLE", "DELETE", "LOGOUT"] as const
  )[i % 6],
  resource: [
    "/admin/system/admins",
    "/admin/products",
    "/admin/orders",
    "/admin/payouts"
  ][i % 4],
  ip: `10.0.0.${i % 255}`,
  createdAt: new Date(Date.now() - i * 3600_000).toISOString(),
  meta: { id: i, note: "mock" }
}))

function useDebounce<T>(v: T, ms = 300) {
  const [s, setS] = useState(v)
  useEffect(() => {
    const t = setTimeout(() => setS(v), ms)
    return () => clearTimeout(t)
  }, [v, ms])
  return s
}

export default function AuditLogsPage() {
  // search + suggest (actor/email/path)
  const [q, setQ] = useState("")
  const dq = useDebounce(q, 250)
  const [openSuggest, setOpenSuggest] = useState(false)
  const [loadingSuggest, setLoadingSuggest] = useState(false)
  const [suggest, setSuggest] = useState<
    Array<{ label: string; value: string }>
  >([])
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (!dq.trim()) {
      setOpenSuggest(false)
      setSuggest([])
      return
    }
    setLoadingSuggest(true)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      const t = dq.toLowerCase()
      const actors = Array.from(
        new Set(MOCK_LOGS.map((l) => `${l.actorName} <${l.actor}>`))
      )
        .filter((s) => s.toLowerCase().includes(t))
        .slice(0, 5)
        .map((s) => ({ label: s, value: s }))
      const paths = Array.from(new Set(MOCK_LOGS.map((l) => l.resource)))
        .filter((p) => p.toLowerCase().includes(t))
        .slice(0, 5)
        .map((p) => ({ label: p, value: p }))
      setSuggest([...actors, ...paths])
      setLoadingSuggest(false)
      setOpenSuggest(true)
    }, 200)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [dq])

  // filters
  const [action, setAction] = useState<"ALL" | LogRow["action"]>("ALL")
  const [from, setFrom] = useState(() =>
    new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  )
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10))

  // list
  const rows = useMemo(() => {
    let f = MOCK_LOGS
    if (q.trim()) {
      const t = q.toLowerCase()
      f = f.filter(
        (l) =>
          l.actor.toLowerCase().includes(t) ||
          l.actorName.toLowerCase().includes(t) ||
          l.resource.toLowerCase().includes(t)
      )
    }
    if (action !== "ALL") f = f.filter((l) => l.action === action)
    // date filter
    const fd = new Date(from)
    const td = new Date(to)
    td.setHours(23, 59, 59, 999)
    f = f.filter((l) => {
      const d = new Date(l.createdAt).getTime()
      return d >= fd.getTime() && d <= td.getTime()
    })
    return f
  }, [q, action, from, to])

  // paging
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const total = rows.length
  const pageRows = useMemo(() => {
    const s = (page - 1) * pageSize
    return rows.slice(s, s + pageSize)
  }, [rows, page, pageSize])

  // quick view
  const [openQV, setOpenQV] = useState(false)
  const [current, setCurrent] = useState<LogRow | null>(null)

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>ติดตามกิจกรรมสำคัญในระบบ</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Search</label>
            <Popover open={openSuggest} onOpenChange={setOpenSuggest}>
              <PopoverAnchor asChild>
                <div className="flex gap-2">
                  <Input
                    placeholder="actor / email / path"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onFocus={() => {
                      if (q.trim()) setOpenSuggest(true)
                    }}
                    onBlur={() => {
                      setTimeout(() => setOpenSuggest(false), 120)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setOpenSuggest(false)
                    }}
                  />
                  <Button onClick={() => setOpenSuggest(false)}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </PopoverAnchor>
              <PopoverContent
                className="w-[520px] p-0"
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <div className="max-h-80 overflow-auto">
                  {loadingSuggest ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Searching...
                    </div>
                  ) : suggest.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No suggestions
                    </div>
                  ) : (
                    suggest.map((s, idx) => (
                      <button
                        key={`${s.value}-${idx}`}
                        className="w-full text-left px-3 py-2 hover:bg-accent"
                        onClick={() => {
                          setQ(s.value)
                          setOpenSuggest(false)
                        }}
                      >
                        <div className="text-sm">{s.label}</div>
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="block text-sm mb-1">Action</label>
            <Select
              value={action}
              onValueChange={(v: any) => {
                setAction(v)
                setPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="LOGIN">LOGIN</SelectItem>
                <SelectItem value="LOGOUT">LOGOUT</SelectItem>
                <SelectItem value="CREATE">CREATE</SelectItem>
                <SelectItem value="UPDATE">UPDATE</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="ASSIGN_ROLE">ASSIGN_ROLE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2 grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm mb-1">From</label>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={from}
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
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logs</CardTitle>
          <CardDescription>แสดงเฉพาะรายการในช่วงที่เลือก</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>#{l.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{l.actorName}</span>
                        <span className="text-xs text-muted-foreground">
                          {l.actor}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{l.action}</TableCell>
                    <TableCell>{l.resource}</TableCell>
                    <TableCell>{l.ip}</TableCell>
                    <TableCell>
                      {new Date(l.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-2"
                        onClick={() => {
                          setCurrent(l)
                          setOpenQV(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" asChild>
                        <Link href={`/admin/system/audit-logs/${l.id}`}>
                          Detail
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {pageRows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-sm text-muted-foreground"
                    >
                      No data
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* pager */}
          <div className="flex items-center justify-between gap-3 py-3">
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1}-
              {Math.min(page * pageSize, total)} of {total}
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  const s = Number(v)
                  setPageSize(s)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setPage(Math.min(Math.ceil(total / pageSize), page + 1))
                }
                disabled={page >= Math.ceil(total / pageSize)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick view */}
      <Dialog open={openQV} onOpenChange={setOpenQV}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log quick view</DialogTitle>
          </DialogHeader>
          {current && (
            <div className="text-sm space-y-2">
              <div>ID: #{current.id}</div>
              <div>
                Actor: {current.actorName} &lt;{current.actor}&gt;
              </div>
              <div>Action: {current.action}</div>
              <div>Resource: {current.resource}</div>
              <div>IP: {current.ip}</div>
              <div>Date: {new Date(current.createdAt).toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                Meta (mock): {JSON.stringify(current.meta)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
