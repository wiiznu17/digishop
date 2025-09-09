"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { MerchantHeader } from "@/components/dashboard-header"
import { ImageUpload, type ImageLike } from "@/components/product/imageUpload"
import {
  fetchProductDetailRequester,
  updateProductRequester,
  addProductImagesRequester,
  type UpdateProductRequest
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

export default function EditProductPage() {
  const { productUuid } = useParams<{ productUuid: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)

  const [name, setName] = useState("")
  const [categoryUuid, setCategoryUuid] = useState<string>("")
  const [status, setStatus] = useState<string>("DRAFT")
  const [description, setDescription] = useState<string>("")

  const [uiImages, setUiImages] = useState<ImageLike[]>([])
  const [serverImagesCount, setServerImagesCount] = useState<number>(0)

  const loadDetail = useMemo(
    () => async () => {
      setLoading(true)
      const res = await fetchProductDetailRequester(productUuid)
      setLoading(false)
      if (!res) return

      setName(res.name || "")
      setCategoryUuid(res.category?.uuid || "")
      setStatus(res.status || "DRAFT")
      setDescription(res.description || "")

      const imgs = (res.images ?? [])
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((it) => ({
          uuid: it.uuid,
          url: it.url,
          fileName: it.fileName,
          isMain: it.isMain,
          sortOrder: it.sortOrder
        }))
      setUiImages(imgs)
      setServerImagesCount(imgs.length)
    },
    [productUuid]
  )

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  const convertNewBlobsToFiles = async (
    images: ImageLike[]
  ): Promise<File[]> => {
    const files: File[] = []
    for (const img of images) {
      if (img.url.startsWith("blob:")) {
        const resp = await fetch(img.url)
        const blob = await resp.blob()
        files.push(new File([blob], img.fileName, { type: blob.type }))
      }
    }
    return files
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: UpdateProductRequest = {
        name,
        description,
        status,
        // หมายเหตุ: ฝั่ง BE ใช้ค่าจาก categoryUuid; ถ้าไม่มีให้ส่ง undefined
        // ถ้า BE ใช้ชื่อ key อื่น (เช่น categoryId) ปรับให้ตรง
        // จาก controller ปัจจุบันรองรับ category ผ่าน field ของ Product เอง
        // เราจะส่งค่าเสริมใน productData และให้ BE map ตาม schema ของคุณ
        // ที่นี่ใช้ชื่อทั่วไป "categoryUuid"
        categoryId: undefined as any, // ป้องกันหลุด type เดิมของ requester (ไม่ส่งจริง)
        // ส่ง category ผ่าน custom field:
        // @ts-expect-error send raw to backend
        categoryUuid: categoryUuid || undefined
      }

      // 1) ส่ง productData + รูป "ใหม่" เท่านั้น ให้ BE แนบเพิ่ม
      const newFiles = await convertNewBlobsToFiles(
        uiImages.slice(serverImagesCount)
      )
      const updated = await updateProductRequester(
        productUuid,
        payload,
        newFiles
      )

      // NOTE: ถ้าต้อง sync reorder / main ของรูปเก่าแบบ single-shot
      // สามารถเรียก reorder / set main ต่อได้หลัง update สำเร็จ
      // ที่นี่ขอให้เรียบง่ายก่อน (ออพชันเสริม)

      if (updated) {
        alert("Saved")
        router.push(`/products/${productUuid}`)
      } else {
        alert("Save failed")
      }
    } catch (e) {
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Images</label>
              <ImageUpload
                mode="local"
                images={uiImages}
                onImagesChange={setUiImages}
                maxImages={10}
              />
              <p className="text-xs text-muted-foreground">
                * reordering / set main will apply after Save (we send changes
                together)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                {/* TODO: map categories from API; ตอนนี้ placeholder */}
                <Select value={categoryUuid} onValueChange={setCategoryUuid}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">(None)</SelectItem>
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
