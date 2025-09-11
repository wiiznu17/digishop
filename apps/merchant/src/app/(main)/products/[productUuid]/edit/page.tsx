// apps/merchant/src/app/(main)/products/[productUuid]/edit/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { MerchantHeader } from "@/components/dashboard-header"
import { ImageUpload, type ImageLike } from "@/components/product/imageUpload"
import {
  fetchProductDetailRequester,
  updateProductRequester,
  addProductImagesRequester,
  deleteProductImageRequester,
  updateProductImageRequester,
  reorderProductImagesRequester,
  fetchCategoriesRequester,
  updateProductItemRequester,
  deleteProductItemRequester,
  type UpdateProductRequest,
  type UpdateItemPayload,
  type CategoryDto
} from "@/utils/requestUtils/requestProductUtils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import PRODUCT_STATUS_MASTER from "@/constants/master/productStatusMaster.json"

// ใช้ค่านี้เป็นตัวแทน "ไม่เลือกหมวด"
const NONE_VALUE = "none"

type ServerImageLite = {
  uuid: string
  isMain: boolean
  sortOrder: number
  fileName: string
}

type ItemBaseline = {
  uuid: string
  sku: string
  priceMinor: number
  stockQuantity: number
  isEnable: boolean
}

type ItemEdit = {
  uuid: string
  sku: string
  price: string // เป็น string (THB) เพื่อแก้ง่ายใน input
  stock: string // เป็น string เพื่อแก้ง่ายใน input
  isEnable: boolean
}

