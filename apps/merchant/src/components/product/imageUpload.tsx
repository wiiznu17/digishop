'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  X,
  Upload,
  Image as ImageIcon,
  Star,
  Crop as CropIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import {
  deleteProductImageRequester,
  updateProductImageRequester,
  reorderProductImagesRequester
} from '@/utils/requestUtils/requestProductUtils'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'

// รองรับทั้ง id/uuid
export type ImageLike = {
  uuid?: string
  id?: string
  url: string
  fileName: string
  isMain?: boolean
  sortOrder?: number
}

interface ImageUploadProps {
  images: ImageLike[]
  onImagesChange: (images: ImageLike[]) => void
  maxImages?: number

  mode?: 'local' | 'server'
  productUuid?: string

  cropAspect?: number
  variant?: 'default' | 'compact'
}

export function ImageUpload({
  images,
  onImagesChange,
  maxImages = 5,
  mode = 'local',
  productUuid,
  cropAspect = 1,
  variant = 'default'
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileInputKey, setFileInputKey] = useState(0) // recreate input ทุกครั้งหลังเลือกไฟล์

  // สำหรับ compact: กำลังจะเปลี่ยนภาพ index ไหน
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null)

  const isBlob = (u: string) => u.startsWith('blob:')

  // ===== Crop =====
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
  const onCropComplete = (_: Area, areaPixels: Area) =>
    setCroppedAreaPixels(areaPixels)

  async function handleCropConfirm() {
    if (cropIndex == null || !croppedAreaPixels) {
      setCropOpen(false)
      return
    }
    const img = images[cropIndex]
    try {
      const { blob, mime } = await getCroppedBlob(img.url, croppedAreaPixels)
      const newUrl = URL.createObjectURL(blob)
      const ext = mime.includes('png')
        ? 'png'
        : mime.includes('webp')
          ? 'webp'
          : 'jpg'
      const base = img.fileName.replace(/\.[^.]+$/, '')
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
      onImagesChange(next.map((x, i) => ({ ...x, sortOrder: i })))
    } catch (e) {
      console.error('crop failed', e)
      alert('Crop failed')
    } finally {
      setCropOpen(false)
      setCropIndex(null)
    }
  }

  async function getCroppedBlob(
    src: string,
    area: Area
  ): Promise<{ blob: Blob; mime: string }> {
    const imgEl = await loadImage(src)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.floor(area.width))
    canvas.height = Math.max(1, Math.floor(area.height))
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')

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

    let mime = 'image/jpeg'
    try {
      const resp = await fetch(src)
      const b = await resp.blob()
      if (b.type) mime = b.type
    } catch {
      /* ignore */
    }

    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob error'))),
        mime,
        0.92
      )
    )
    return { blob, mime }
  }

  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = (e) => reject(e)
      img.src = src
    })
  }

  // ===== File pick =====
  const triggerPick = (opts?: { replaceAt?: number | null }) => {
    setReplaceIndex(opts?.replaceAt ?? null)
    // recreate input เพื่อกัน onChange เงียบเมื่อเลือกไฟล์เดิม
    setFileInputKey((k) => k + 1)
    // ใช้ setTimeout เล็กน้อยเพื่อให้ input ถูก mount ใหม่ก่อน click
    setTimeout(() => fileInputRef.current?.click(), 0)
  }

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const chosen = variant === 'compact' ? [files[0]] : Array.from(files)
    const willHave =
      replaceIndex != null ? images.length : images.length + chosen.length
    if (willHave > maxImages) {
      alert(`You can maximum upload ${maxImages} pictures`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setUploading(true)
    try {
      const newThumbs: ImageLike[] = []
      for (const file of chosen) {
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} Not image file`)
          continue
        }
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} File size is more than 5MB`)
          continue
        }
        const previewUrl = URL.createObjectURL(file)
        newThumbs.push({
          url: previewUrl,
          fileName: file.name
        })
      }

      if (variant === 'compact') {
        // replace ที่ index ระบุ
        const idx = replaceIndex ?? (images.length ? 0 : null)
        if (idx == null) {
          // ไม่มีรูปเดิม → เพิ่มใหม่
          onImagesChange(
            [...images, ...newThumbs.slice(0, 1)].map((img, i) => ({
              ...img,
              isMain: i === 0 ? true : img.isMain,
              sortOrder: i
            }))
          )
        } else if (newThumbs[0]) {
          const next = images.map((im, i) =>
            i === idx
              ? {
                  ...newThumbs[0],
                  // preserve บาง flag จากภาพเดิมไว้
                  isMain: im.isMain
                }
              : im
          )
          onImagesChange(next.map((x, i) => ({ ...x, sortOrder: i })))
        }
      } else {
        // เพิ่มต่อท้าย (default)
        onImagesChange(
          [...images, ...newThumbs].map((img, idx) => ({
            ...img,
            isMain: idx === 0 ? true : img.isMain,
            sortOrder: idx
          }))
        )
      }
    } catch (err) {
      console.error('Error processing files:', err)
      alert('Error to processing files')
    } finally {
      setUploading(false)
      setReplaceIndex(null)
      // reset input value + recreate key กันเลือกไฟล์เดิมแล้วไม่ยิง onChange
      if (fileInputRef.current) fileInputRef.current.value = ''
      setFileInputKey((k) => k + 1)
    }
  }

  // ===== Mutations (server) =====
  const removeImage = async (index: number, e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()

    const img = images[index]
    const imageUuid = img.uuid ?? img.id

    if (mode === 'server' && productUuid && imageUuid && !isBlob(img.url)) {
      try {
        await deleteProductImageRequester(productUuid, imageUuid)
      } catch (e) {
        console.error('Error deleting image from server:', e)
        alert('Error deleting image')
        return
      }
    }

    const updated = images.filter((_, i) => i !== index)
    if (img.isMain && updated.length > 0) updated[0].isMain = true
    onImagesChange(updated.map((x, i) => ({ ...x, sortOrder: i })))

    if (mode === 'server' && productUuid) {
      const orders = updated
        .filter((x) => x.uuid)
        .map((x, i) => ({ imageUuid: x.uuid!, sortOrder: i }))
      if (orders.length) {
        try {
          await reorderProductImagesRequester(productUuid, orders)
        } catch (e) {
          console.error('reorder after delete failed:', e)
        }
      }
    }
  }

  const setMainImage = async (index: number, e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()

    const updated = images.map((img, i) => ({ ...img, isMain: i === index }))
    onImagesChange(updated)

    if (mode === 'server' && productUuid) {
      const selected = updated[index]
      const imageUuid = selected.uuid ?? selected.id
      if (imageUuid && !isBlob(selected.url)) {
        try {
          await updateProductImageRequester(productUuid, imageUuid, {
            isMain: true
          })
        } catch (e) {
          console.error('Error setting main image on server:', e)
          alert('Error setting main image')
        }
      }
    }
  }

  const moveImage = async (from: number, to: number, e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()

    if (to < 0 || to >= images.length) return
    const next = [...images]
    const sp = next.splice(from, 1)[0]
    next.splice(to, 0, sp)
    const re = next.map((x, i) => ({ ...x, sortOrder: i }))
    onImagesChange(re)

    if (mode === 'server' && productUuid) {
      const orders = re
        .filter((x) => x.uuid && !isBlob(x.url))
        .map((x) => ({ imageUuid: x.uuid!, sortOrder: x.sortOrder ?? 0 }))
      if (orders.length) {
        try {
          await reorderProductImagesRequester(productUuid, orders)
        } catch (e) {
          console.error('Error reordering on server:', e)
        }
      }
    }
  }

  // ===== Helpers: ตรวจว่าคลิกมาจากปุ่มควบคุมบนภาพหรือไม่ =====
  const isFromCtrl = (el: EventTarget | null) =>
    !!(el && (el as HTMLElement).closest('[data-imgui="ctrl"]'))

  // ===== Preview (Lightbox) =====
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState<number>(0)

  const openPreviewAt = (index: number) => {
    setPreviewIndex(index)
    setPreviewOpen(true)
  }
  const nextPreview = () =>
    setPreviewIndex((i) => (i + 1) % Math.max(1, images.length))
  const prevPreview = () =>
    setPreviewIndex(
      (i) => (i - 1 + Math.max(1, images.length)) % Math.max(1, images.length)
    )

  // ===== UI Helpers =====
  const actionBtnClass =
    'pointer-events-auto rounded-full transition-all duration-150 ease-out hover:scale-110 hover:shadow-lg hover:ring-2 hover:ring-white/80'

  // ===== UI (Compact) =====
  const CompactUI = () => {
    const hasImage = images.length > 0
    return (
      <div
        className="relative w-full h-full rounded-md border bg-muted/30 overflow-hidden group"
        onClick={(e) => {
          if (!hasImage) return
          if (isFromCtrl(e.target)) return // กดปุ่มควบคุม → ไม่เปิด preview
          openPreviewAt(0)
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && hasImage) openPreviewAt(0)
        }}
      >
        {/* input ไฟล์ — แยกออก ไม่ห่อด้วย label */}
        <Input
          key={fileInputKey}
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={false}
          onChange={handleFileSelect}
          className="hidden"
        />

        {!hasImage ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              triggerPick()
            }}
            className="absolute inset-0 w-full h-full grid place-content-center gap-1 text-muted-foreground"
            title="Add"
          >
            <ImageIcon className="h-7 w-7 mx-auto" />
            <span className="text-xs">Add</span>
          </button>
        ) : (
          <div className="relative w-full h-full">
            <img
              src={images[0].url}
              alt={images[0].fileName}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            />
            {/* overlay: ปิด pointer กับพื้นหลัง แต่เปิดให้กับปุ่ม */}
            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className={actionBtnClass}
                title="Crop"
                data-imgui="ctrl"
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  openCrop(0)
                }}
              >
                <CropIcon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className={actionBtnClass}
                title="Remove"
                data-imgui="ctrl"
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onClick={(e) => removeImage(0, e)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ===== UI (Default) =====
  const DefaultUI = () => (
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
            onClick={() => triggerPick()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Add image'}
          </Button>
        )}
      </div>

      <Input
        key={fileInputKey}
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
            onClick={() => triggerPick()}
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
              <div
                className="aspect-square relative cursor-zoom-in"
                onClick={(e) => {
                  // เปิด preview เฉพาะคลิกพื้นหลัง ไม่ใช่คลิกปุ่ม overlay
                  if (e.target === e.currentTarget) openPreviewAt(index)
                }}
              >
                <img
                  src={image.url}
                  alt={image.fileName}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                />

                {image.isMain && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs flex items-center">
                    <Star className="h-3 w-3 mr-1" />
                    Main
                  </div>
                )}

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    title="Crop"
                    className={actionBtnClass}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      openCrop(index)
                    }}
                  >
                    <CropIcon className="h-4 w-4" />
                  </Button>
                  {!image.isMain && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      title="Set as main"
                      className={actionBtnClass}
                      onClick={(e) => setMainImage(index, e)}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    title="Remove"
                    className={actionBtnClass}
                    onClick={(e) => removeImage(index, e)}
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
                    onClick={(e) => moveImage(index, index - 1, e)}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    disabled={index === images.length - 1}
                    onClick={(e) => moveImage(index, index + 1, e)}
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

  return (
    <>
      {variant === 'compact' ? <CompactUI /> : <DefaultUI />}

      {/* ===== Crop Dialog ===== */}
      <Dialog open={cropOpen} onOpenChange={setCropOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            {/* A11y: Radix ต้องมี DialogTitle */}
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

      {/* ===== Preview (Lightbox) ===== */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[70vw] lg:max-w-[60vw] p-0 overflow-hidden">
          {/* A11y: ต้องมี DialogTitle (ซ่อนด้วย sr-only) */}
          <DialogHeader>
            <DialogTitle className="sr-only">Image preview</DialogTitle>
          </DialogHeader>

          {/* ปุ่มปิดสีแดง มุมขวาบน */}
          <button
            type="button"
            aria-label="Close preview"
            onClick={() => setPreviewOpen(false)}
            className="absolute right-3 top-3 z-50 inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="relative bg-black">
            {images[previewIndex] && (
              <img
                src={images[previewIndex].url}
                alt={images[previewIndex].fileName}
                className="max-h-[80vh] w-full object-contain"
              />
            )}

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                  onClick={prevPreview}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                  onClick={nextPreview}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          <div className="px-4 py-2 text-sm text-muted-foreground truncate">
            {images[previewIndex]?.fileName}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
