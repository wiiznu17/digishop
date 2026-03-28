'use client'

import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RotateCcw, SlidersHorizontal } from 'lucide-react'
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue
} from '@/components/ui/multi-select'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

export type SortField = 'id' | 'createdAt' | 'updatedAt' | 'grandTotalMinor'
export type SortDir = 'ASC' | 'DESC'

export interface OrdersFiltersValue {
  q: string
  statuses: string[]
  sortBy: SortField
  sortDir: SortDir
  hasTracking?: 'true' | 'false' | ''
}

export function OrdersFilters({
  value,
  onChange,
  onApply,
  onReset
}: {
  value: OrdersFiltersValue
  onChange: (patch: Partial<OrdersFiltersValue>) => void
  onApply: () => void
  onReset: () => void
}) {
  const ALL = '__ALL__'

  const statusOptions = useMemo(
    () => [
      'PENDING',
      'PAID',
      'PROCESSING',
      'READY_TO_SHIP',
      'HANDED_OVER',
      'SHIPPED',
      'DELIVERED',
      'COMPLETE',
      'CUSTOMER_CANCELED',
      'MERCHANT_CANCELED',
      'TRANSIT_LACK',
      'RE_TRANSIT',
      'REFUND_REQUEST',
      'AWAITING_RETURN',
      'RECEIVE_RETURN',
      'RETURN_VERIFIED',
      'RETURN_FAIL',
      'REFUND_APPROVED',
      'REFUND_PROCESSING',
      'REFUND_SUCCESS',
      'REFUND_FAIL',
      'REFUND_RETRY'
    ],
    []
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search order id / order code…"
          value={value.q}
          onChange={(e) => onChange({ q: e.target.value })}
        />
        <Button onClick={onApply}>Search</Button>
        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="h-4 w-4 mr-1" /> Clear
        </Button>
        <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <MultiSelect
          value={value.statuses}
          onValueChange={(statuses) => onChange({ statuses })}
        >
          <MultiSelectTrigger>
            <MultiSelectValue placeholder="Filter by statuses..." />
          </MultiSelectTrigger>
          <MultiSelectContent>
            {statusOptions.map((status) => (
              <MultiSelectItem key={status} value={status}>
                {status}
              </MultiSelectItem>
            ))}
          </MultiSelectContent>
        </MultiSelect>

        <Select
          value={value.hasTracking === '' ? ALL : value.hasTracking}
          onValueChange={(next) =>
            onChange({
              hasTracking: next === ALL ? '' : (next as 'true' | 'false')
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Tracking filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All</SelectItem>
            <SelectItem value="true">With tracking</SelectItem>
            <SelectItem value="false">No tracking</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Select
            value={value.sortBy}
            onValueChange={(next) => onChange({ sortBy: next as SortField })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort field" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Created</SelectItem>
              <SelectItem value="updatedAt">Updated</SelectItem>
              <SelectItem value="id">ID</SelectItem>
              <SelectItem value="grandTotalMinor">Grand total</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={value.sortDir}
            onValueChange={(next) => onChange({ sortDir: next as SortDir })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DESC">Descending</SelectItem>
              <SelectItem value="ASC">Ascending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
