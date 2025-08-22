import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ItemsPerPageSelector } from "@/components/order/items-per-page-selector"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showInfo?: boolean
  totalItems?: number
  itemsPerPage?: number
  onItemsPerPageChange?: (value: number) => void
  showItemsPerPageSelector?: boolean
  itemsPerPageOptions?: number[]
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showInfo = true,
  totalItems = 0,
  itemsPerPage = 20,
  onItemsPerPageChange,
  showItemsPerPageSelector = true,
  itemsPerPageOptions = [10, 20, 50, 100]
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  console.log("Pagination Debug:", {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    startItem,
    endItem
  })

  // สร้างอาร์เรย์ของเลขหน้า
  const getPageNumbers = () => {
    const delta = 2
    const pages: (number | string)[] = []

    // ถ้ามีหน้าเดียว ให้แสดงเลขหน้า 1
    if (totalPages === 1) {
      pages.push(1)
      return pages
    }

    // ถ้าหน้าปัจจุบันอยู่ไกลจากหน้าแรก
    if (currentPage > delta + 1) {
      pages.push(1)
      if (currentPage > delta + 2) {
        pages.push("...")
      }
    }

    // หน้าปัจจุบันและหน้าใกล้เคียง
    for (
      let i = Math.max(1, currentPage - delta);
      i <= Math.min(totalPages, currentPage + delta);
      i++
    ) {
      pages.push(i)
    }

    // ถ้าหน้าปัจจุบันอยู่ไกลจากหน้าสุดท้าย
    if (currentPage < totalPages - delta) {
      if (currentPage < totalPages - delta - 1) {
        pages.push("...")
      }
      pages.push(totalPages)
    }

    return pages
  }

  // แสดง pagination เมื่อมีมากกว่า 1 หน้าหรือมี items per page selector
  const shouldShowPagination =
    totalPages > 1 || (showItemsPerPageSelector && totalItems > 0)

  if (!shouldShowPagination) return null

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex flex-col gap-4">
      {/* Info and Items Per Page Selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {showInfo && totalItems > 0 && (
          <div className="text-sm text-muted-foreground">
            แสดงรายการ {startItem.toLocaleString()}-{endItem.toLocaleString()}{" "}
            จากทั้งหมด {totalItems.toLocaleString()} รายการ
          </div>
        )}

        {showItemsPerPageSelector && onItemsPerPageChange && totalItems > 0 && (
          <ItemsPerPageSelector
            value={itemsPerPage}
            onValueChange={onItemsPerPageChange}
            options={itemsPerPageOptions}
          />
        )}
      </div>

      {/* Page Navigation - แสดงเมื่อมีมากกว่า 1 หน้า */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground sm:order-1">
            หน้า {currentPage} จาก {totalPages}
          </div>

          <div className="flex items-center justify-center space-x-2 sm:order-0">
            {/* Previous Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">ก่อนหน้า</span>
            </Button>

            {/* Page Numbers */}
            <div className="flex items-center space-x-1">
              {pageNumbers.map((page, index) => (
                <div key={`page-${index}`}>
                  {page === "..." ? (
                    <div className="flex items-center justify-center w-9 h-9">
                      <MoreHorizontal className="h-4 w-4" />
                    </div>
                  ) : (
                    <Button
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(page as number)}
                      className="w-9 h-9 p-0"
                    >
                      {page}
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Next Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onPageChange(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage >= totalPages}
              className="flex items-center gap-1"
            >
              <span className="hidden sm:inline">ถัดไป</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
