"use client"

import { useEffect, useMemo, useState } from "react"

export type ProductFormValues = {
  name: string
  categoryUuid?: string
  description?: string
  // ถ้าอยากใส่ฟิลด์อื่น เช่น status, slug, seo ฯลฯ เติมได้เลย
}

type ImagePreview = {
  file?: File
  url: string // preview url หรือ url ที่มาจาก server
  uuid?: string // ถ้าเป็นรูปเดิมจาก server
  isMain?: boolean
  sortOrder?: number
}

type Props = {
  initial?: Partial<ProductFormValues>
  initialImages?: Array<{
    uuid: string
    url: string
    fileName: string
    isMain: boolean
    sortOrder: number
  }>
  categories?: Array<{ uuid: string; name: string }>
  submitting?: boolean
  submitLabel?: string // "Create" | "Save"
  onSubmit: (data: ProductFormValues, files: File[]) => Promise<void>
}

export default function ProductForm({
  initial,
  initialImages,
  categories = [],
  submitting = false,
  submitLabel = "Save",
  onSubmit
}: Props) {
  const [values, setValues] = useState<ProductFormValues>({
    name: initial?.name || "",
    categoryUuid: initial?.categoryUuid || "",
    description: initial?.description || ""
  })

  const [images, setImages] = useState<ImagePreview[]>(
    (initialImages || [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((it) => ({
        uuid: it.uuid,
        url: it.url,
        isMain: it.isMain,
        sortOrder: it.sortOrder
      }))
  )

  const newFiles = useMemo(
    () => images.filter((i) => i.file).map((i) => i.file!) as File[],
    [images]
  )

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
  }

  const handleAddFiles = (files: FileList | null) => {
    if (!files || !files.length) return
    const arr = Array.from(files)
    const previews: ImagePreview[] = arr.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
      isMain: false,
      sortOrder: images.length
    }))
    setImages((prev) => {
      const next = [...prev, ...previews]
      // ถ้ายังไม่มี main เลย ตั้งไฟล์ใหม่อันแรกเป็น main
      if (!next.some((x) => x.isMain) && next.length > 0) next[0].isMain = true
      // รีเซ็ต sortOrder ให้ต่อเนื่อง
      return next.map((x, i) => ({ ...x, sortOrder: i }))
    })
  }

  const setMain = (idx: number) => {
    setImages((prev) => prev.map((img, i) => ({ ...img, isMain: i === idx })))
  }

  const removeImage = (idx: number) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== idx)
      // ถ้ารูป main โดนลบ ตั้งตัวแรกที่เหลือเป็น main
      if (!next.some((x) => x.isMain) && next.length > 0) next[0].isMain = true
      return next.map((x, i) => ({ ...x, sortOrder: i }))
    })
  }

  const moveImage = (from: number, to: number) => {
    setImages((prev) => {
      const cp = [...prev]
      const sp = cp.splice(from, 1)[0]
      cp.splice(to, 0, sp)
      return cp.map((x, i) => ({ ...x, sortOrder: i }))
    })
  }

  const submit = async () => {
    await onSubmit(values, newFiles)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            name="name"
            value={values.name}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2"
            placeholder="Product name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            name="categoryUuid"
            value={values.categoryUuid || ""}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2"
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.uuid} value={c.uuid}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={values.description || ""}
            onChange={handleChange}
            rows={4}
            className="w-full rounded border px-3 py-2"
            placeholder="Short description"
          />
        </div>
      </div>

      {/* Images */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Images</div>
          <label className="text-sm underline cursor-pointer">
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleAddFiles(e.target.files)}
            />
            Add images
          </label>
        </div>

        {images.length === 0 && (
          <div className="text-sm text-neutral-500">No images</div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div
              key={(img.uuid || img.url) + idx}
              className="relative rounded border p-2"
            >
              <img src={img.url} className="w-full h-32 object-cover rounded" />
              <div className="mt-2 flex items-center justify-between text-xs">
                <button
                  className={`px-2 py-1 rounded border ${img.isMain ? "bg-black text-white" : ""}`}
                  onClick={() => setMain(idx)}
                >
                  {img.isMain ? "Main" : "Set main"}
                </button>
                <div className="space-x-1">
                  <button
                    className="px-2 py-1 rounded border"
                    disabled={idx === 0}
                    onClick={() => moveImage(idx, idx - 1)}
                  >
                    ↑
                  </button>
                  <button
                    className="px-2 py-1 rounded border"
                    disabled={idx === images.length - 1}
                    onClick={() => moveImage(idx, idx + 1)}
                  >
                    ↓
                  </button>
                  <button
                    className="px-2 py-1 rounded border"
                    onClick={() => removeImage(idx)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <button
          disabled={submitting}
          onClick={submit}
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        >
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </div>
  )
}
