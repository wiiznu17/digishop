// apps/portal/src/components/common/pagination.tsx
"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

type Props = {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (n: number) => void
  showItemsPerPageSelector?: boolean
}

export function AdminPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPageSelector = false
}: Props) {
  return (
    <div className="flex items-center justify-between pt-2">
      <div className="text-sm text-muted-foreground">
        Total:&nbsp;<span className="font-medium">{totalItems}</span>
      </div>

      <div className="flex items-center gap-2">
        {showItemsPerPageSelector && onItemsPerPageChange && (
          <Select
            value={String(itemsPerPage)}
            onValueChange={(v) => onItemsPerPageChange(Number(v))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
          >
            Prev
          </Button>
          <div className="text-sm">
            Page <span className="font-medium">{currentPage}</span> /{" "}
            {Math.max(1, totalPages)}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
