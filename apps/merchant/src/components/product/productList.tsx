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
import { Plus } from "lucide-react"
import { ProductTable } from "./productTable"
import type { ProductListItem } from "@/types/props/productProp"
import { ProductFilters, type ProductFilterState } from "./productFilters"
import { CategoryDto } from "@/utils/requestUtils/requestProductUtils"

type ProductListProps = {
  products: ProductListItem[]
  onEdit: (product: ProductListItem) => void
  onDelete: (uuid: string) => void

  // ควบคุมฟิลเตอร์จากภายนอก (page.tsx)
  filters: ProductFilterState
  onFiltersChange: (patch: Partial<ProductFilterState>) => void
  onApplyFilters: () => void
  onResetFilters: () => void
  categories: CategoryDto[]
}

export function ProductList({
  products,
  onEdit,
  onDelete,
  filters,
  onFiltersChange,
  onApplyFilters,
  onResetFilters,
  categories
}: ProductListProps) {
  return (
    <Card>
      <CardHeader className="space-y-4">
        {/* หัวข้อ + ปุ่ม Add */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Product Inventory</CardTitle>
            <CardDescription>
              Manage your products and track inventory levels
            </CardDescription>
          </div>

          <Button asChild className="gap-2">
            <Link href="/products/new">
              <Plus className="h-4 w-4" />
              Add new product
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <ProductFilters
          value={filters}
          onChange={onFiltersChange}
          onApply={onApplyFilters}
          onReset={onResetFilters}
          categories={categories}
        />
      </CardHeader>

      <CardContent>
        <ProductTable products={products} onEdit={onEdit} onDelete={onDelete} />
      </CardContent>
    </Card>
  )
}
