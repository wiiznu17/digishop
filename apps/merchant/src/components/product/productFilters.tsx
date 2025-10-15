// apps/merchant/src/components/product/productFilters.tsx
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover"
import { Search, RotateCcw } from "lucide-react"
// import CATEGORYMASTER from "@/constants/master/categoryMaster.json"
import PRODUCT_STATUS_MASTER from "@/constants/master/productStatusMaster.json"
import PRODUCT_REQ_STATUS_MASTER from "@/constants/master/productReqStatusMaster.json"
import type {
  CategoryDto,
  SortBy,
  SortDir,
  SuggestResponse
} from "@/utils/requestUtils/requestProductUtils"
import { fetchProductSuggestionsRequester } from "@/utils/requestUtils/requestProductUtils"

export type ProductFilterState = {
  q: string
  categoryUuid?: string
  status?: "ACTIVE" | "INACTIVE"
  reqStatus?: "PENDING" | "APPROVED" | "REJECT" // << NEW
  stock: "in" | "out" | "all"
  sortBy: SortBy
  sortDir: SortDir
}

type Props = {
  value?: ProductFilterState
  onChange?: (patch: Partial<ProductFilterState>) => void
  onApply?: () => void
  onReset?: () => void
  categories: CategoryDto[]
}

const ALL_VALUE = "__ALL__"
const DEFAULT_FILTERS: ProductFilterState = {
  q: "",
  categoryUuid: undefined,
  status: undefined,
  reqStatus: undefined,
  stock: "all",
  sortBy: "createdAt",
  sortDir: "desc"
}

// ← ตั้งดีบาวซ์เป็น 2 วินาทีตามที่ต้องการ
const SUGGEST_DEBOUNCE_MS = 600

