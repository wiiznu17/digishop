"use client"

import { useEffect, useMemo, useState } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"

import type { AdminStoreLite } from "@/types/admin/stores"
import {
  fetchAdminStoreListRequester,
  fetchAdminStoreSuggest
} from "@/utils/requesters/merchantRequester"
import { Pager } from "@/components/common/Pager"
import AuthGuard from "@/components/AuthGuard"
import { StatusBadge } from "@/components/admin/merchants/merchantColorBadge"

function formatMoneyMinor(minor?: number) {
  const n = Number(minor ?? 0)
  return (n / 100).toLocaleString()
}

function AdminMerchantsPage() {
  const router = useRouter()

  // input states
  const [qInput, setQInput] = useState("")
  const [statusInput, setStatusInput] = useState<string | "ALL">("ALL")
  const [dateFromInput, setDateFromInput] = useState<string>("")
  const [dateToInput, setDateToInput] = useState<string>("")
  const [salesMinInput, setSalesMinInput] = useState<string>("")
  const [salesMaxInput, setSalesMaxInput] = useState<string>("")
  const [orderCountMinInput, setOrderCountMinInput] = useState<string>("")
  const [orderCountMaxInput, setOrderCountMaxInput] = useState<string>("")

  const [openSuggest, setOpenSuggest] = useState(false)
  const [suggest, setSuggest] = useState<
    Array<{ id: number; storeName: string }>
  >([])

  // applied filters
  const [applied, setApplied] = useState<{
    q?: string
    status?: string
    dateFrom?: string
    dateTo?: string
    salesMin?: number
    salesMax?: number
    orderCountMin?: number
    orderCountMax?: number
  }>({})

  // paging
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // data
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<AdminStoreLite[]>([])
  const [total, setTotal] = useState(0)

  // โหลด list
  async function load() {
    setLoading(true)
    try {
      const { data, meta } = await fetchAdminStoreListRequester({
        q: applied.q,
        status: applied.status,
        dateFrom: applied.dateFrom,
        dateTo: applied.dateTo,
        salesMin: applied.salesMin,
        salesMax: applied.salesMax,
        orderCountMin: applied.orderCountMin,
        orderCountMax: applied.orderCountMax,
        page,
        pageSize,
        sortBy: "createdAt",
        sortDir: "desc"
      })
      setRows(data)
      setTotal(meta.total)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    void load()
  }, [applied, page, pageSize])

  // suggest
  useEffect(() => {
    let alive = true
    const t = setTimeout(async () => {
      const q = qInput.trim()
      if (!q) {
        setOpenSuggest(false)
        setSuggest([])
        return
      }
      const s = await fetchAdminStoreSuggest(q)
      if (!alive) return
      setSuggest(s.slice(0, 8))
      setOpenSuggest(true)
    }, 240)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [qInput])

  const pageRows = useMemo(() => rows, [rows])

  const onSearch = () => {
    setApplied({
      q: qInput.trim() || undefined,
      status: statusInput === "ALL" ? undefined : statusInput,
      dateFrom: dateFromInput || undefined,
      dateTo: dateToInput || undefined,
      salesMin: salesMinInput ? Number(salesMinInput) : undefined,
      salesMax: salesMaxInput ? Number(salesMaxInput) : undefined,
      orderCountMin: orderCountMinInput
        ? Number(orderCountMinInput)
        : undefined,
      orderCountMax: orderCountMaxInput ? Number(orderCountMaxInput) : undefined
    })
    setPage(1)
    setOpenSuggest(false)
  }

  const onClear = () => {
    setQInput("")
    setStatusInput("ALL")
    setDateFromInput("")
    setDateToInput("")
    setSalesMinInput("")
    setSalesMaxInput("")
    setOrderCountMinInput("")
    setOrderCountMaxInput("")
    setApplied({})
    setPage(1)
    setOpenSuggest(false)
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Merchants</CardTitle>
              <CardDescription>All merchant stores</CardDescription>
            </div>
            {/* <Button variant="outline" onClick={onClear}>
              Clear filters
            </Button> */}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 items-end">
            {/* Search (กว้าง 2 คอลัมน์บนจอใหญ่) */}
            <div className="lg:col-span-2">
              <label className="block text-sm mb-1">Search</label>
              <Popover open={openSuggest} onOpenChange={setOpenSuggest}>
                <PopoverAnchor asChild>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Store / email"
                      value={qInput}
                      onChange={(e) => setQInput(e.target.value)}
                      onFocus={() => {
                        if (qInput.trim()) setOpenSuggest(true)
                      }}
                      onBlur={() =>
                        setTimeout(() => setOpenSuggest(false), 120)
                      }
                    />
                  </div>
                </PopoverAnchor>
                {/* ทำให้กว้างเท่าช่อง input โดยใช้ตัวแปรของ radix */}
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0"
                  align="start"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <div className="max-h-80 overflow-auto">
                    {suggest.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No suggestions
                      </div>
                    ) : (
                      suggest.map((s) => (
                        <button
                          key={s.id}
                          className="w-full text-left px-3 py-2 hover:bg-accent"
                          onClick={() => {
                            setQInput(s.storeName)
                            setOpenSuggest(false)
                          }}
                        >
                          <div className="text-sm font-medium">
                            {s.storeName}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm mb-1">Status</label>
              <Select
                value={statusInput}
                onValueChange={(v) => setStatusInput(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="PENDING">PENDING</SelectItem>
                  <SelectItem value="APPROVED">APPROVED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm mb-1">Created from</label>
                <Input
                  type="date"
                  value={dateFromInput}
                  onChange={(e) => setDateFromInput(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Created to</label>
                <Input
                  type="date"
                  value={dateToInput}
                  onChange={(e) => setDateToInput(e.target.value)}
                />
              </div>
            </div>

            {/* Sales range */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm mb-1">Sales min</label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0.00"
                  value={salesMinInput}
                  onChange={(e) => setSalesMinInput(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Sales max</label>
                <Input
                  type="number"
                  min={0}
                  placeholder="100000.00"
                  value={salesMaxInput}
                  onChange={(e) => setSalesMaxInput(e.target.value)}
                />
              </div>
            </div>

            {/* Order count range */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm mb-1">Orders min</label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={orderCountMinInput}
                  onChange={(e) => setOrderCountMinInput(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Orders max</label>
                <Input
                  type="number"
                  min={0}
                  placeholder="9999"
                  value={orderCountMaxInput}
                  onChange={(e) => setOrderCountMaxInput(e.target.value)}
                />
              </div>
            </div>

            {/* Actions: จัดให้ปุ่มชิดล่างของแถว */}
            <div className="grid grid-cols-2 gap-2 self-end">
              {/* Search button (no label) */}
              <div className="flex items-end">
                <Button className="w-full" onClick={onSearch}>
                  <Search className="h-4 w-4 mr-2" /> Search
                </Button>
              </div>

              {/* Clear button (no label) */}
              <div className="flex items-end">
                <Button variant="outline" className="w-full" onClick={onClear}>
                  Clear filters
                </Button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  pageRows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {r.storeName}
                      </TableCell>
                      <TableCell>{r.email}</TableCell>
                      <TableCell>
                        {r.ownerName} ({r.ownerEmail})
                      </TableCell>
                      <TableCell>{r.productCount}</TableCell>
                      <TableCell>
                        ฿{formatMoneyMinor(r.orderTotalMinor)}
                      </TableCell>
                      <TableCell>{r.orderCount}</TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                      <TableCell>
                        {new Date(r.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() =>
                            router.push(`/admin/merchants/${r.id}`)
                          }
                        >
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                {!loading && pageRows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
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
    </div>
  )
}

function Guard({ children }: { children: React.ReactNode }) {
  "use client"
  return <AuthGuard requiredPerms={["MERCHANTS_READ"]}>{children}</AuthGuard>
}

export default function Page() {
  return (
    <Guard>
      <AdminMerchantsPage />
    </Guard>
  )
}