export default function EditProductPage() {
  const { productUuid } = useParams<{ productUuid: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // product fields
  const [name, setName] = useState("")
  const [categoryUuid, setCategoryUuid] = useState<string>(NONE_VALUE)
  const [status, setStatus] = useState<string>("DRAFT")
  const [description, setDescription] = useState<string>("")

  // images (UI) และรูปบนเซิร์ฟเวอร์ (ไว้คำนวณ diff)
  const [uiImages, setUiImages] = useState<ImageLike[]>([])
  const [initialServerImages, setInitialServerImages] = useState<
    ServerImageLite[]
  >([])

  // categories
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [catLoading, setCatLoading] = useState(false)

  // items
  const [itemBaselines, setItemBaselines] = useState<ItemBaseline[]>([])
  const [itemEdits, setItemEdits] = useState<ItemEdit[]>([])

  // ===== Utils =====
  const toMinor = (val: string): number => {
    const n = Number(val || 0)
    if (Number.isNaN(n) || n < 0) return 0
    return Math.round(n * 100)
  }
  const fromMinor = (minor: number): string => (minor / 100).toFixed(2)
  const toInt = (val: string): number => {
    const n = parseInt(val || "0", 10)
    if (Number.isNaN(n) || n < 0) return 0
    return n
  }

  // ===== Loaders =====
  const loadDetail = useMemo(
    () => async () => {
      setLoading(true)
      const res = await fetchProductDetailRequester(productUuid)
      setLoading(false)
      if (!res) return

      setName(res.name || "")
      setCategoryUuid(res.category?.uuid || NONE_VALUE)
      setStatus(res.status || "DRAFT")
      setDescription(res.description || "")

      // images
      const imgs = (res.images ?? [])
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((it) => ({
          uuid: it.uuid,
          url: it.url,
          fileName: it.fileName,
          isMain: it.isMain,
          sortOrder: it.sortOrder
        }))
      setUiImages(imgs)
      setInitialServerImages(
        imgs
          .filter((i): i is Required<ImageLike> => !!i.uuid)
          .map((i) => ({
            uuid: i.uuid!,
            isMain: !!i.isMain,
            sortOrder: i.sortOrder ?? 0,
            fileName: i.fileName
          }))
      )

      // items
      const baselines: ItemBaseline[] = (res.items ?? []).map((it) => ({
        uuid: it.uuid,
        sku: it.sku ?? "",
        priceMinor: it.priceMinor ?? 0,
        stockQuantity: it.stockQuantity ?? 0,
        isEnable: Boolean((it as any).isEnable ?? true)
      }))
      setItemBaselines(baselines)

      const edits: ItemEdit[] = baselines.map((b) => ({
        uuid: b.uuid,
        sku: b.sku,
        price: fromMinor(b.priceMinor),
        stock: String(b.stockQuantity),
        isEnable: b.isEnable
      }))
      setItemEdits(edits)
    },
    [productUuid]
  )

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  useEffect(() => {
    const run = async () => {
      setCatLoading(true)
      const list = await fetchCategoriesRequester()
      setCategories(list)
      setCatLoading(false)
    }
    run()
  }, [])

  // ===== Helpers =====
  const convertNewBlobsToFiles = async (
    images: ImageLike[]
  ): Promise<File[]> => {
    const files: File[] = []
    for (const img of images) {
      // เป็น “ไฟล์ใหม่” ถ้ายังไม่มี uuid และ url เป็น blob:
      if (!img.uuid && img.url.startsWith("blob:")) {
        const resp = await fetch(img.url)
        const blob = await resp.blob()
        files.push(new File([blob], img.fileName, { type: blob.type }))
      }
    }
    return files
  }

  const serverUuidsInitial = useMemo(
    () => new Set(initialServerImages.map((i) => i.uuid)),
    [initialServerImages]
  )

  const patchItem = (uuid: string, patch: Partial<ItemEdit>) => {
    setItemEdits((prev) =>
      prev.map((r) => (r.uuid === uuid ? { ...r, ...patch } : r))
    )
  }

  const removeItem = async (uuid: string) => {
    if (!confirm("Delete this SKU?")) return
    await deleteProductItemRequester(productUuid, uuid)
    // รีเฟรชรายการหลังลบ
    setItemBaselines((b) => b.filter((x) => x.uuid !== uuid))
    setItemEdits((e) => e.filter((x) => x.uuid !== uuid))
  }

  // ===== Save =====
  const handleSave = async () => {
    if (!name.trim()) {
      alert("Please fill product name")
      return
    }

    // validate duplicate SKU (trim + case-insensitive)
    const seen = new Set<string>()
    for (const r of itemEdits) {
      const k = (r.sku || "").trim().toUpperCase()
      if (!k) continue
      if (seen.has(k)) {
        alert(`Duplicate SKU: ${r.sku}`)
        return
      }
      seen.add(k)
    }

    setSaving(true)
    try {
      // 0) อัปเดตข้อมูลหลักของสินค้า
      const payload: UpdateProductRequest = {
        name,
        description,
        status,
        categoryUuid: categoryUuid === NONE_VALUE ? undefined : categoryUuid
      }
      await updateProductRequester(productUuid, payload, [])

      // 1) ลบรูปที่เอาออก
      const uuidRemainingInUI = new Set(
        uiImages.filter((i) => !!i.uuid).map((i) => i.uuid!)
      )
      const toDelete = [...serverUuidsInitial].filter(
        (u) => !uuidRemainingInUI.has(u)
      )
      if (toDelete.length > 0) {
        await Promise.all(
          toDelete.map((imageUuid) =>
            deleteProductImageRequester(productUuid, imageUuid)
          )
        )
      }

      // 2) อัปโหลดรูปใหม่
      const newFiles = await convertNewBlobsToFiles(uiImages)
      type UploadedImage = { uuid: string; fileName: string }
      const created = (await addProductImagesRequester(
        productUuid,
        newFiles
      )) as UploadedImage[] | null
      const createdMap = new Map<string, string>()
      for (const img of created ?? []) {
        if (img?.uuid && img?.fileName) createdMap.set(img.fileName, img.uuid)
      }

      // 3) ตั้งรูปหลักตาม UI
      const desiredMain = uiImages.find((i) => i.isMain)
      if (desiredMain) {
        const desiredMainUuid =
          desiredMain.uuid ?? createdMap.get(desiredMain.fileName)
        if (desiredMainUuid) {
          await updateProductImageRequester(productUuid, desiredMainUuid, {
            isMain: true
          })
        }
      }

      // 4) Reorder รูป
      const desiredOrders = uiImages
        .slice()
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((img, idx) => {
          const uuid = img.uuid ?? createdMap.get(img.fileName)
          return uuid ? { imageUuid: uuid, sortOrder: idx } : null
        })
        .filter((x): x is { imageUuid: string; sortOrder: number } => !!x)
      if (desiredOrders.length > 0) {
        console.log("desireOrders > 0")
        await reorderProductImagesRequester(productUuid, desiredOrders)
      }

      // 5) อัปเดต Items ที่มีการเปลี่ยนแปลง
      const baseById = new Map(itemBaselines.map((b) => [b.uuid, b]))
      const updates: Array<Promise<unknown>> = []
      for (const r of itemEdits) {
        const base = baseById.get(r.uuid)
        if (!base) continue

        const nextPriceMinor = toMinor(r.price)
        const nextStock = toInt(r.stock)
        const nextSku = (r.sku || "").trim()
        const changed =
          base.sku !== nextSku ||
          base.priceMinor !== nextPriceMinor ||
          base.stockQuantity !== nextStock ||
          base.isEnable !== r.isEnable

        if (!changed) continue

        const patch: UpdateItemPayload = {}
        if (base.sku !== nextSku) patch.sku = nextSku
        if (base.priceMinor !== nextPriceMinor)
          patch.priceMinor = nextPriceMinor
        if (base.stockQuantity !== nextStock) patch.stockQuantity = nextStock
        if (base.isEnable !== r.isEnable) patch.isEnable = r.isEnable

        updates.push(updateProductItemRequester(productUuid, r.uuid, patch))
      }
      if (updates.length) {
        await Promise.all(updates)
      }

      alert("Saved")
      router.push(`/products/${productUuid}`)
    } catch (e: unknown) {
      console.error(e)
      alert("Error while saving")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <MerchantHeader title="Edit Product" description="Update your product" />
      <div className="p-4 space-y-6">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : (
          <>
            {/* Images */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Images</label>
              <ImageUpload
                mode="local"
                images={uiImages}
                onImagesChange={setUiImages}
                maxImages={10}
              />
              <p className="text-xs text-muted-foreground">
                * delete/re-order/set main image will apply when click
                &quot;Save&quot;
              </p>
            </div>

            {/* Basic fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={categoryUuid} onValueChange={setCategoryUuid}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        catLoading ? "Loading..." : "Select category"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>(None)</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.uuid} value={c.uuid}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Status</label>
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
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Items editor */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Items (SKUs)</div>
              {itemEdits.length === 0 ? (
                <div className="text-sm text-muted-foreground">No items</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[800px] w-full text-sm border rounded">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="text-left p-2 w-[88px]">Enable</th>
                        <th className="text-left p-2">SKU</th>
                        <th className="text-right p-2">Price (THB)</th>
                        <th className="text-right p-2">Stock</th>
                        <th className="text-right p-2 w-[96px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemEdits.map((r) => (
                        <tr key={r.uuid} className="border-t">
                          <td className="p-2">
                            <input
                              type="checkbox"
                              checked={r.isEnable}
                              onChange={(e) =>
                                patchItem(r.uuid, {
                                  isEnable: e.target.checked
                                })
                              }
                            />
                          </td>
                          <td className="p-2">
                            <Input
                              value={r.sku}
                              onChange={(e) =>
                                patchItem(r.uuid, { sku: e.target.value })
                              }
                              placeholder="SKU"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <Input
                              className="text-right"
                              type="number"
                              step="0.01"
                              min="0"
                              value={r.price}
                              onChange={(e) =>
                                patchItem(r.uuid, { price: e.target.value })
                              }
                              placeholder="0.00"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <Input
                              className="text-right"
                              type="number"
                              min="0"
                              value={r.stock}
                              onChange={(e) =>
                                patchItem(r.uuid, { stock: e.target.value })
                              }
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeItem(r.uuid)}
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                * เปิด/ปิด Enable เพื่อกำหนดว่าจะขาย SKU นั้น ๆ หรือไม่
                (รายการถูกปิดจะไม่ถูกนับในหน้า List)
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/products/${productUuid}`)}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
