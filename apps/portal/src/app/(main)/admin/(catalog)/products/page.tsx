// apps/portal/src/app/(main)/admin/products/page.tsx
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
import { Eye, Search, Package } from "lucide-react"

type Product = {
  id: number
  name: string
  category?: string
  status: "ACTIVE" | "DRAFT" | "OUT_OF_STOCK" | "SUSPENDED"
  minPriceMinor: number
  totalStock: number
}

const MOCK: Product[] = Array.from({ length: 120 }).map((_, i) => ({
  id: 3000 + i,
  name: `Product ${i + 1}`,
  category: ["Electronics", "Fashion", "Home", "Beauty"][i % 4],
  status: (
    ["ACTIVE", "DRAFT", "OUT_OF_STOCK", "SUSPENDED"] as Product["status"][]
  )[i % 4],
  minPriceMinor: 19900 + (i % 7) * 1000,
  totalStock: (i * 7) % 120
}))

const formatTHB = (minor: number) =>
  (minor / 100).toLocaleString("th-TH", { style: "currency", currency: "THB" })

function Pager({ page, pageSize, total, onPage, onPageSize }: any) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className="flex items-center justify-between py-3">
      <div className="text-sm text-muted-foreground">{total} products</div>
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

export default function AdminProductsPage() {
  const router = useRouter()
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<Product["status"] | "ALL">("ALL")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [openSuggest, setOpenSuggest] = useState(false)
  const [loadingSuggest, setLoadingSuggest] = useState(false)
  const debounceQ = useDebounce(q, 300)
  const timer = useRef<number | null>(null)
  const [suggest, setSuggest] = useState<Product[]>([])

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
        MOCK.filter((p) => p.name.toLowerCase().includes(t)).slice(0, 8)
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
    if (t) base = base.filter((p) => p.name.toLowerCase().includes(t))
    if (status !== "ALL") base = base.filter((p) => p.status === status)
    return base
  }, [q, status])

  const total = filtered.length
  const rows = useMemo(() => {
    const s = (page - 1) * pageSize
    return filtered.slice(s, s + pageSize)
  }, [filtered, page, pageSize])

  const [openQV, setOpenQV] = useState(false)
  const [current, setCurrent] = useState<Product | null>(null)

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>Catalog overview (mock)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Search</label>
              <Popover open={openSuggest} onOpenChange={setOpenSuggest}>
                <PopoverAnchor asChild>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Product name"
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
                            setQ(s.name)
                            setOpenSuggest(false)
                          }}
                        >
                          <div className="text-sm font-medium">{s.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {s.category} · {s.status}
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
                  <SelectItem value="DRAFT">DRAFT</SelectItem>
                  <SelectItem value="OUT_OF_STOCK">OUT_OF_STOCK</SelectItem>
                  <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Min Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="font-medium">{r.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{r.category ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatTHB(r.minPriceMinor)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={!r.totalStock ? "text-destructive" : ""}>
                        {r.totalStock}
                      </span>
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
                        onClick={() => router.push(`/admin/products/${r.id}`)}
                      >
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
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
            <DialogTitle>Product Quick View</DialogTitle>
          </DialogHeader>
          {current && (
            <div className="text-sm space-y-1">
              <div>
                <span className="text-muted-foreground">Name: </span>
                {current.name}
              </div>
              <div>
                <span className="text-muted-foreground">Category: </span>
                {current.category ?? "-"}
              </div>
              <div>
                <span className="text-muted-foreground">Status: </span>
                {current.status}
              </div>
              <div>
                <span className="text-muted-foreground">Min price: </span>
                {formatTHB(current.minPriceMinor)}
              </div>
              <Button
                className="mt-2"
                onClick={() => {
                  setOpenQV(false)
                  router.push(`/admin/products/${current.id}`)
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
