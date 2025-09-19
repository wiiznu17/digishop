"use client"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Edit,
  Trash2,
  Package,
  Image as ImageIcon,
  Eye,
  Info
} from "lucide-react"
import type { ProductListItem } from "../../types/props/productProp"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "../ui/tooltip"

function formatTHBFromMinor(minor?: number | null) {
  const m = typeof minor === "number" ? minor : 0
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB"
  }).format(m / 100)
}

interface ProductTableProps {
  products: ProductListItem[]
  onEdit: (product: ProductListItem) => void
  onDelete: (uuid: string) => void
  onQuickView: (product: ProductListItem) => void

  /** bulk selection */
  selectedUuids: Set<string>
  onToggleRow: (uuid: string, checked: boolean) => void
  onToggleAllOnPage: (uuids: string[], checked: boolean) => void

  /** ซ่อน/แสดงคอลัมน์ checkbox */
  showSelection?: boolean
}

// บาง BE จะส่ง field นับรูปมาใหม่ — กำหนด type เฉพาะเพื่อเลี่ยง any
type ProductWithImageCount = ProductListItem & {
  totalImageCount?: number
  imageCount?: number
}

export function ProductTable({
  products,
  onEdit,
  onDelete,
  onQuickView,
  selectedUuids,
  onToggleRow,
  onToggleAllOnPage,
  showSelection = false
}: ProductTableProps) {
  const allUuidsOnPage = products.map((p) => p.uuid)
  const allOnPageSelected =
    showSelection &&
    products.length > 0 &&
    products.every((p) => selectedUuids.has(p.uuid))

  const statusBadgeClass = (s: string) =>
    s === "ACTIVE"
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"

  const approvalBadgeClass = (a: string) =>
    a === "APPROVED"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300"
      : a === "PENDING"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" // REJECT
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showSelection && (
            <TableHead className="w-[44px]">
              <input
                type="checkbox"
                aria-label="Select all"
                checked={allOnPageSelected}
                onChange={(e) =>
                  onToggleAllOnPage(allUuidsOnPage, e.currentTarget.checked)
                }
              />
            </TableHead>
          )}
          <TableHead>Product</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>In Stock</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Approval</TableHead>
          <TableHead>Images</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {products.map((product) => {
          const mainImg =
            product.images?.find((i) => i.isMain) || product.images?.[0]

          const withCount: ProductWithImageCount = product
          const imageCount =
            withCount.totalImageCount ??
            withCount.imageCount ??
            product.images?.length ??
            0

          const rowChecked = selectedUuids.has(product.uuid)

          return (
            <TableRow key={product.uuid}>
              {showSelection && (
                <TableCell>
                  <input
                    type="checkbox"
                    aria-label={`Select ${product.name}`}
                    checked={rowChecked}
                    onChange={(e) =>
                      onToggleRow(product.uuid, e.currentTarget.checked)
                    }
                  />
                </TableCell>
              )}

              <TableCell>
                <div className="flex items-center gap-3">
                  {mainImg?.url ? (
                    <img
                      src={mainImg.url}
                      alt={product.name}
                      className="h-12 w-12 rounded-lg object-cover border cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => onQuickView(product)}
                    />
                  ) : (
                    <div
                      className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => onQuickView(product)}
                    >
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <div
                      className="font-medium cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => onQuickView(product)}
                    >
                      {product.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate max-w-xs">
                      {product.description || "-"}
                    </div>
                    <div className="text-[10px] text-neutral-500">
                      UUID: {product.uuid}
                    </div>
                  </div>
                </div>
              </TableCell>

              <TableCell>{product.category?.name || "-"}</TableCell>

              <TableCell>{formatTHBFromMinor(product.minPriceMinor)}</TableCell>

              <TableCell>
                <span className={!product.totalStock ? "text-destructive" : ""}>
                  {product.totalStock ?? 0}
                </span>
              </TableCell>

              {/* Product Status */}
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${statusBadgeClass(product.status)}`}
                >
                  {product.status}
                </span>
              </TableCell>

              {/* Approval Status + Reason */}
              <TableCell>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${approvalBadgeClass(product.reqStatus)}`}
                  >
                    {product.reqStatus}
                  </span>
                  {product.reqStatus === "REJECT" && product.rejectReason && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="p-1 rounded hover:bg-muted"
                            aria-label="Reject reason"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs leading-snug">
                            {product.rejectReason}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-1">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{imageCount}</span>
                </div>
              </TableCell>

              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onQuickView(product)}
                    title="Quick View"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(product)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => product.uuid && onDelete(product.uuid)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
