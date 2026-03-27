'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Eye, Package, Search } from 'lucide-react'

import {
  fetchAdminProductsRequester,
  fetchAdminCategoriesRequester,
  fetchAdminProductSuggestionsRequester
} from '@/utils/requesters/productRequester'
import { DashboardHeader } from '@/components/dashboard-header'
import {
  AdminCategoryDto,
  AdminFetchProductsParams,
  AdminProductListItem,
  AdminSuggestResponse
} from '@/types/admin/catalog'
import AuthGuard from '@/components/AuthGuard'

// ========= helpers =========
const fmtTHB = (minor?: number | null) =>
  minor == null
    ? '-'
    : (minor / 100).toLocaleString('th-TH', {
        style: 'currency',
        currency: 'THB'
      })

function cx(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(' ')
}

function Pager({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPageSelector = true
}: {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (n: number) => void
  showItemsPerPageSelector?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="text-sm text-muted-foreground">
        {totalItems.toLocaleString()} products
      </div>
      <div className="flex items-center gap-2">
        {showItemsPerPageSelector && onItemsPerPageChange && (
          <Select
            value={String(itemsPerPage)}
            onValueChange={(v: string) => onItemsPerPageChange(Number(v))}
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
        )}
        <Button
          variant="outline"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
        >
          Prev
        </Button>
        <div className="text-sm">
          {currentPage} / {Math.max(1, totalPages)}
        </div>
        <Button
          variant="outline"
          onClick={() =>
            onPageChange(Math.min(Math.max(1, totalPages), currentPage + 1))
          }
          disabled={currentPage >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

type SortBy = AdminFetchProductsParams['sortBy']
type SortDir = AdminFetchProductsParams['sortDir']
type StockFilter = 'in' | 'out' | 'all'
type ReqStatus = 'PENDING' | 'APPROVED' | 'REJECT'
type PStatus = 'ACTIVE' | 'INACTIVE'

export type AdminProductFilterState = {
  q: string
  categoryUuid?: string
  reqStatus?: ReqStatus
  status?: PStatus
  stock: StockFilter
  sortBy: SortBy
  sortDir: SortDir
}

const ALL = '__ALL__'
const DEFAULT_FILTERS: AdminProductFilterState = {
  q: '',
  categoryUuid: undefined,
  reqStatus: undefined, // default UI = All
  status: undefined,
  stock: 'all',
  sortBy: 'createdAt',
  sortDir: 'desc'
}

// สำหรับจำค่าฟิลเตอร์ล่าสุดข้ามหน้า/รีเฟรช
const STORAGE_KEY = 'adminProductsFilters.v1'
const PERSIST_KEYS = [
  'q',
  'categoryUuid',
  'reqStatus',
  'status',
  'inStock',
  'sortBy',
  'sortDir',
  'page',
  'pageSize'
] as const
type PersistKey = (typeof PERSIST_KEYS)[number]

function AdminProductFilters({
  value = DEFAULT_FILTERS,
  onChange = () => {},
  onApply,
  onReset,
  categories
}: {
  value?: AdminProductFilterState
  onChange?: (patch: Partial<AdminProductFilterState>) => void
  onApply?: () => void
  onReset?: () => void
  categories: AdminCategoryDto[]
}) {
  const v = value

  // search q (store name only)
  const [localQ, setLocalQ] = useState(v.q ?? '')
  useEffect(() => setLocalQ(v.q ?? ''), [v.q])

  const [open, setOpen] = useState(false)
  const [suggest, setSuggest] = useState<AdminSuggestResponse>({ products: [] })
  const [loading, setLoading] = useState(false)
  const debounce = useRef<number | null>(null)

  useEffect(() => {
    const q = localQ.trim()
    if (!q) {
      setSuggest({ products: [] })
      setOpen(false)
      return
    }
    setLoading(true)
    if (debounce.current) window.clearTimeout(debounce.current)
    debounce.current = window.setTimeout(async () => {
      const res = await fetchAdminProductSuggestionsRequester(q)
      setSuggest(res ?? { products: [] })
      setLoading(false)
      setOpen(true)
    }, 500)
    return () => {
      if (debounce.current) window.clearTimeout(debounce.current)
    }
  }, [localQ])

  const pick = (storeName: string) => {
    setLocalQ(storeName)
    setOpen(false)
  }

  const applyNow = () => {
    onChange({ q: localQ })
    setTimeout(() => onApply?.(), 0)
  }

  return (
    <div className="space-y-3">
      {/* แถบฟิลเตอร์ */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        {/* Search + suggest (เฉพาะชื่อร้าน) */}
        <div className="md:col-span-4">
          <label className="block text-sm mb-1">Search (Store name)</label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverAnchor asChild>
              <Input
                placeholder="Store name"
                value={localQ}
                onChange={(e) => setLocalQ(e.target.value)}
                onFocus={() => {
                  if (localQ.trim()) setOpen(true)
                }}
                onBlur={() => {
                  setTimeout(() => setOpen(false), 150)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applyNow()
                }}
                autoComplete="off"
              />
            </PopoverAnchor>
            <PopoverContent
              align="start"
              onOpenAutoFocus={(e) => e.preventDefault()}
              // ให้กว้างเท่าช่อง Input
              className="p-0 w-[--radix-popover-trigger-width] max-w-[520px]"
            >
              <div className="max-h-80 overflow-auto">
                {loading ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Searching...
                  </div>
                ) : suggest.products.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No suggestions
                  </div>
                ) : (
                  suggest.products.map((s) => (
                    <button
                      key={s.uuid}
                      className="w-full px-3 py-2 text-left hover:bg-accent"
                      onClick={() => pick(s.storeName ?? s.name)}
                    >
                      <div className="text-sm">{s.storeName ?? s.name}</div>
                    </button>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Category */}
        <div className="md:col-span-3">
          <label className="block text-sm mb-1">Category</label>
          <Select
            value={v.categoryUuid ?? ALL}
            onValueChange={(val: string) =>
              onChange({ categoryUuid: val === ALL ? undefined : val })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All</SelectItem>
              {(categories ?? []).map((c) => (
                <SelectItem key={c.uuid} value={c.uuid}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Req Status */}
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Request Status</label>
          <Select
            value={v.reqStatus ?? ALL}
            onValueChange={(val: string) =>
              onChange({
                reqStatus: val === ALL ? undefined : (val as ReqStatus)
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All</SelectItem>
              <SelectItem value="PENDING">PENDING</SelectItem>
              <SelectItem value="APPROVED">APPROVED</SelectItem>
              <SelectItem value="REJECT">REJECT</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Product Status */}
        <div className="md:col-span-3">
          <label className="block text-sm mb-1">Product Status</label>
          <Select
            value={v.status ?? ALL}
            onValueChange={(val: string) =>
              onChange({ status: val === ALL ? undefined : (val as PStatus) })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All</SelectItem>
              <SelectItem value="ACTIVE">ACTIVE</SelectItem>
              <SelectItem value="INACTIVE">INACTIVE</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stock */}
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Stock</label>
          <Select
            value={v.stock}
            onValueChange={(val: string) =>
              onChange({ stock: val as StockFilter })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in">In stock only</SelectItem>
              <SelectItem value="out">Out of stock only</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort */}
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Sort by</label>
          <Select
            value={v.sortBy}
            onValueChange={(val: string) => onChange({ sortBy: val as SortBy })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Created" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Created</SelectItem>
              <SelectItem value="updatedAt">Updated</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="price">Price (min)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Direction */}
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Direction</label>
          <Select
            value={v.sortDir}
            onValueChange={(val: string) =>
              onChange({ sortDir: val as SortDir })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Desc" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Desc</SelectItem>
              <SelectItem value="asc">Asc</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="md:col-span-2 flex gap-2 justify-end">
          <Button onClick={applyNow} className="gap-2">
            <Search className="h-4 w-4" /> Search
          </Button>
          <Button variant="outline" onClick={onReset}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  )
}

// ========= Page =========
function AdminProductsPage() {
  const router = useRouter()
  const sp = useSearchParams()

  // parse from URL
  const page = Number(sp.get('page') ?? 1)
  const pageSize = Number(sp.get('pageSize') ?? 20)
  const q = sp.get('q') ?? ''
  const categoryUuid = sp.get('categoryUuid') ?? undefined

  const rawReq = sp.get('reqStatus') // "__ALL__" | "PENDING" | "APPROVED" | "REJECT" | null
  // default All: ถ้า missing หรือ "__ALL__" = undefined (ไม่กรอง)
  const reqStatusParsed: ReqStatus | undefined =
    rawReq == null || rawReq === ALL
      ? undefined
      : ((rawReq as ReqStatus) ?? undefined)

  const status = sp.get('status') as PStatus | null
  const inStockParam = sp.get('inStock')
  const inStock = inStockParam == null ? undefined : inStockParam === 'true'
  const sortBy = (sp.get('sortBy') as SortBy) ?? 'createdAt'
  const sortDir = (sp.get('sortDir') as SortDir) ?? 'desc'

  // UI state
  const [filters, setFilters] = useState<AdminProductFilterState>({
    q,
    categoryUuid,
    reqStatus: reqStatusParsed, // UI = All เมื่อไม่มี/ALL
    status: status ?? undefined,
    stock: inStock === undefined ? 'all' : inStock ? 'in' : 'out',
    sortBy,
    sortDir
  })

  // sync UI จาก URL
  useEffect(() => {
    const rawReq = sp.get('reqStatus')
    const parsed: ReqStatus | undefined =
      rawReq == null || rawReq === ALL
        ? undefined
        : ((rawReq as ReqStatus) ?? undefined)

    setFilters({
      q,
      categoryUuid,
      reqStatus: parsed,
      status: (sp.get('status') as PStatus | null) ?? undefined,
      stock: inStock === undefined ? 'all' : inStock ? 'in' : 'out',
      sortBy,
      sortDir
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, categoryUuid, rawReq, status, inStock, sortBy, sortDir])

  const pushQuery = (
    kv: Record<string, string | number | undefined | null>
  ) => {
    const next = new URLSearchParams(sp.toString())
    Object.entries(kv).forEach(([k, v]) => {
      if (v === undefined || v === '' || v === null) next.delete(k)
      else next.set(k, String(v))
    })
    router.push(`/admin/products?${next.toString()}`)
  }

  // ===== Remember filters across navigation/refresh =====
  const didInit = useRef(false)

  // 1) On first mount: ถ้า URL ไม่มี params → ลองโหลดจาก localStorage; ถ้าไม่มี → ตั้ง All
  useEffect(() => {
    if (didInit.current) return
    didInit.current = true

    const hasAnyParam = PERSIST_KEYS.some((k) => sp.get(k) !== null)
    if (hasAnyParam) {
      // มี params แล้ว → sync เก็บลง localStorage ไว้ใช้ครั้งถัดไป
      try {
        const snap: Record<string, string> = {}
        PERSIST_KEYS.forEach((k) => {
          const v = sp.get(k)
          if (v !== null) snap[k] = v
        })
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snap))
      } catch {}
      return
    }

    // ไม่มี params → พยายาม restore จาก localStorage
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const saved = raw ? (JSON.parse(raw) as Record<string, string>) : null
      if (saved && Object.keys(saved).length) {
        pushQuery(saved) // จะไปดึงข้อมูลใหม่ตามค่าที่ restore
      } else {
        // ไม่มีค่าเก่า → ตั้ง default = All
        pushQuery({
          reqStatus: ALL,
          sortBy: 'createdAt',
          sortDir: 'desc',
          page: 1,
          pageSize: 20
        })
      }
    } catch {
      // fallback ปลอดภัย
      pushQuery({
        reqStatus: ALL,
        sortBy: 'createdAt',
        sortDir: 'desc',
        page: 1,
        pageSize: 20
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 2) เมื่อ URL เปลี่ยน → บันทึกค่าลง localStorage (จำเฉพาะค่าที่ applied แล้ว)
  useEffect(() => {
    try {
      const snap: Record<string, string> = {}
      PERSIST_KEYS.forEach((k) => {
        const v = sp.get(k)
        if (v !== null) snap[k] = v
      })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snap))
    } catch {}
  }, [sp.toString()]) // toString เปลี่ยนเมื่อ query เปลี่ยน

  const handleApply = () => {
    pushQuery({
      q: filters.q,
      categoryUuid: filters.categoryUuid,
      reqStatus: filters.reqStatus ?? ALL, // persist ALL ใน URL
      status: filters.status,
      inStock:
        filters.stock === 'all' ? undefined : String(filters.stock === 'in'),
      sortBy: filters.sortBy,
      sortDir: filters.sortDir,
      page: 1
    })
  }

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS)
    pushQuery({
      q: undefined,
      categoryUuid: undefined,
      reqStatus: ALL, // reset เป็น All และคงไว้ใน URL
      status: undefined,
      inStock: undefined,
      sortBy: 'createdAt',
      sortDir: 'desc',
      page: 1,
      pageSize
    })
  }

  const handlePageChange = (next: number) => pushQuery({ page: next })
  const handlePageSizeChange = (n: number) =>
    pushQuery({ pageSize: n, page: 1 })

  // data
  const [rows, setRows] = useState<AdminProductListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [categories, setCategories] = useState<AdminCategoryDto[]>([])

  useEffect(() => {
    ;(async () => {
      const cats = await fetchAdminCategoriesRequester()
      setCategories(cats)
    })()
  }, [])

  const fetchList = useCallback(async () => {
    setLoading(true)
    const res = await fetchAdminProductsRequester({
      q,
      categoryUuid,
      reqStatus: reqStatusParsed, // API ใช้ parsed (All = undefined)
      status: status ?? undefined,
      inStock,
      sortBy,
      sortDir,
      page,
      pageSize
    })
    setLoading(false)
    if (!res) return
    setRows(res.data)
    setTotalItems(res.meta.total)
    setTotalPages(res.meta.totalPages || 1)
  }, [
    q,
    categoryUuid,
    reqStatusParsed,
    status,
    inStock,
    sortBy,
    sortDir,
    page,
    pageSize
  ])

  useEffect(() => {
    void fetchList()
  }, [fetchList])

  // quick view
  const [openQV, setOpenQV] = useState(false)
  const [current, setCurrent] = useState<AdminProductListItem | null>(null)

  const openDetail = (uuid: string) => router.push(`/admin/products/${uuid}`)

  return (
    <div>
      <DashboardHeader
        title="Products"
        description="Manage all product in platform"
      ></DashboardHeader>
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>Products (Admin)</CardTitle>
            <CardDescription>
              Moderate & review merchant products
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <AdminProductFilters
              value={filters}
              onChange={(patch) =>
                setFilters((prev) => ({ ...prev, ...patch }))
              }
              onApply={handleApply}
              onReset={handleReset}
              categories={categories}
            />

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Store name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Request Status</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Min Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {rows.map((r) => {
                    const mainImg =
                      r.images?.find((i) => i.isMain) ?? r.images?.[0]
                    return (
                      <TableRow key={r.uuid} className="hover:bg-accent/40">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {mainImg?.url ? (
                              <img
                                src={mainImg.url}
                                alt={r.name}
                                className="h-12 w-12 rounded-lg object-cover border cursor-pointer"
                                onClick={() => {
                                  setCurrent(r)
                                  setOpenQV(true)
                                }}
                              />
                            ) : (
                              <div
                                className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center cursor-pointer"
                                onClick={() => {
                                  setCurrent(r)
                                  setOpenQV(true)
                                }}
                              >
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <button
                              className="text-left font-medium hover:text-primary"
                              onClick={() => openDetail(r.uuid)}
                              title="Open detail"
                            >
                              {r.name}
                            </button>
                          </div>
                        </TableCell>

                        <TableCell className="max-w-[220px] truncate">
                          {r.store?.storeName ?? '-'}
                        </TableCell>

                        <TableCell className="max-w-[220px] truncate">
                          {r.category?.name ?? '-'}
                        </TableCell>

                        <TableCell>
                          <Badge
                            className={cx(
                              'border',
                              r.reqStatus === 'PENDING' &&
                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                              r.reqStatus === 'APPROVED' &&
                                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                              r.reqStatus === 'REJECT' &&
                                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            )}
                            variant="outline"
                          >
                            {r.reqStatus}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge
                            className={cx(
                              'border',
                              r.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                            )}
                            variant="outline"
                          >
                            {r.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          {fmtTHB(r.minPriceMinor ?? null)}
                        </TableCell>

                        <TableCell className="text-right">
                          <span
                            className={!r.totalStock ? 'text-destructive' : ''}
                          >
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
                            title="Quick View"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" onClick={() => openDetail(r.uuid)}>
                            Detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}

                  {!loading && rows.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
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
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={pageSize}
              onPageChange={handlePageChange}
              onItemsPerPageChange={(n) => handlePageSizeChange(n)}
              showItemsPerPageSelector
            />
          </CardContent>
        </Card>

        {/* Quick View */}
        <Dialog open={openQV} onOpenChange={setOpenQV}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Product Quick View</DialogTitle>
            </DialogHeader>
            {current && (
              <div className="text-sm space-y-2">
                <div className="flex items-start gap-3">
                  {current.images?.[0]?.url ? (
                    <img
                      src={current.images[0].url}
                      alt={current.name}
                      className="h-20 w-20 rounded object-cover border"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded bg-muted flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{current.name}</div>
                    <div className="text-xs text-muted-foreground">
                      UUID: {current.uuid}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-muted-foreground">Store: </span>
                  {current.store?.storeName ?? '-'}
                </div>

                <div>
                  <span className="text-muted-foreground">Category: </span>
                  {current.category?.name ?? '-'}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Req Status:</span>
                  <Badge variant="outline">{current.reqStatus}</Badge>
                </div>

                {current.reqStatus === 'REJECT' && !!current.rejectReason && (
                  <div className="rounded border p-2 bg-destructive/10">
                    <div className="text-xs text-muted-foreground">
                      Reject Reason
                    </div>
                    <div>{current.rejectReason}</div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Product Status:</span>
                  <Badge variant="outline">{current.status}</Badge>
                </div>

                <div>
                  <span className="text-muted-foreground">Min Price: </span>
                  {fmtTHB(current.minPriceMinor ?? null)}
                </div>

                <div>
                  <span className="text-muted-foreground">Total Stock: </span>
                  {current.totalStock}
                </div>

                <Button
                  className="mt-2"
                  onClick={() => {
                    setOpenQV(false)
                    if (current?.uuid)
                      router.push(`/admin/products/${current.uuid}`)
                  }}
                >
                  Open detail
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

function Guard({ children }: { children: React.ReactNode }) {
  'use client'
  return <AuthGuard requiredPerms={['PRODUCTS_READ']}>{children}</AuthGuard>
}

export default function Page() {
  return (
    <Guard>
      <AdminProductsPage />
    </Guard>
  )
}
