"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { ProductTable } from "./productTable"
import { Product } from "@/types/props/productProp"

interface ProductListProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
}

export function ProductList({ products, onEdit, onDelete }: ProductListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Inventory</CardTitle>
        <CardDescription>
          Manage your products and track inventory levels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ProductTable products={products} onEdit={onEdit} onDelete={onDelete} />
      </CardContent>
    </Card>
  )
}
