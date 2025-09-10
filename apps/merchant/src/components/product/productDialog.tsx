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
import { ImageUpload, ImageLike } from "./imageUpload"
import PRODUCT_STATUS_MASTER from "@/constants/master/productStatusMaster.json"

type EditingProduct = {
  uuid?: string
  name: string
  description?: string | null
  status: string
  category?: { uuid: string; name: string } | null
  images?: Array<{
    uuid: string
    url: string
    fileName: string
    isMain: boolean
    sortOrder: number
  }>
}

export type CreateProductRequest = {
  name: string
  categoryUuid?: string
  description?: string
  status?: string
}

export type UpdateProductRequest = CreateProductRequest

interface ProductDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editingProduct: EditingProduct | null
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
  const [name, setName] = useState("")
  const [categoryUuid, setCategoryUuid] = useState<string>("")
  const [status, setStatus] = useState<string>("DRAFT")
  const [description, setDescription] = useState<string>("")
  const [uiImages, setUiImages] = useState<ImageLike[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // โหลดค่าเดิม
  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name || "")
      setCategoryUuid(editingProduct.category?.uuid || "")
      setStatus(editingProduct.status || "DRAFT")
      setDescription(editingProduct.description || "")
      setUiImages(
        (editingProduct.images || [])
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((it) => ({
            uuid: it.uuid,
            url: it.url,
            fileName: it.fileName,
            isMain: it.isMain,
            sortOrder: it.sortOrder
          }))
      )
    } else {
      resetForm()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingProduct])

  const resetForm = () => {
    setName("")
    setCategoryUuid("")
    setStatus("DRAFT")
    setDescription("")
    setUiImages([])
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsSubmitting(true)
    try {
      const payload: CreateProductRequest = {
        name,
        categoryUuid: categoryUuid || undefined,
        description: description || undefined,
        status
      }

      // แปลง blob preview → File เฉพาะรูปใหม่
      const files: File[] = []
      for (const img of uiImages) {
        if (img.url.startsWith("blob:")) {
          const resp = await fetch(img.url)
          const blob = await resp.blob()
          files.push(new File([blob], img.fileName, { type: blob.type }))
        }
      }

      await onSubmit(payload, files)
      resetForm()
    } catch (err) {
      console.error("Error saving product:", err)
      alert("Error to saving product")
    } finally {
      setIsSubmitting(false)
    }
  }

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
            {/* รูปภาพ: local mode (ยังไม่ยิง API จนกว่าจะ submit) */}
            <ImageUpload
              mode="local"
              images={uiImages}
              onImagesChange={setUiImages}
              maxImages={10}
            />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                {/* NOTE: ของจริงควรโหลด categories จาก API แล้ว map เป็น <SelectItem /> */}
                <Select
                  value={categoryUuid}
                  onValueChange={(v) => setCategoryUuid(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* ตัวอย่างเปล่า ๆ ไว้รอเชื่อม requester categories */}
                    <SelectItem value="">(None)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.values(PRODUCT_STATUS_MASTER) as {
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

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
