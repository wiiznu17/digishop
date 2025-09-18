// apps/portal/src/app/(main)/admin/merchants/page.tsx
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

type Merchant = {
  id: number
  storeName: string
  owner: string
  email: string
  status: "ACTIVE" | "SUSPENDED" | "PENDING"
  products: number
  createdAt: string
}

const MOCK: Merchant[] = Array.from({ length: 64 }).map((_, i) => ({
  id: 2000 + i,
  storeName: `Store ${i + 1}`,
  owner: ["Anan", "Bee", "Chan", "Dao"][i % 4],
  email: `shop${i}@mail.com`,
  status: (["ACTIVE", "SUSPENDED", "PENDING"] as Merchant["status"][])[i % 3],
  products: 20 + (i % 17),
  createdAt: new Date(Date.now() - i * 86400000).toISOString()
}))

function Pager({ page, pageSize, total, onPage, onPageSize }: any) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className="flex items-center justify-between py-3">
      <div className="text-sm text-muted-foreground">{total} merchants</div>
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

export default function AdminMerchantsPage() {
  const router = useRouter()
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<Merchant["status"] | "ALL">("ALL")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [openSuggest, setOpenSuggest] = useState(false)
  const [loadingSuggest, setLoadingSuggest] = useState(false)
  const debounceQ = useDebounce(q, 300)
  const timer = useRef<number | null>(null)
  const [suggest, setSuggest] = useState<Merchant[]>([])

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
          (m) =>
            m.storeName.toLowerCase().includes(t) ||
            m.email.toLowerCase().includes(t)
        ).slice(0, 8)
      )
      setLoadingSuggest(false)
      setOpenSuggest(true)
    }, 220)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [debounceQ])

  const filtered = useMemo(() => {
    let base = MOCK
    const t = q.toLowerCase().trim()
    if (t)
      base = base.filter(
        (m) =>
          m.storeName.toLowerCase().includes(t) ||
          m.email.toLowerCase().includes(t)
      )
    if (status !== "ALL") base = base.filter((m) => m.status === status)
    return base
  }, [q, status])

  const total = filtered.length
  const pageRows = useMemo(() => {
    const s = (page - 1) * pageSize
    return filtered.slice(s, s + pageSize)
  }, [filtered, page, pageSize])

  const [openQV, setOpenQV] = useState(false)
  const [current, setCurrent] = useState<Merchant | null>(null)

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Merchants</CardTitle>
          <CardDescription>All merchant stores</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Search</label>
              <Popover open={openSuggest} onOpenChange={setOpenSuggest}>
                <PopoverAnchor asChild>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Store / email"
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
                            setQ(s.storeName)
                            setOpenSuggest(false)
                          }}
                        >
                          <div className="text-sm font-medium">
                            {s.storeName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {s.email} · {s.status}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
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
                  <SelectItem value="PENDING">PENDING</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.storeName}</TableCell>
                    <TableCell>{r.owner}</TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>{r.products}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.status}</Badge>
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
                        onClick={() => router.push(`/admin/merchants/${r.id}`)}
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
            <DialogTitle>Merchant Quick View</DialogTitle>
          </DialogHeader>
          {current && (
            <div className="text-sm space-y-1">
              <div>
                <span className="text-muted-foreground">Store: </span>
                {current.storeName}
              </div>
              <div>
                <span className="text-muted-foreground">Owner: </span>
                {current.owner}
              </div>
              <div>
                <span className="text-muted-foreground">Email: </span>
                {current.email}
              </div>
              <div>
                <span className="text-muted-foreground">Status: </span>
                {current.status}
              </div>
              <Button
                className="mt-2"
                onClick={() => {
                  setOpenQV(false)
                  router.push(`/admin/merchants/${current.id}`)
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
