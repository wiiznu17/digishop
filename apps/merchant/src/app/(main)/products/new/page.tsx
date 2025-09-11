"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MerchantHeader } from "@/components/dashboard-header"
import { ImageUpload, type ImageLike } from "@/components/product/imageUpload"
import {
  createProductRequester,
  createVariationRequester,
  createVariationOptionRequester,
  createProductItemRequester,
  setItemConfigurationsRequester,
  fetchCategoriesRequester, // ← เพิ่ม
  type CreateProductRequest,
  type CategoryDto // ← เพิ่ม
} from "@/utils/requestUtils/requestProductUtils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import PRODUCT_STATUS_MASTER from "@/constants/master/productStatusMaster.json"
import VariationBuilder, {
  type VariationDraft,
  type ItemDraft
} from "@/components/product/variationBuilder"

export default function AddProductPage() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [categoryUuid, setCategoryUuid] = useState<string | undefined>(
    undefined
  )
  const [status, setStatus] = useState<string>("DRAFT")
  const [description, setDescription] = useState<string>("")

  const [uiImages, setUiImages] = useState<ImageLike[]>([])
  const [creating, setCreating] = useState(false)

  // categories จาก DB
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [catLoading, setCatLoading] = useState(false)

  // variations & generated items (rows)
  const [variations, setVariations] = useState<VariationDraft[]>([])
  const [rows, setRows] = useState<ItemDraft[]>([])

  const NONE_VALUE = "__NONE__"

  useEffect(() => {
    const run = async () => {
      setCatLoading(true)
      const list = await fetchCategoriesRequester()
      setCategories(list)
      setCatLoading(false)
    }
    void run()
  }, [])

  const convertBlobsToFiles = async (images: ImageLike[]): Promise<File[]> => {
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

  const toMinor = (val: string) => {
    const n = Number(val || 0)
    return Number.isNaN(n) ? 0 : Math.round(n * 100)
  }
  const toInt = (val: string) => {
    const n = parseInt(val || "0", 10)
    return Number.isNaN(n) ? 0 : n
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      alert("Please fill product name")
      return
    }

    if (rows.length < 1) {
      alert("Please add at least 1 SKU (add a variation and an option).")
      return
    }

    const payload: CreateProductRequest = {
      name,
      description: description || null,
      status,
      categoryUuid: categoryUuid,
      categoryId: null,
      expectedSkuCount: rows.length
    }
    setCreating(true)
    try {
      const files = await convertBlobsToFiles(uiImages)
      const created = await createProductRequester(payload, files)

      if (!created?.uuid) {
        alert("Create failed")
        setCreating(false)
        return
      }
      const productUuid = created.uuid as string

      // 2) variations + options
      const optCidToServerUuid = new Map<string, string>()
      for (const v of variations) {
        const vRes = await createVariationRequester(productUuid, {
          name: v.name
        })
        if (!vRes?.uuid) continue
        for (const opt of v.options) {
          const oRes = await createVariationOptionRequester(
            productUuid,
            vRes.uuid,
            {
              value: opt.value,
              sortOrder: opt.sortOrder
            }
          )
          if (oRes?.uuid) optCidToServerUuid.set(opt.cid, oRes.uuid)
        }
      }

      // 3) items + configurations
      for (const r of rows) {
        // สร้างทุกแถว
        const itemRes = await createProductItemRequester(productUuid, {
          sku: r.sku || undefined,
          stockQuantity: toInt(r.stock),
          priceMinor: toMinor(r.price),
          imageUrl: null,
          isEnable: !!r.enabled // ส่งสถานะ enable
        })
        const itemUuid =
          (itemRes as any)?.uuid ??
          (typeof itemRes === "string" ? itemRes : undefined)

        if (itemUuid) {
          const optionUuids = r.optionCids
            .map((cid) => optCidToServerUuid.get(cid))
            .filter((x): x is string => Boolean(x))
          if (optionUuids.length) {
            await setItemConfigurationsRequester(
              productUuid,
              itemUuid,
              optionUuids
            )
          }
        }
      }

      alert("Created")
      router.push(`/products/${productUuid}`)
    } catch (e) {
      console.error(e)
      alert("Error while creating")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <MerchantHeader title="Add Product" description="Create a new product" />
      <div className="p-4 space-y-8">
        {/* Images */}
        <section className="space-y-2">
          <label className="text-sm font-medium">Images</label>
          <ImageUpload
            mode="local"
            images={uiImages}
            onImagesChange={setUiImages}
            maxImages={10}
          />
        </section>

        {/* Basic fields */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium">Category</label>
            <Select
              value={categoryUuid ?? NONE_VALUE}
              onValueChange={(v) =>
                setCategoryUuid(v === NONE_VALUE ? undefined : v)
              }
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={catLoading ? "Loading..." : "Select category"}
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

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </section>

        {/* Variations + Items generator */}
        <section className="space-y-2">
          <VariationBuilder
            variations={variations}
            onVariationsChange={setVariations}
            items={rows}
            onItemsChange={setRows}
            skuPrefix={name}
          />
        </section>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? "Creating..." : "Create"}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/products")}
            disabled={creating}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
