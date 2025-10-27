"use client"

import { useMemo, useState, useEffect } from "react"
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
import { Eye, Search as SearchIcon } from "lucide-react"

import type { AdminUserLite } from "@/types/admin/users"
import {
  fetchAdminUserListRequester,
  fetchAdminUserSuggest
} from "@/utils/requesters/userRequester"
import { Pager } from "@/components/common/Pager"
import AuthGuard from "@/components/AuthGuard"

function formatTHBMinor(minor: number) {
  const v = (minor ?? 0) / 100
  return v.toLocaleString("th-TH", { style: "currency", currency: "THB" })
}

function AdminCustomersPage() {
  const router = useRouter()

  // input states (ยังไม่ยิงค้นหา)
  const [qInput, setQInput] = useState("")
  const [dateFromInput, setDateFromInput] = useState<string>("")
  const [dateToInput, setDateToInput] = useState<string>("")
  const [spentMinInput, setSpentMinInput] = useState<string>("")
  const [spentMaxInput, setSpentMaxInput] = useState<string>("")

  const [openSuggest, setOpenSuggest] = useState(false)
  const [suggest, setSuggest] = useState<
    Array<{ id: number; name: string; email: string }>
  >([])

  // applied filters (ค่าที่กด Search แล้ว)
  const [applied, setApplied] = useState<{
    q?: string
    dateFrom?: string
    dateTo?: string
    spentMin?: number
    spentMax?: number
  }>({})

  // paging
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // data
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<AdminUserLite[]>([])
  const [total, setTotal] = useState(0)

  // โหลด list: ใช้เฉพาะตอน applied หรือ page/pageSize เปลี่ยน
  async function load() {
    setLoading(true)
    try {
      const { data, meta } = await fetchAdminUserListRequester({
        q: applied.q,
        dateFrom: applied.dateFrom,
        dateTo: applied.dateTo,
        spentMin: applied.spentMin,
        spentMax: applied.spentMax,
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
      const s = await fetchAdminUserSuggest(q)
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
    const toNum = (s: string) => {
      const n = Number(s)
      return Number.isFinite(n) && n >= 0 ? n : undefined
    }
    setApplied({
      q: qInput.trim() || undefined,
      dateFrom: dateFromInput || undefined,
      dateTo: dateToInput || undefined,
      spentMin: toNum(spentMinInput),
      spentMax: toNum(spentMaxInput)
    })
    setPage(1)
    setOpenSuggest(false)
  }

  const onClear = () => {
    setQInput("")
    setDateFromInput("")
    setDateToInput("")
    setSpentMinInput("")
    setSpentMaxInput("")
    setApplied({})
    setPage(1)
    setOpenSuggest(false)
  }

  // กด Enter ใน filter ใดๆ = ค้นหา
  const onKeyDownEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      onSearch()
    }
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Browse users (filters by date & spent)
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* ── Filters: จัด Search / Clear ไว้ท้ายสุด (ขวาสุด) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* Search (with suggestion) */}
            <div className="lg:col-span-4">
              <label className="block text-sm mb-1">Search</label>
              <Popover open={openSuggest} onOpenChange={setOpenSuggest}>
                <PopoverAnchor asChild>
                  <Input
                    placeholder="Name / email"
                    value={qInput}
                    onChange={(e) => setQInput(e.target.value)}
                    onFocus={() => {
                      if (qInput.trim()) setOpenSuggest(true)
                    }}
                    onBlur={() => setTimeout(() => setOpenSuggest(false), 120)}
                    onKeyDown={onKeyDownEnter}
                  />
                </PopoverAnchor>
                <PopoverContent
                  className="w-[min(520px,90vw)] p-0"
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
                            setQInput(s.email)
                            setOpenSuggest(false)
                          }}
                        >
                          <div className="text-sm font-medium">{s.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {s.email}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Date range */}
            <div className="lg:col-span-2">
              <label className="block text-sm mb-1">Created from</label>
              <Input
                type="date"
                value={dateFromInput}
                onChange={(e) => setDateFromInput(e.target.value)}
                onKeyDown={onKeyDownEnter}
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm mb-1">Created to</label>
              <Input
                type="date"
                value={dateToInput}
                onChange={(e) => setDateToInput(e.target.value)}
                onKeyDown={onKeyDownEnter}
              />
            </div>

            {/* Spent range (THB) */}
            <div className="lg:col-span-2">
              <label className="block text-sm mb-1">Spent min (THB)</label>
              <Input
                inputMode="decimal"
                placeholder="e.g. 1,000"
                value={spentMinInput}
                onChange={(e) => setSpentMinInput(e.target.value)}
                onKeyDown={onKeyDownEnter}
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm mb-1">Spent max (THB)</label>
              <Input
                inputMode="decimal"
                placeholder="e.g. 50,000"
                value={spentMaxInput}
                onChange={(e) => setSpentMaxInput(e.target.value)}
                onKeyDown={onKeyDownEnter}
              />
            </div>

            {/* Actions (ท้ายสุด) */}
            <div className="lg:col-span-12 flex flex-col sm:flex-row sm:justify-end gap-2 pt-1">
              <Button variant="outline" onClick={onClear}>
                Clear
              </Button>
              <Button onClick={onSearch}>
                <SearchIcon className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

          {/* ── Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Name</TableHead>
                  <TableHead className="w-[280px]">Email</TableHead>
                  <TableHead className="w-[160px]">Created</TableHead>
                  <TableHead className="w-[220px]">Store</TableHead>
                  <TableHead className="w-[160px] text-right">Spent</TableHead>
                  <TableHead className="w-[140px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
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
                        <div className="truncate">{r.name || "—"}</div>
                      </TableCell>

                      <TableCell>
                        <div className="truncate max-w-[260px]">{r.email}</div>
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleString()}
                      </TableCell>

                      <TableCell>
                        {!r.store ? (
                          "—"
                        ) : (
                          <button
                            className="text-primary hover:underline truncate max-w-[210px]"
                            onClick={() =>
                              router.push(`/admin/merchants/${r.store!.id}`)
                            }
                            title={r.store.storeName}
                          >
                            {r.store.storeName}
                          </button>
                        )}
                      </TableCell>

                      <TableCell className="text-right whitespace-nowrap">
                        {formatTHBMinor(r.orderTotalMinor)}{" "}
                        <span className="text-xs text-muted-foreground">
                          ({r.orderCount})
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="inline-flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(`/admin/customers/${r.id}`)
                            }
                            aria-label="View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              router.push(`/admin/customers/${r.id}`)
                            }
                          >
                            Detail
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                {!loading && pageRows.length === 0 && (
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
    </div>
  )
}

function Guard({ children }: { children: React.ReactNode }) {
  "use client"
  return <AuthGuard requiredPerms={["CUSTOMERS_READ"]}>{children}</AuthGuard>
}

export default function Page() {
  return (
    <Guard>
      <AdminCustomersPage />
    </Guard>
  )
}
