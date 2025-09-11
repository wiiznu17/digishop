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
import { Edit, Trash2, Package, Image as ImageIcon, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { ProductListItem } from "../../types/props/productProp"

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
}

export function ProductTable({
  products,
  onEdit,
  onDelete
}: ProductTableProps) {
  const router = useRouter()

  const handleViewDetail = (product: ProductListItem) => {
    // ใช้ route ที่ถูกต้องตามโครงสร้างของคุณ
    router.push(`/products/${product.uuid}`)
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>In Stock</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Images</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => {
          const mainImg =
            product.images?.find((i) => i.isMain) || product.images?.[0]
          return (
            <TableRow key={product.uuid}>
              <TableCell>
                <div className="flex items-center gap-3">
                  {mainImg?.url ? (
                    <img
                      src={mainImg.url}
                      alt={product.name}
                      className="h-12 w-12 rounded-lg object-cover border cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleViewDetail(product)}
                    />
                  ) : (
                    <div
                      className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => handleViewDetail(product)}
                    >
                      <Package className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <div
                      className="font-medium cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => handleViewDetail(product)}
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
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    product.status === "ACTIVE"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                      : product.status === "OUT_OF_STOCK"
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                  }`}
                >
                  {product.status}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{product.images?.length || 0}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetail(product)}
                    title="View Details"
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
                    onClick={() => {
                      if (product.uuid) onDelete(product.uuid)
                    }}
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