export function ProductFilters({
  value = DEFAULT_FILTERS,
  onChange = () => {},
  onApply,
  onReset,
  categories
}: Props) {
  const v = value

  // ----- คุมอินพุตด้วย local state เพื่อลด re-render ทั้งหน้า -----
  const [localQ, setLocalQ] = useState<string>(v.q ?? "")
  useEffect(() => {
    // ถ้า parent เปลี่ยน q (เช่นจาก URL) ค่อย sync ลงมา
    setLocalQ(v.q ?? "")
  }, [v.q])

  // const categories = useMemo(
  //   () =>
  //     (Object.values(CATEGORYMASTER) as { value: string; label: string }[]) ??
  //     [],
  //   []
  // )
  const statuses = useMemo(
    () =>
      (Object.values(PRODUCT_STATUS_MASTER) as {
        value: string
        label: string
      }[]) ?? [],
    []
  )
  const reqStatuses = useMemo(
    () =>
      (Object.values(PRODUCT_REQ_STATUS_MASTER) as {
        value: string
        label: string
      }[]) ?? [],
    []
  )

  // ---- Suggest state
  const [open, setOpen] = useState(false)
  const [suggest, setSuggest] = useState<SuggestResponse>({
    products: [],
    skus: []
  })
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<number | null>(null)

  // ยิง suggest เมื่อหยุดพิมพ์ครบ SUGGEST_DEBOUNCE_MS
  useEffect(() => {
    const q = localQ.trim()
    if (!q) {
      setSuggest({ products: [], skus: [] })
      setOpen(false)
      return
    }
    setLoading(true)
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(async () => {
      const res = await fetchProductSuggestionsRequester(q)
      setSuggest(res ?? { products: [], skus: [] })
      setLoading(false)
      setOpen(true)
    }, SUGGEST_DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [localQ])

  const pickSuggestion = (text: string) => {
    setLocalQ(text) // ← เปลี่ยนเฉพาะ local
    setOpen(false)
  }

  const applyNow = () => {
    // 1) sync q กลับ parent
    onChange({ q: localQ })
    // 2) เว้นเฟรมสั้น ๆ ให้ state ขึ้นพาเรนต์ก่อน แล้วค่อย apply
    setTimeout(() => onApply?.(), 0)
  }

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 md:flex-1">
        {/* Search with suggest */}
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Search</label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverAnchor asChild>
              <Input
                placeholder="Name / Description / SKU"
                value={localQ}
                onChange={(e) => setLocalQ(e.target.value)}
                onFocus={() => {
                  if (localQ.trim()) setOpen(true)
                }}
                onBlur={() => {
                  setTimeout(() => setOpen(false), 150)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyNow()
                }}
                autoComplete="off"
              />
            </PopoverAnchor>
            <PopoverContent
              className="w-[420px] p-0"
              align="start"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <div className="max-h-80 overflow-auto">
                {loading && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Searching...
                  </div>
                )}
                {!loading &&
                suggest.products.length === 0 &&
                suggest.skus.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No suggestions
                  </div>
                ) : (
                  <>
                    {suggest.products.length > 0 && (
                      <>
                        <div className="px-3 py-1 text-xs text-muted-foreground">
                          Products
                        </div>
                        {suggest.products.map((s) => (
                          <button
                            key={s.uuid}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent"
                            onClick={() => pickSuggestion(s.name)}
                          >
                            {s.imageUrl ? (
                              <img
                                src={s.imageUrl}
                                className="h-6 w-6 rounded object-cover border"
                              />
                            ) : (
                              <div className="h-6 w-6 rounded bg-muted" />
                            )}
                            <div className="flex-1">
                              <div className="text-sm">{s.name}</div>
                              {s.categoryName && (
                                <div className="text-xs text-muted-foreground">
                                  {s.categoryName}
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </>
                    )}
                    {suggest.skus.length > 0 && (
                      <>
                        <div className="px-3 py-1 text-xs text-muted-foreground">
                          SKUs
                        </div>
                        {suggest.skus.map((s) => (
                          <button
                            key={`${s.productUuid}-${s.sku}`}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent"
                            onClick={() => pickSuggestion(s.sku)}
                          >
                            {s.imageUrl ? (
                              <img
                                src={s.imageUrl}
                                className="h-6 w-6 rounded object-cover border"
                              />
                            ) : (
                              <div className="h-6 w-6 rounded bg-muted" />
                            )}
                            <div className="flex-1">
                              <div className="text-sm">{s.sku}</div>
                              {s.productName && (
                                <div className="text-xs text-muted-foreground">
                                  {s.productName}
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm mb-1">Category</label>
          <Select
            value={v.categoryUuid ?? ALL_VALUE}
            onValueChange={(val) =>
              onChange({ categoryUuid: val === ALL_VALUE ? undefined : val })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All</SelectItem>
              {(categories ?? []).map((c) => (
                <SelectItem key={c.uuid} value={c.uuid}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        {/* <div>
          <label className="block text-sm mb-1">Status</label>
          <Select
            value={v.status ?? ALL_VALUE}
            onValueChange={(val) =>
              onChange({ status: val === ALL_VALUE ? undefined : val })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All</SelectItem>
              {(statuses ?? []).map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div> */}
        <div>
          <label className="block text-sm mb-1">Product Status</label>
          <Select
            value={v.status ?? ALL_VALUE}
            onValueChange={(val) =>
              onChange({
                status:
                  val === ALL_VALUE ? undefined : (val as "ACTIVE" | "INACTIVE")
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Approval Status (reqStatus) */}
        <div>
          <label className="block text-sm mb-1">Approval</label>
          <Select
            value={v.reqStatus ?? ALL_VALUE}
            onValueChange={(val) =>
              onChange({
                reqStatus:
                  val === ALL_VALUE
                    ? undefined
                    : (val as "PENDING" | "APPROVED" | "REJECT")
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All approvals" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All</SelectItem>
              {reqStatuses.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stock */}
        <div>
          <label className="block text-sm mb-1">Stock</label>
          <Select
            value={v.stock}
            onValueChange={(val: "in" | "out" | "all") =>
              onChange({ stock: val })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in">In stock only</SelectItem>
              <SelectItem value="out">Out of stock only</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm mb-1">Sort by</label>
            <Select
              value={v.sortBy}
              onValueChange={(val: SortBy) => onChange({ sortBy: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Created</SelectItem>
                <SelectItem value="updatedAt">Updated</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="price">Price (min)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm mb-1">Direction</label>
            <Select
              value={v.sortDir}
              onValueChange={(val: SortDir) => onChange({ sortDir: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Desc</SelectItem>
                <SelectItem value="asc">Asc</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={applyNow} className="gap-2">
          <Search className="h-4 w-4" />
          Search
        </Button>
        <Button variant="outline" onClick={onReset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Clear
        </Button>
      </div>
    </div>
  )
}
