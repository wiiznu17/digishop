"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus } from "lucide-react"
import {
  Product,
  ProductImage,
  ProductStatus,
  defaultProduct
} from "@/types/props/productProp"
import { ImageUpload } from "./imageUpload"
import CATEGORYMASTER from "@/constants/master/categoryMaster.json"
import PRODUCT_STATUS_MASTER from "@/constants/master/productStatusMaster.json"
import {
  CreateProductRequest,
  UpdateProductRequest
} from "@/types/requests/productRequest"
interface ProductDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editingProduct: Product | null
  onSubmit: (
    productData: CreateProductRequest | UpdateProductRequest,
    images: File[]
  ) => Promise<void>
  onReset: () => void
}

export function ProductDialog({
  isOpen,
  onOpenChange,
  editingProduct,
  onSubmit,
  onReset
}: ProductDialogProps) {
  const [formData, setFormData] = useState<Product>(defaultProduct)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImagesChange = (images: ProductImage[]) => {
    setFormData((prev) => ({ ...prev, images }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const productData: CreateProductRequest = {
        name: formData.name,
        categoryId: Number(formData.categoryId),
        price: parseFloat(formData.price).toFixed(2),
        stockQuantity: parseInt(formData.stockQuantity.toString(), 10),
        status: formData.status,
        description: formData.description
      }

      // Convert blob URLs to actual files for new images
      const imageFiles: File[] = []

      if (formData.images) {
        for (const image of formData.images) {
          // Only process new images (blob URLs)
          if (image.url.startsWith("blob:")) {
            try {
              const response = await fetch(image.url)
              const blob = await response.blob()
              const file = new File([blob], image.fileName, { type: blob.type })
              imageFiles.push(file)
            } catch (error) {
              console.error("Error converting blob to file:", error)
            }
          }
        }
      }

      await onSubmit(productData, imageFiles)
      resetForm()
    } catch (error) {
      console.error("Error saving product:", error)
      alert("Error to saving product")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({ ...defaultProduct })
  }

  // Update form when editing product changes
  useEffect(() => {
    if (editingProduct) {
      setFormData({
        ...editingProduct,
        images: editingProduct.images || []
      })
    } else {
      resetForm()
    }
  }, [editingProduct])

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={onReset}>
          <Plus className="mr-2 h-4 w-4" />
          Add product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {editingProduct ? "Edit product" : "Add new product"}
          </DialogTitle>
          <DialogDescription>
            {editingProduct
              ? "Update product detail"
              : "Fill data in form to add your product"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* รูปภาพสินค้า */}
            <ImageUpload
              images={formData.images || []}
              onImagesChange={handleImagesChange}
              maxImages={5}
              productId={formData.id}
            />

            {/* ข้อมูลพื้นฐาน */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Product name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  onValueChange={(value) =>
                    handleChange("categoryId", Number(value))
                  }
                  value={formData.categoryId.toString()}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.values(CATEGORYMASTER) as {
                        value: string
                        label: string
                      }[]
                    ).map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleChange("price", e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">Stock *</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) =>
                      handleChange("stockQuantity", e.target.value)
                    }
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  onValueChange={(value) => handleChange("status", value)}
                  value={formData.status}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(PRODUCT_STATUS_MASTER) as [
                        string,
                        { value: string; label: string }
                      ][]
                    ).map(([key, { value, label }]) => (
                      <SelectItem key={key} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Description..."
                  rows={3}
                />
              </div>
            </div>
          </form>
        </ScrollArea>

        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="submit"
            className="flex-1"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Saving..."
              : editingProduct
                ? "Update Product"
                : "Add Product"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
