'use client'

import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'
import { ProductTable } from './productTable'
import type { ProductListItem } from '@/types/props/productProp'
import { ProductFilters, type ProductFilterState } from './productFilters'
import type { CategoryDto } from '@/utils/requestUtils/requestProductUtils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useMemo, useState } from 'react'

type ProductListProps = {
  products: ProductListItem[]
  onEdit: (product: ProductListItem) => void
  onDelete: (uuid: string) => void
  onQuickView: (product: ProductListItem) => void
  filters: ProductFilterState
  onFiltersChange: (patch: Partial<ProductFilterState>) => void
  onApplyFilters: () => void
  onResetFilters: () => void
  categories: CategoryDto[]
  selectMode: boolean
  selectedUuids: string[]
  bulkStatusChoice: string
  applying: boolean
  onSelectModeChange: (enabled: boolean) => void
  onBulkStatusChoiceChange: (status: string) => void
  onToggleRow: (uuid: string, checked: boolean) => void
  onToggleAllOnPage: (uuids: string[], checked: boolean) => void
  onClearSelection: () => void
  onApplyBulkStatus: () => void
  onApplyBulkDelete: () => void
}

export function ProductList({
  products,
  onEdit,
  onDelete,
  onQuickView,
  filters,
  onFiltersChange,
  onApplyFilters,
  onResetFilters,
  categories,
  selectMode,
  selectedUuids,
  bulkStatusChoice,
  applying,
  onSelectModeChange,
  onBulkStatusChoiceChange,
  onToggleRow,
  onToggleAllOnPage,
  onClearSelection,
  onApplyBulkStatus,
  onApplyBulkDelete
}: ProductListProps) {
  const [statusOpen, setStatusOpen] = useState(false)
  const selectedSet = useMemo(() => new Set(selectedUuids), [selectedUuids])
  const selectedCount = selectedUuids.length

  const exitSelectionMode = () => {
    onSelectModeChange(false)
    setStatusOpen(false)
    onClearSelection()
  }

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Product Inventory</CardTitle>
            <CardDescription>
              Manage your products and track inventory levels
            </CardDescription>
          </div>

          <div className="flex gap-2">
            {!selectMode ? (
              <Button
                variant="outline"
                onClick={() => onSelectModeChange(true)}
              >
                Select
              </Button>
            ) : (
              <Button variant="outline" onClick={exitSelectionMode}>
                Cancel
              </Button>
            )}

            <Button asChild className="gap-2">
              <Link href="/products/new">
                <Plus className="h-4 w-4" />
                Add new product
              </Link>
            </Button>
          </div>
        </div>

        <ProductFilters
          value={filters}
          onChange={onFiltersChange}
          onApply={onApplyFilters}
          onReset={onResetFilters}
          categories={categories}
        />
      </CardHeader>

      <CardContent className="space-y-3">
        {selectMode && (
          <div className="flex flex-col gap-2 border rounded-md p-3 bg-muted/30 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              Selected: <span className="font-medium">{selectedCount}</span>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm">Set status:</span>
                <Select
                  value={bulkStatusChoice}
                  open={statusOpen}
                  onOpenChange={setStatusOpen}
                  onValueChange={(value) => {
                    onBulkStatusChoiceChange(value)
                    setStatusOpen(false)
                  }}
                  disabled={selectedCount === 0 || applying}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Choose status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="DRAFT">DRAFT</SelectItem>
                    <SelectItem value="OUT_OF_STOCK">OUT_OF_STOCK</SelectItem>
                    <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={onApplyBulkStatus}
                  disabled={selectedCount === 0 || applying}
                >
                  {applying ? 'Applying...' : 'Apply'}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearSelection}
                  disabled={selectedCount === 0 || applying}
                >
                  Clear
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onApplyBulkDelete}
                  disabled={selectedCount === 0 || applying}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}

        <ProductTable
          products={products}
          onEdit={onEdit}
          onDelete={onDelete}
          onQuickView={onQuickView}
          selectedUuids={selectedSet}
          onToggleRow={onToggleRow}
          onToggleAllOnPage={onToggleAllOnPage}
          showSelection={selectMode}
        />
      </CardContent>
    </Card>
  )
}
