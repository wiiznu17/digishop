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
import { Edit, Trash2, Package, Image as ImageIcon } from "lucide-react"
import { Product } from "@/types/props/productProp"
import CATEGORYMASTER from "@/constants/master/categoryMaster.json"

interface ProductTableProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
}

export function ProductTable({
  products,
  onEdit,
  onDelete
}: ProductTableProps) {
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
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={
                      product.images.find((img) => img.isMain)?.url ||
                      product.images[0].url
                    }
                    alt={product.name}
                    className="h-12 w-12 rounded-lg object-cover border"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-muted-foreground truncate max-w-xs">
                    {product.description}
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              {Object.values(CATEGORYMASTER).find(
                (cat) => cat.value === product.categoryId.toString()
              )?.label ?? "Unknow"}
            </TableCell>
            <TableCell>฿{product.price}</TableCell>
            <TableCell>
              <span
                className={
                  product.stockQuantity === "" ? "text-destructive" : ""
                }
              >
                {product.stockQuantity}
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
                  onClick={() => onEdit(product)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (product.id) {
                      onDelete(product.id)
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
