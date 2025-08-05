"use client"

import { useEffect, useState } from "react"
import { MerchantHeader } from "@/components/dashboard-header"
import { ProductDialog } from "@/components/product/productDialog"
import { ProductList } from "@/components/product/productList"
import {
  createProductRequester,
  deleteProductRequester,
  fetchProductsRequester,
  updateProductRequester
} from "@/utils/requestUtils/requestProductUtils"
import { Product, ProductImage } from "@/types/props/productProp"
import {
  CreateProductRequest,
  UpdateProductRequest
} from "@/types/requests/productRequest"

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  useEffect(() => {
    handleFetchProducts()
  }, [])

  const handleFetchProducts = async () => {
    try {
      const response = await fetchProductsRequester()
      if (response) {
        console.log("response in product page: ", response)
        setProducts(response)
      } else {
        console.error("Failed to fetch products")
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    }
  }

  const handleSubmit = async (
    productData: CreateProductRequest | UpdateProductRequest,
    images: File[]
  ) => {
    try {
      let result

      if (editingProduct && editingProduct.id) {
        console.log("Updating product:", productData)
        console.log("Updating product:", images)
        console.log("New images:", images.length)
        result = await updateProductRequester(
          editingProduct.id,
          productData as UpdateProductRequest,
          images
        )
      } else {
        console.log("Creating product:", productData)
        console.log("Images:", images.length)
        result = await createProductRequester(
          productData as CreateProductRequest,
          images
        )
      }

      if (result) {
        await handleFetchProducts()
        resetForm()
        setIsDialogOpen(false)
      } else {
        throw new Error("Failed to save product")
      }
    } catch (error) {
      console.error("Error saving product:", error)
      alert("เกิดข้อผิดพลาดในการบันทึกสินค้า")
    }
  }

  const resetForm = () => {
    setEditingProduct(null)
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure to delete this product?")) {
      try {
        await deleteProductRequester(id)
        console.log("Product deleted successfully")
        await handleFetchProducts()
      } catch (error) {
        console.error("Error deleting product:", error)
        alert("Error to delete product")
      }
    }
  }

  return (
    <div>
      <MerchantHeader title="Products" description="Manage your product">
        <ProductDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          editingProduct={editingProduct}
          onSubmit={handleSubmit}
          onReset={resetForm}
        />
      </MerchantHeader>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <ProductList
          products={products}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  )
}
