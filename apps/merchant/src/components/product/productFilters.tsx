'use client'

import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover'
import { Search, RotateCcw } from 'lucide-react'
import PRODUCT_STATUS_MASTER from '@/constants/master/productStatusMaster.json'
import PRODUCT_REQ_STATUS_MASTER from '@/constants/master/productReqStatusMaster.json'
import type {
  CategoryDto,
  SortBy,
  SortDir
} from '@/utils/requestUtils/requestProductUtils'
import { useProductSuggestionsQuery } from '@/hooks/queries/useProductQueries'

export type ProductFilterState = {
  q: string
  categoryUuid?: string
  status?: 'ACTIVE' | 'INACTIVE'
  reqStatus?: 'PENDING' | 'APPROVED' | 'REJECT'
  stock: 'in' | 'out' | 'all'
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

const ALL_VALUE = '__ALL__'
const DEFAULT_FILTERS: ProductFilterState = {
  q: '',
  categoryUuid: undefined,
  status: undefined,
  reqStatus: undefined,
  stock: 'all',
  sortBy: 'createdAt',
  sortDir: 'desc'
}

const SUGGEST_DEBOUNCE_MS = 600

export function ProductFilters({
  value = DEFAULT_FILTERS,
  onChange = () => {},
  onApply,
  onReset,
  categories
}: Props) {
  const [localQ, setLocalQ] = useState<string>(value.q ?? '')
  const [debouncedQ, setDebouncedQ] = useState<string>((value.q ?? '').trim())
  const [open, setOpen] = useState(false)
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

  useEffect(() => {
    setLocalQ(value.q ?? '')
  }, [value.q])

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedQ(localQ.trim()),
      SUGGEST_DEBOUNCE_MS
    )
    return () => window.clearTimeout(timer)
  }, [localQ])

  useEffect(() => {
    if (!localQ.trim()) {
      setOpen(false)
    }
  }, [localQ])

  const suggestionsQuery = useProductSuggestionsQuery(debouncedQ)
  const suggest = suggestionsQuery.data ?? { products: [], skus: [] }
  const loading = suggestionsQuery.isFetching

  const pickSuggestion = (text: string) => {
    setLocalQ(text)
    setOpen(false)
  }

  const applyNow = () => {
    onChange({ q: localQ })
    setTimeout(() => onApply?.(), 0)
  }

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="grid grid-cols-1 gap-3 md:flex-1 md:grid-cols-5">
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
                  if (e.key === 'Enter') applyNow()
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
                        {suggest.products.map((product) => (
                          <button
                            key={product.uuid}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent"
                            onClick={() => pickSuggestion(product.name)}
                          >
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="h-6 w-6 rounded object-cover border"
                              />
                            ) : (
                              <div className="h-6 w-6 rounded bg-muted" />
                            )}
                            <div className="flex-1">
                              <div className="text-sm">{product.name}</div>
                              {product.categoryName && (
                                <div className="text-xs text-muted-foreground">
                                  {product.categoryName}
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
                        {suggest.skus.map((sku) => (
                          <button
                            key={`${sku.productUuid}-${sku.sku}`}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent"
                            onClick={() => pickSuggestion(sku.sku)}
                          >
                            {sku.imageUrl ? (
                              <img
                                src={sku.imageUrl}
                                alt={sku.sku}
                                className="h-6 w-6 rounded object-cover border"
                              />
                            ) : (
                              <div className="h-6 w-6 rounded bg-muted" />
                            )}
                            <div className="flex-1">
                              <div className="text-sm">{sku.sku}</div>
                              {sku.productName && (
                                <div className="text-xs text-muted-foreground">
                                  {sku.productName}
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

        <div>
          <label className="block text-sm mb-1">Category</label>
          <Select
            value={value.categoryUuid ?? ALL_VALUE}
            onValueChange={(val) =>
              onChange({ categoryUuid: val === ALL_VALUE ? undefined : val })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All</SelectItem>
              {(categories ?? []).map((category) => (
                <SelectItem key={category.uuid} value={category.uuid}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm mb-1">Product Status</label>
          <Select
            value={value.status ?? ALL_VALUE}
            onValueChange={(val) =>
              onChange({
                status:
                  val === ALL_VALUE ? undefined : (val as 'ACTIVE' | 'INACTIVE')
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm mb-1">Approval</label>
          <Select
            value={value.reqStatus ?? ALL_VALUE}
            onValueChange={(val) =>
              onChange({
                reqStatus:
                  val === ALL_VALUE
                    ? undefined
                    : (val as 'PENDING' | 'APPROVED' | 'REJECT')
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All approvals" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>All</SelectItem>
              {reqStatuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm mb-1">Stock</label>
          <Select
            value={value.stock}
            onValueChange={(val: 'in' | 'out' | 'all') =>
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

        <div className="grid grid-cols-2 gap-2 md:col-span-2">
          <div>
            <label className="block text-sm mb-1">Sort by</label>
            <Select
              value={value.sortBy}
              onValueChange={(val: SortBy) => onChange({ sortBy: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Created</SelectItem>
                <SelectItem value="updatedAt">Updated</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="price">Price</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm mb-1">Direction</label>
            <Select
              value={value.sortDir}
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
