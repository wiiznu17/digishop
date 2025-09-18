// apps/portal/src/app/(main)/admin/customers/page.tsx
"use client"

import { useMemo, useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Search, Eye } from "lucide-react"

type Customer = {
  id: number
  name: string
  email: string
  phone?: string
  tier: "REGULAR" | "SILVER" | "GOLD" | "VIP"
  status: "ACTIVE" | "SUSPENDED"
  createdAt: string
}

const MOCK: Customer[] = Array.from({ length: 88 }).map((_, i) => ({
  id: 1000 + i,
  name: ["Somchai", "Pim", "Nina", "Tao", "Mark"][i % 5],
  email: `user${i}@mail.com`,
  phone: `09${i % 10}-${(100000 + i).toString().slice(0, 6)}`,
  tier: (["REGULAR", "SILVER", "GOLD", "VIP"] as Customer["tier"][])[i % 4],
  status: (["ACTIVE", "SUSPENDED"] as Customer["status"][])[i % 2],
  createdAt: new Date(Date.now() - i * 43200000).toISOString()
}))

function Pager({ page, pageSize, total, onPage, onPageSize }: any) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="text-sm text-muted-foreground">{total} customers</div>
      <div className="flex items-center gap-2">
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSize(Number(v))}
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
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          Prev
        </Button>
        <div className="text-sm">
          {page} / {totalPages}
        </div>
        <Button
          variant="outline"
          onClick={() => onPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

function useDebounce<T>(v: T, ms = 300) {
  const [s, setS] = useState(v)
  useEffect(() => {
    const t = setTimeout(() => setS(v), ms)
    return () => clearTimeout(t)
  }, [v, ms])
  return s
}

export default function AdminCustomersPage() {
  const router = useRouter()
  const [q, setQ] = useState("")
  const [tier, setTier] = useState<Customer["tier"] | "ALL">("ALL")
  const [status, setStatus] = useState<Customer["status"] | "ALL">("ALL")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [openSuggest, setOpenSuggest] = useState(false)
  const [loadingSuggest, setLoadingSuggest] = useState(false)
  const debounceQ = useDebounce(q, 300)
  const timer = useRef<number | null>(null)
  const [suggest, setSuggest] = useState<Customer[]>([])

  useEffect(() => {
    if (!debounceQ.trim()) {
      setOpenSuggest(false)
      setSuggest([])
      return
    }
    setLoadingSuggest(true)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      const t = debounceQ.toLowerCase()
      setSuggest(
        MOCK.filter(
          (c) =>
            c.name.toLowerCase().includes(t) ||
            c.email.toLowerCase().includes(t)
        ).slice(0, 8)
      )
      setLoadingSuggest(false)
      setOpenSuggest(true)
    }, 200)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [debounceQ])

  const filtered = useMemo(() => {
    let base = MOCK
    const t = q.toLowerCase().trim()
    if (t)
      base = base.filter(
        (c) =>
          c.name.toLowerCase().includes(t) || c.email.toLowerCase().includes(t)
      )
    if (tier !== "ALL") base = base.filter((c) => c.tier === tier)
    if (status !== "ALL") base = base.filter((c) => c.status === status)
    return base
  }, [q, tier, status])

  const total = filtered.length
  const pageRows = useMemo(() => {
    const s = (page - 1) * pageSize
    return filtered.slice(s, s + pageSize)
  }, [filtered, page, pageSize])

  const [openQV, setOpenQV] = useState(false)
  const [current, setCurrent] = useState<Customer | null>(null)

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
          <CardDescription>Browse and manage customer accounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Search</label>
              <Popover open={openSuggest} onOpenChange={setOpenSuggest}>
                <PopoverAnchor asChild>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Name / email"
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      onFocus={() => {
                        if (q.trim()) setOpenSuggest(true)
                      }}
                      onBlur={() =>
                        setTimeout(() => setOpenSuggest(false), 120)
                      }
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
                      suggest.map((s) => (
                        <button
                          key={s.id}
                          className="w-full text-left px-3 py-2 hover:bg-accent"
                          onClick={() => {
                            setQ(s.email)
                            setOpenSuggest(false)
                          }}
                        >
                          <div className="text-sm font-medium">
                            {s.name} — {s.email}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {s.tier} · {s.status}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm mb-1">Tier</label>
                <Select
                  value={tier}
                  onValueChange={(v) => {
                    setTier(v as any)
                    setPage(1)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="REGULAR">REGULAR</SelectItem>
                    <SelectItem value="SILVER">SILVER</SelectItem>
                    <SelectItem value="GOLD">GOLD</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm mb-1">Status</label>
                <Select
                  value={status}
                  onValueChange={(v) => {
                    setStatus(v as any)
                    setPage(1)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>{r.phone || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.tier}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          r.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : ""
                        }
                        variant="outline"
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-2"
                        onClick={() => {
                          setCurrent(r)
                          setOpenQV(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => router.push(`/admin/customers/${r.id}`)}
                      >
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {pageRows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-muted-foreground"
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
            onPage={setPage}
            onPageSize={(s: number) => {
              setPageSize(s)
              setPage(1)
            }}
          />
        </CardContent>
      </Card>

      <Dialog open={openQV} onOpenChange={setOpenQV}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customer Quick View</DialogTitle>
          </DialogHeader>
          {current && (
            <div className="text-sm space-y-1">
              <div>
                <span className="text-muted-foreground">Name: </span>
                {current.name}
              </div>
              <div>
                <span className="text-muted-foreground">Email: </span>
                {current.email}
              </div>
              <div>
                <span className="text-muted-foreground">Tier: </span>
                {current.tier}
              </div>
              <div>
                <span className="text-muted-foreground">Status: </span>
                {current.status}
              </div>
              <Button
                className="mt-2"
                onClick={() => {
                  setOpenQV(false)
                  router.push(`/admin/customers/${current.id}`)
                }}
              >
                Open detail
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
