// apps/merchant/src/components/product/imageUpload.tsx
"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  X,
  Upload,
  Image as ImageIcon,
  Star,
  Crop as CropIcon
} from "lucide-react"
import {
  deleteProductImageRequester,
  updateProductImageRequester,
  reorderProductImagesRequester
} from "@/utils/requestUtils/requestProductUtils"
import Cropper from "react-easy-crop"
import type { Area } from "react-easy-crop"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"

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

  /** อัตราส่วนการครอป (เช่น 1 สำหรับ 1:1, 4/3, 3/2) */
  cropAspect?: number
}

export function ImageUpload({
  images,
  onImagesChange,
  maxImages = 5,
  mode = "local",
  productUuid,
  cropAspect = 1
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isBlob = (u: string) => u.startsWith("blob:")

  // ===== Crop states =====
  const [cropOpen, setCropOpen] = useState(false)
  const [cropIndex, setCropIndex] = useState<number | null>(null)
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState<number>(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const openCrop = (index: number) => {
    setCropIndex(index)
    setCropOpen(true)
    setZoom(1)
    setCrop({ x: 0, y: 0 })
    setCroppedAreaPixels(null)
  }

  const onCropComplete = (_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels)
  }

  async function handleCropConfirm() {
    if (cropIndex == null || !croppedAreaPixels) {
      setCropOpen(false)
      return
    }
    const img = images[cropIndex]
    try {
      const { blob, mime } = await getCroppedBlob(img.url, croppedAreaPixels)
      const newUrl = URL.createObjectURL(blob)

      // ตั้งชื่อใหม่พ่วง -cropped
      const ext = mime.includes("png")
        ? "png"
        : mime.includes("webp")
          ? "webp"
          : "jpg"
      const base = img.fileName.replace(/\.[^.]+$/, "")
      const newName = `${base}-cropped-${Date.now()}.${ext}`

      const next = images.map((it, i) =>
        i === cropIndex
          ? {
              ...it,
              url: newUrl,
              fileName: newName,
              uuid: undefined,
              id: undefined
            }
          : it
      )
      // คงลำดับด้วยการ map index -> sortOrder
      onImagesChange(next.map((x, i) => ({ ...x, sortOrder: i })))
    } catch (e) {
      console.error("crop failed", e)
      alert("Crop failed")
    } finally {
      setCropOpen(false)
      setCropIndex(null)
    }
  }

  // helper: โหลดรูป + ครอปลง canvas แล้วคืน blob
  async function getCroppedBlob(
    src: string,
    area: Area
  ): Promise<{ blob: Blob; mime: string }> {
    const imgEl = await loadImage(src)
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.floor(area.width))
    canvas.height = Math.max(1, Math.floor(area.height))
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas not supported")

    // ป้องกัน CORS
    // (img.crossOrigin ถูกตั้งไว้ใน loadImage แล้ว ถ้าเป็น blob: จะไม่กระทบ)
    ctx.drawImage(
      imgEl,
      area.x,
      area.y,
      area.width,
      area.height,
      0,
      0,
      canvas.width,
      canvas.height
    )

    // พยายามเดา mime เดิม
    let mime = "image/jpeg"
    try {
      const resp = await fetch(src)
      const b = await resp.blob()
      if (b.type) mime = b.type
    } catch {
      // ignore, fallback jpeg
    }

    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("toBlob error"))),
        mime,
        0.92
      )
    )
    return { blob, mime }
  }

  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      // รองรับ CORS (กรณีเป็น https)
      img.crossOrigin = "anonymous"
      img.onload = () => resolve(img)
      img.onerror = (e) => reject(e)
      img.src = src
    })
  }

  // ===== Upload/select handlers =====
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files
    if (!files) return

    if (images.length + files.length > maxImages) {
      alert(`You can maximum upload ${maxImages} pictures`)
      // ล้างค่าช่องไฟล์เพื่อเลือกใหม่ได้
      if (fileInputRef.current) fileInputRef.current.value = ""
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

  // ===== UI =====
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
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => openCrop(index)}
                    title="Crop"
                  >
                    <CropIcon className="h-4 w-4" />
                  </Button>
                  {!image.isMain && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setMainImage(index)}
                      title="Set as main"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => removeImage(index)}
                    title="Remove"
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

      {/* ===== Crop Dialog ===== */}
      <Dialog open={cropOpen} onOpenChange={setCropOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Crop image</DialogTitle>
          </DialogHeader>

          <div className="relative w-full h-[380px] rounded-md overflow-hidden bg-black/5">
            {cropIndex != null && images[cropIndex] && (
              <Cropper
                image={images[cropIndex].url}
                crop={crop}
                zoom={zoom}
                aspect={cropAspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>

          <div className="mt-4 space-y-2">
            <label className="text-xs text-muted-foreground">Zoom</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setCropOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCropConfirm}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
