"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
import {
  fetchAuditLogs,
  fetchAuditLogSuggest
} from "@/utils/requesters/auditLogRequester"
import type { AdminAuditLogItem } from "@/types/admin/audit"
import { Pager } from "@/components/common/Pager"

function useDebounce<T>(v: T, ms = 300) {
  const [s, setS] = useState(v)
  useEffect(() => {
    const t = setTimeout(() => setS(v), ms)
    return () => clearTimeout(t)
  }, [v, ms])
  return s
}
// function Pager({ page, pageSize, total, onPage, onPageSize }: any) {
//   const totalPages = Math.max(1, Math.ceil(total / pageSize))
//   return (
//     <div className="flex items-center justify-between gap-3 py-3">
//       <div className="text-sm text-muted-foreground">
//         Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)}{" "}
//         of {total}
//       </div>
//       <div className="flex items-center gap-2">
//         <Select
//           value={String(pageSize)}
//           onValueChange={(v) => onPageSize(Number(v))}
//         >
//           <SelectTrigger className="w-[120px]">
//             <SelectValue />
//           </SelectTrigger>
//           <SelectContent>
//             {[10, 20, 50, 100].map((s) => (
//               <SelectItem key={s} value={String(s)}>
//                 {s} / page
//               </SelectItem>
//             ))}
//           </SelectContent>
//         </Select>
//         <Button
//           variant="outline"
//           onClick={() => onPage(Math.max(1, page - 1))}
//           disabled={page <= 1}
//         >
//           Prev
//         </Button>
//         <Button
//           variant="outline"
//           onClick={() => onPage(Math.min(totalPages, page + 1))}
//           disabled={page >= totalPages}
//         >
//           Next
//         </Button>
//       </div>
//     </div>
//   )
// }

export default function AuditLogsPage() {
  // filters (draft)
  const [qDraft, setQDraft] = useState("")
  const [actionDraft, setActionDraft] = useState<
    "ALL" | AdminAuditLogItem["action"]
  >("ALL")
  const [fromDraft, setFromDraft] = useState(() =>
    new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  )
  const [toDraft, setToDraft] = useState(() =>
    new Date().toISOString().slice(0, 10)
  )

  // submitted
  const [q, setQ] = useState("")
  const [action, setAction] = useState<"ALL" | AdminAuditLogItem["action"]>(
    "ALL"
  )
  const [from, setFrom] = useState(fromDraft)
  const [to, setTo] = useState(toDraft)

  // list state
  const [rows, setRows] = useState<AdminAuditLogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // suggestion
  const [openSuggest, setOpenSuggest] = useState(false)
  const [loadingSuggest, setLoadingSuggest] = useState(false)
  const [suggest, setSuggest] = useState<
    Array<{ label: string; value: string }>
  >([])
  const dq = useDebounce(qDraft, 250)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (!dq.trim()) {
      setOpenSuggest(false)
      setSuggest([])
      return
    }
    setLoadingSuggest(true)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(async () => {
      try {
        const items = await fetchAuditLogSuggest(dq.trim())
        setSuggest(items.slice(0, 10))
        setOpenSuggest(true)
      } finally {
        setLoadingSuggest(false)
      }
    }, 200)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [dq])

  const params = useMemo(
    () => ({
      q: q || undefined,
      action: action === "ALL" ? undefined : action,
      dateFrom: from || undefined,
      dateTo: to || undefined,
      sortBy: "createdAt" as const,
      sortDir: "desc" as const,
      page,
      pageSize
    }),
    [q, action, from, to, page, pageSize]
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchAuditLogs(params)
      setRows(res.data)
      setTotal(res.meta.total)
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    void load()
  }, [load])

  const onSearch = useCallback(() => {
    setQ(qDraft.trim())
    setAction(actionDraft)
    setFrom(fromDraft)
    setTo(toDraft)
    setPage(1)
    setOpenSuggest(false)
    setTimeout(() => void load(), 0)
  }, [qDraft, actionDraft, fromDraft, toDraft, load])

  const onClear = useCallback(() => {
    const defFrom = new Date(Date.now() - 7 * 86400000)
      .toISOString()
      .slice(0, 10)
    const defTo = new Date().toISOString().slice(0, 10)
    setQDraft("")
    setActionDraft("ALL")
    setFromDraft(defFrom)
    setToDraft(defTo)
    setQ("")
    setAction("ALL")
    setFrom(defFrom)
    setTo(defTo)
    setPage(1)
    setOpenSuggest(false)
    setTimeout(() => void load(), 0)
  }, [load])

  // quick view
  const [openQV, setOpenQV] = useState(false)
  const [current, setCurrent] = useState<AdminAuditLogItem | null>(null)

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>View audit log</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-3">
            <label className="block text-sm mb-1">Search</label>
            <Popover open={openSuggest} onOpenChange={setOpenSuggest}>
              <PopoverAnchor asChild>
                <div className="flex gap-2">
                  <Input
                    placeholder="actor / email / entity / ip / correlation"
                    value={qDraft}
                    onChange={(e) => setQDraft(e.target.value)}
                    onFocus={() => {
                      if (qDraft.trim()) setOpenSuggest(true)
                    }}
                    onBlur={() => {
                      setTimeout(() => setOpenSuggest(false), 120)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onSearch()
                    }}
                  />
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
                          setQDraft(s.value)
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
              value={actionDraft}
              onValueChange={(v: AdminAuditLogItem["action"]) =>
                setActionDraft(v)
              }
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
                  value={fromDraft}
                  onChange={(e) => setFromDraft(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">To</label>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={toDraft}
                  onChange={(e) => setToDraft(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ปุ่มชิดขวา */}
          <div className="md:col-span-6 flex justify-end gap-2">
            <Button onClick={onSearch} className="gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>
            <Button variant="outline" onClick={onClear}>
              Clear filter
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logs</CardTitle>
          <CardDescription>แสดงเฉพาะช่วงและเงื่อนไขที่เลือก</CardDescription>
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
                {loading && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  rows.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>#{l.id}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {l.actorName || "-"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {l.actorEmail || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{l.action}</TableCell>
                      <TableCell>
                        {l.resource}
                        {l.targetId ? `#${l.targetId}` : ""}
                      </TableCell>
                      <TableCell>{l.ip ?? "-"}</TableCell>
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
                          <Link href={`/admin/audit-logs/${l.id}`}>Detail</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                {!loading && rows.length === 0 && (
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

          <Pager
            page={page}
            pageSize={pageSize}
            total={total}
            onPage={(p: number) => {
              setPage(p)
              setTimeout(() => void load(), 0)
            }}
            onPageSize={(s: number) => {
              setPageSize(s)
              setPage(1)
              setTimeout(() => void load(), 0)
            }}
          />
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
                Actor: {current.actorName || "-"} &lt;
                {current.actorEmail || "-"}&gt;
              </div>
              <div>Action: {current.action}</div>
              <div>
                Resource: {current.resource}
                {current.targetId ? `#${current.targetId}` : ""}
              </div>
              <div>IP: {current.ip || "-"}</div>
              <div>Date: {new Date(current.createdAt).toLocaleString()}</div>
              {current.correlationId && (
                <div>Correlation: {current.correlationId}</div>
              )}
              <div className="text-xs text-muted-foreground">
                Meta:{" "}
                <pre className="whitespace-pre-wrap break-words">
                  {JSON.stringify(current.meta ?? {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
