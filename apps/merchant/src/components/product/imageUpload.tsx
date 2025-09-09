"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { X, Upload, Image as ImageIcon, Star } from "lucide-react"
import {
  deleteProductImageRequester,
  updateProductImageRequester,
  reorderProductImagesRequester
} from "@/utils/requestUtils/requestProductUtils"

// NOTE: ให้รองรับทั้งของเดิม (id) และของใหม่ (uuid)
export type ImageLike = {
  uuid?: string
  id?: string // fallback เก่า
  url: string
  fileName: string
  isMain?: boolean
  sortOrder?: number
}

interface ImageUploadProps {
  images: ImageLike[]
  onImagesChange: (images: ImageLike[]) => void
  maxImages?: number

  /** ใช้กับ API ใหม่: ทำงานแบบออฟไลน์ (local) หรือซิงก์ทันที (server) */
  mode?: "local" | "server"
  /** ใช้เฉพาะตอน mode="server" */
  productUuid?: string
}

export function ImageUpload({
  images,
  onImagesChange,
  maxImages = 5,
  mode = "local",
  productUuid
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isBlob = (u: string) => u.startsWith("blob:")

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files
    if (!files) return

    if (images.length + files.length > maxImages) {
      alert(`You can maximum upload ${maxImages} pictures`)
      return
    }

    setUploading(true)
    try {
      const newImages: ImageLike[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        if (!file.type.startsWith("image/")) {
          alert(`${file.name} Not image file`)
          continue
        }
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} File size is more than 5MB`)
          continue
        }

        const previewUrl = URL.createObjectURL(file)
        newImages.push({
          url: previewUrl,
          fileName: file.name,
          isMain: images.length === 0 && newImages.length === 0, // first becomes main locally
          sortOrder: images.length + newImages.length - 1
        })
      }

      onImagesChange(
        [...images, ...newImages].map((img, idx) => ({
          ...img,
          sortOrder: idx
        }))
      )
    } catch (err) {
      console.error("Error processing files:", err)
      alert("Error to processing files")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const removeImage = async (index: number) => {
    const img = images[index]
    const imageUuid = img.uuid ?? img.id

    // โหมด server: ถ้ามี uuid จริง และไม่ใช่ blob → ยิงลบที่เซิร์ฟเวอร์
    if (mode === "server" && productUuid && imageUuid && !isBlob(img.url)) {
      try {
        await deleteProductImageRequester(productUuid, imageUuid)
      } catch (e) {
        console.error("Error deleting image from server:", e)
        alert("Error deleting image")
        return
      }
    }

    // อัปเดต local state
    const updated = images.filter((_, i) => i !== index)
    if (img.isMain && updated.length > 0) updated[0].isMain = true
    onImagesChange(updated.map((x, i) => ({ ...x, sortOrder: i })))

    // โหมด server: sync reorder หลังลบ
    if (mode === "server" && productUuid) {
      const orders = updated
        .filter((x) => x.uuid) // เฉพาะที่มีบนเซิร์ฟเวอร์
        .map((x, i) => ({ imageUuid: x.uuid!, sortOrder: i }))
      if (orders.length) {
        try {
          await reorderProductImagesRequester(productUuid, orders)
        } catch (e) {
          console.error("reorder after delete failed:", e)
        }
      }
    }
  }

  const setMainImage = async (index: number) => {
    const updated = images.map((img, i) => ({ ...img, isMain: i === index }))
    onImagesChange(updated)

    if (mode === "server" && productUuid) {
      const selected = updated[index]
      const imageUuid = selected.uuid ?? selected.id
      if (imageUuid && !isBlob(selected.url)) {
        try {
          await updateProductImageRequester(productUuid, imageUuid, {
            isMain: true
          })
        } catch (e) {
          console.error("Error setting main image on server:", e)
          alert("Error setting main image")
        }
      }
    }
  }

  const moveImage = async (from: number, to: number) => {
    if (to < 0 || to >= images.length) return
    const next = [...images]
    const sp = next.splice(from, 1)[0]
    next.splice(to, 0, sp)
    const re = next.map((x, i) => ({ ...x, sortOrder: i }))
    onImagesChange(re)

    if (mode === "server" && productUuid) {
      const orders = re
        .filter((x) => x.uuid && !isBlob(x.url))
        .map((x) => ({ imageUuid: x.uuid!, sortOrder: x.sortOrder ?? 0 }))
      if (orders.length) {
        try {
          await reorderProductImagesRequester(productUuid, orders)
        } catch (e) {
          console.error("Error reordering on server:", e)
        }
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>
          Product image ({images.length}/{maxImages})
        </Label>
        {images.length < maxImages && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploading..." : "Add image"}
          </Button>
        )}
      </div>

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {images.length === 0 ? (
        <Card className="p-8 text-center border-2 border-dashed">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">No image upload</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            Pick image
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <Card
              key={(image.uuid || image.id || image.url) + index}
              className="relative group overflow-hidden"
            >
              <div className="aspect-square relative">
                <img
                  src={image.url}
                  alt={image.fileName}
                  className="w-full h-full object-cover"
                />

                {image.isMain && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs flex items-center">
                    <Star className="h-3 w-3 mr-1" />
                    Main
                  </div>
                )}

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!image.isMain && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setMainImage(index)}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground truncate">
                  {image.fileName}
                </p>
                <div className="space-x-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    disabled={index === 0}
                    onClick={() => moveImage(index, index - 1)}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    disabled={index === images.length - 1}
                    onClick={() => moveImage(index, index + 1)}
                  >
                    ↓
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Include file: JPG, PNG, GIF (max 5MB per picture)
      </p>
    </div>
  )
}
