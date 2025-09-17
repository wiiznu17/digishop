"use client"

import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import { ProductTable } from "./productTable"
import type { ProductListItem } from "@/types/props/productProp"
import { ProductFilters, type ProductFilterState } from "./productFilters"
import { type CategoryDto } from "@/utils/requestUtils/requestProductUtils"
import {
  bulkDeleteProductsRequester,
  bulkUpdateProductStatusRequester
} from "@/utils/requestUtils/requestProductUtils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { useMemo, useState } from "react"

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

  onBulkCompleted?: () => Promise<void> | void
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
  onBulkCompleted
}: ProductListProps) {
  // ==== selection mode ====
  const [selectMode, setSelectMode] = useState<boolean>(false)

  // ==== selection state ====
  const [selectedUuids, setSelectedUuids] = useState<Set<string>>(new Set())
  const [applying, setApplying] = useState<boolean>(false)
  const [statusChoice, setStatusChoice] = useState<string>("ACTIVE")
  const [statusOpen, setStatusOpen] = useState<boolean>(false)

  const onToggleRow = (uuid: string, checked: boolean) => {
    setSelectedUuids((prev) => {
      const next = new Set(prev)
      if (checked) next.add(uuid)
      else next.delete(uuid)
      return next
    })
  }

  const onToggleAllOnPage = (uuids: string[], checked: boolean) => {
    setSelectedUuids((prev) => {
      const next = new Set(prev)
      if (checked) uuids.forEach((id) => next.add(id))
      else uuids.forEach((id) => next.delete(id))
      return next
    })
  }

  const clearSelection = () => setSelectedUuids(new Set())

  const selectedCount = selectedUuids.size
  const selectedArray = useMemo(
    () => Array.from(selectedUuids),
    [selectedUuids]
  )

  // ==== bulk ops ====
  const applyBulkStatus = async () => {
    if (selectedCount === 0) return
    setApplying(true)
    try {
      const updated = await bulkUpdateProductStatusRequester(
        selectedArray,
        statusChoice
      )
      if (updated == null) {
        alert("Bulk update status failed")
      } else {
        clearSelection()
        await onBulkCompleted?.()
      }
    } finally {
      setApplying(false)
    }
  }

  const applyBulkDelete = async () => {
    if (selectedCount === 0) return
    const ok = confirm(`Delete ${selectedCount} selected product(s)?`)
    if (!ok) return
    setApplying(true)
    try {
      const done = await bulkDeleteProductsRequester(selectedArray)
      if (!done) {
        alert("Bulk delete failed")
      } else {
        clearSelection()
        await onBulkCompleted?.()
      }
    } finally {
      setApplying(false)
    }
  }

  const exitSelectionMode = () => {
    setSelectMode(false)
    setStatusOpen(false) // ปิด select dropdown ถ้าเปิดอยู่
    clearSelection()
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
            {/* ปุ่มเข้า/ออก selection mode */}
            {!selectMode ? (
              <Button variant="outline" onClick={() => setSelectMode(true)}>
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
        {/* ==== Bulk actions bar (เฉพาะตอน selection mode) ==== */}
        {selectMode && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border rounded-md p-3 bg-muted/30">
            <div className="text-sm">
              Selected: <span className="font-medium">{selectedCount}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm">Set status:</span>
                <Select
                  value={statusChoice}
                  open={statusOpen}
                  onOpenChange={setStatusOpen}
                  onValueChange={(v) => {
                    setStatusChoice(v)
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
                {/* <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStatusOpen(true)}
                  disabled={selectedCount === 0 || applying}
                >
                  Select
                </Button> */}
                <Button
                  size="sm"
                  onClick={applyBulkStatus}
                  disabled={selectedCount === 0 || applying}
                >
                  {applying ? "Applying..." : "Apply"}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                  disabled={selectedCount === 0 || applying}
                >
                  Clear
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={applyBulkDelete}
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
          selectedUuids={selectedUuids}
          onToggleRow={onToggleRow}
          onToggleAllOnPage={onToggleAllOnPage}
          showSelection={selectMode}
        />
      </CardContent>
    </Card>
  )
}
