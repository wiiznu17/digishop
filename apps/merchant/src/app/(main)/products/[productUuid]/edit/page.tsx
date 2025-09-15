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
  type CategoryDto,
  deleteProductItemImageRequester,
  uploadProductItemImageRequester,
  createProductItemRequester,
  setItemConfigurationsRequester
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
import { ProductItemLite } from "@/types/props/productProp"
import {
  createVariationRequester,
  updateVariationRequester,
  deleteVariationRequester,
  createVariationOptionRequester,
  updateVariationOptionRequester,
  deleteVariationOptionRequester,
  reorderVariationOptionsRequester
} from "@/utils/requestUtils/requestProductUtils"

import {
  VariationEditor,
  type VariationDraft
} from "@/components/product/variationEditor"

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
  imageUuid?: string | null
}

type ItemEdit = {
  key: string // คีย์ของคอมบิเนชัน (option keys ตามลำดับ variation)
  uuid?: string // มีเมื่อเป็น item เดิมจากเซิร์ฟเวอร์
  optionKeys: string[] // [o.uuid || clientId] ตามลำดับ variation
  label: string // "Red / XL"
  sku: string
  price: string
  stock: string
  isEnable: boolean
  image?: ImageLike | null
  imageBaselineUuid?: string | null
  toBeDeleted?: boolean // แถวที่จะถูกลบตอน Save
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

  // images
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

  // เก็บ baseline rows เพื่อเทียบ map คอมบิเนชัน
  const [baselineRowsByKey, setBaselineRowsByKey] = useState<
    Map<string, ItemEdit>
  >(new Map())

  type VariationInit = VariationDraft
  const [variationsInit, setVariationsInit] = useState<VariationInit[]>([])
  const [variationsDraft, setVariationsDraft] = useState<VariationDraft[]>([])

  // ===== Utils =====
  const fromMinor = (minor: number): string => (minor / 100).toFixed(2)
  const toMinor = (val: string): number => {
    const n = Number(val || 0)
    return Number.isNaN(n) || n < 0 ? 0 : Math.round(n * 100)
  }
  const toInt = (val: string): number => {
    const n = parseInt(val || "0", 10)
    return Number.isNaN(n) || n < 0 ? 0 : n
  }

  // cartesian ของตัวเลือก
  const cartesian = <T,>(arr: T[][]): T[][] =>
    arr.length === 0
      ? []
      : arr.reduce<T[][]>(
          (acc, cur) => acc.flatMap((a) => cur.map((c) => [...a, c])),
          [[]]
        )
  const comboLabel = (vals: string[]) => vals.join(" / ")
  const comboKey = (keys: string[]) => keys.join("|")

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

      // variations → Draft
      const toClientId = (id?: string) =>
        id ?? `${crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`
      const vDraft: VariationDraft[] = (res.variations ?? []).map((v) => ({
        clientId: toClientId(v.uuid),
        uuid: v.uuid,
        name: v.name,
        options: (v.options ?? [])
          .slice()
          .sort((a, b) => {
            const so = (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
            if (so !== 0) return so
            const ta = new Date(a.createdAt ?? "").getTime() || 0
            const tb = new Date(b.createdAt ?? "").getTime() || 0
            return ta - tb
          })
          .map((o, idx) => ({
            clientId: toClientId(o.uuid),
            uuid: o.uuid,
            value: o.value,
            sortOrder: o.sortOrder ?? idx
          }))
      }))
      setVariationsInit(vDraft)
      setVariationsDraft(JSON.parse(JSON.stringify(vDraft)) as VariationDraft[])

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

      // items → rows + baseline map
      const baseRows: ItemEdit[] = (res.items ?? [])
        .map((it) => {
          const optUuids = (it.configurations ?? [])
            .map((c) => c.variationOption?.uuid)
            .filter((u): u is string => !!u)

          const keysInOrder: string[] = []
          const labelsInOrder: string[] = []
          for (const v of vDraft) {
            const found = v.options.find(
              (o) => o.uuid && optUuids.includes(o.uuid)
            )
            if (!found) return null
            const k = found.uuid ?? found.clientId
            keysInOrder.push(k)
            labelsInOrder.push(found.value)
          }

          return {
            key: comboKey(keysInOrder),
            uuid: it.uuid,
            optionKeys: keysInOrder,
            label: comboLabel(labelsInOrder),
            sku: it.sku ?? "",
            price: fromMinor(it.priceMinor ?? 0),
            stock: String(it.stockQuantity ?? 0),
            isEnable: Boolean((it as ProductItemLite).isEnable ?? true),
            image: it.productItemImage
              ? ({
                  uuid: it.productItemImage.uuid,
                  url: it.productItemImage.url,
                  fileName: it.productItemImage.fileName
                } as ImageLike)
              : null,
            imageBaselineUuid: it.productItemImage?.uuid ?? null
          }
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)

      setItemBaselines(
        (res.items ?? []).map((it) => ({
          uuid: it.uuid,
          sku: it.sku ?? "",
          priceMinor: it.priceMinor ?? 0,
          stockQuantity: it.stockQuantity ?? 0,
          isEnable: Boolean((it as ProductItemLite).isEnable ?? true),
          imageUuid: it.productItemImage?.uuid ?? null
        }))
      )
      setItemEdits(baseRows)
      setBaselineRowsByKey(new Map(baseRows.map((r) => [r.key, r])))
    },
    [productUuid]
  )

  const persistVariations = async (
    initVars: VariationDraft[],
    draftVars: VariationDraft[]
  ): Promise<Map<string, string>> => {
    const clientToServer = new Map<string, string>()
    const byInitVarUuid = new Map(
      initVars.filter((v) => v.uuid).map((v) => [v.uuid as string, v])
    )
    const draftWithUuid = draftVars.filter((v) => !!v.uuid)
    const draftNewVars = draftVars.filter((v) => !v.uuid)

    // map ของ option เดิม
    for (const v of draftWithUuid) {
      for (const o of v.options)
        if (o.uuid) clientToServer.set(o.clientId, o.uuid)
    }

    // ลบ variation ที่หาย
    for (const v of initVars) {
      const still = draftVars.some((d) => (d.uuid ?? "") === (v.uuid ?? ""))
      if (v.uuid && !still) await deleteVariationRequester(productUuid, v.uuid)
    }

    // อัปเดตเดิม + options
    for (const v of draftWithUuid) {
      const vUuid = v.uuid as string
      const initV = byInitVarUuid.get(vUuid)
      if (!initV) continue

      if (initV.name !== v.name) {
        await updateVariationRequester(productUuid, vUuid, { name: v.name })
      }

      const initByOptUuid = new Map(
        initV.options.filter((o) => o.uuid).map((o) => [o.uuid as string, o])
      )
      const draftExistingOpts = v.options.filter((o) => !!o.uuid)
      const draftNewOpts = v.options.filter((o) => !o.uuid)

      // delete options
      for (const o of initV.options) {
        const still = v.options.some((d) => (d.uuid ?? "") === (o.uuid ?? ""))
        if (o.uuid && !still)
          await deleteVariationOptionRequester(productUuid, vUuid, o.uuid)
      }

      // rename options
      for (const o of draftExistingOpts) {
        const oUuid = o.uuid as string
        const ori = initByOptUuid.get(oUuid)
        if (ori && ori.value !== o.value) {
          await updateVariationOptionRequester(productUuid, vUuid, oUuid, {
            value: o.value
          })
        }
      }

      // create new
      const newIdByClient = new Map<string, string>()
      for (const o of draftNewOpts) {
        const c = await createVariationOptionRequester(productUuid, vUuid, {
          value: o.value
        })
        if (c?.uuid) {
          newIdByClient.set(o.clientId, c.uuid)
          clientToServer.set(o.clientId, c.uuid)
        }
      }

      // reorder
      const orders = v.options
        .map((o, idx) => {
          const id = o.uuid ?? newIdByClient.get(o.clientId)
          return id ? { optionUuid: id, sortOrder: idx } : null
        })
        .filter((x): x is { optionUuid: string; sortOrder: number } => !!x)
      if (orders.length) {
        await reorderVariationOptionsRequester(productUuid, vUuid, orders)
      }
    }

    // สร้าง variation ใหม่
    for (const v of draftNewVars) {
      const created = await createVariationRequester(productUuid, {
        name: v.name
      })
      if (!created?.uuid) continue
      const vUuid = created.uuid

      const createdIds: string[] = []
      for (const o of v.options) {
        const c = await createVariationOptionRequester(productUuid, vUuid, {
          value: o.value
        })
        if (c?.uuid) {
          createdIds.push(c.uuid)
          clientToServer.set(o.clientId, c.uuid)
        }
      }
      if (createdIds.length) {
        const orders = createdIds.map((id, idx) => ({
          optionUuid: id,
          sortOrder: idx
        }))
        await reorderVariationOptionsRequester(productUuid, vUuid, orders)
      }
    }

    // เติม mapping อีกรอบ
    for (const v of draftVars) {
      for (const o of v.options)
        if (o.uuid) clientToServer.set(o.clientId, o.uuid)
    }

    return clientToServer
  }

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

  // เมื่อ variationsDraft เปลี่ยน → generate desired + mark แถว baseline ที่หายไป
  useEffect(() => {
    const optionMatrix = variationsDraft.map((v) =>
      [...v.options].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    )
    if (
      optionMatrix.length === 0 ||
      optionMatrix.some((opts) => opts.length === 0)
    ) {
      const toDeleteRows = Array.from(baselineRowsByKey.values()).map((r) => ({
        ...r,
        toBeDeleted: true
      }))
      setItemEdits(toDeleteRows)
      return
    }

    const combos = cartesian(optionMatrix)
    const desired = combos.map((opts) => {
      const keys = opts.map((o) => o.uuid ?? o.clientId)
      const labels = opts.map((o) => o.value)
      return { key: comboKey(keys), keys, label: comboLabel(labels) }
    })

    const desiredKeySet = new Set(desired.map((d) => d.key))
    const prevByKey = new Map(itemEdits.map((r) => [r.key, r]))

    const merged: ItemEdit[] = desired.map(({ key, keys, label }) => {
      const prev = prevByKey.get(key)
      return prev
        ? { ...prev, label, toBeDeleted: false }
        : {
            key,
            uuid: undefined,
            optionKeys: keys,
            label,
            sku: "",
            price: "",
            stock: "",
            isEnable: true,
            image: null,
            imageBaselineUuid: null,
            toBeDeleted: false
          }
    })

    const toDeleteRows: ItemEdit[] = []
    for (const [k, row] of baselineRowsByKey.entries()) {
      if (!desiredKeySet.has(k))
        toDeleteRows.push({ ...row, toBeDeleted: true })
    }

    setItemEdits([...merged, ...toDeleteRows])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(variationsDraft)])

  // ===== Helpers =====
  const convertNewBlobsToFiles = async (
    images: ImageLike[]
  ): Promise<File[]> => {
    const files: File[] = []
    for (const img of images) {
      if (!img.uuid && img.url.startsWith("blob:")) {
        const resp = await fetch(img.url)
        const blob = await resp.blob()
        files.push(new File([blob], img.fileName, { type: blob.type }))
      }
    }
    return files
  }
  const toFileFromBlobUrl = async (img: ImageLike) => {
    const resp = await fetch(img.url)
    const blob = await resp.blob()
    return new File([blob], img.fileName, { type: blob.type || undefined })
  }

  const serverUuidsInitial = useMemo(
    () => new Set(initialServerImages.map((i) => i.uuid)),
    [initialServerImages]
  )

  const patchItem = (key: string, patch: Partial<ItemEdit>) => {
    setItemEdits((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r))
    )
  }

  // Delete: toggle ลบสำหรับของเดิม / ลบออกเลยถ้าเป็นของใหม่
  const removeItem = (key: string) => {
    setItemEdits((prev) => {
      const row = prev.find((r) => r.key === key)
      if (!row) return prev
      if (!row.uuid) return prev.filter((r) => r.key !== key)
      return prev.map((r) =>
        r.key === key ? { ...r, toBeDeleted: !r.toBeDeleted } : r
      )
    })
  }

  // ===== Build option badges for a row =====
  const getOptionPairs = (r: ItemEdit): { name?: string; value: string }[] => {
    const pairs: { name?: string; value: string }[] = []

    // พยายาม map จาก variationsDraft ปัจจุบัน (ตาม index)
    for (let i = 0; i < r.optionKeys.length; i++) {
      const v = variationsDraft[i]
      const k = r.optionKeys[i]
      const opt = v?.options.find((o) => (o.uuid ?? o.clientId) === k)
      if (v && opt) pairs.push({ name: v.name, value: opt.value })
    }

    // ถ้าจับคู่ไม่ได้ครบ (เช่น แถวจะถูกลบเพราะโครงสร้างเปลี่ยน) → fallback ใช้ label เดิม
    if (pairs.length === 0 || pairs.length !== r.optionKeys.length) {
      const parts = (r.label || "").split(" / ").filter(Boolean)
      if (parts.length) return parts.map((val) => ({ value: val }))
    }
    return pairs
  }

  // ===== Save =====
  const handleSave = async () => {
    if (!name.trim()) {
      alert("Please fill product name")
      return
    }

    // ตรวจซ้ำ SKU เฉพาะแถวที่ไม่ถูกลบ
    const seen = new Set<string>()
    for (const r of itemEdits.filter((x) => !x.toBeDeleted)) {
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
      // -1) variations
      const optClientToServer = await persistVariations(
        variationsInit,
        variationsDraft
      )

      // 0) product
      const payload: UpdateProductRequest = {
        name,
        description,
        status,
        categoryUuid: categoryUuid === NONE_VALUE ? undefined : categoryUuid
      }
      await updateProductRequester(productUuid, payload, [])

      // 1) product images
      const uuidRemainingInUI = new Set(
        uiImages.filter((i) => !!i.uuid).map((i) => i.uuid as string)
      )
      const toDeleteImages = [...serverUuidsInitial].filter(
        (u) => !uuidRemainingInUI.has(u)
      )
      if (toDeleteImages.length > 0) {
        await Promise.all(
          toDeleteImages.map((imageUuid) =>
            deleteProductImageRequester(productUuid, imageUuid)
          )
        )
      }

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

      const desiredOrders = uiImages
        .slice()
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((img, idx) => {
          const uuid = img.uuid ?? createdMap.get(img.fileName)
          return uuid ? { imageUuid: uuid, sortOrder: idx } : null
        })
        .filter((x): x is { imageUuid: string; sortOrder: number } => !!x)
      if (desiredOrders.length > 0) {
        await reorderProductImagesRequester(productUuid, desiredOrders)
      }

      // 2) Items (ลบ -> สร้าง -> อัปเดต)
      const keptServerUuids = new Set(
        itemEdits.filter((r) => !!r.uuid && !r.toBeDeleted).map((r) => r.uuid!)
      )
      const toDeleteItemUuids = itemBaselines
        .map((b) => b.uuid)
        .filter((u) => !keptServerUuids.has(u))
      if (toDeleteItemUuids.length) {
        await Promise.all(
          toDeleteItemUuids.map((uuid) =>
            deleteProductItemRequester(productUuid, uuid)
          )
        )
      }

      for (const r of itemEdits) {
        if (r.uuid || r.toBeDeleted) continue
        const optionUuids = r.optionKeys
          .map((k) => optClientToServer.get(k))
          .filter((x): x is string => !!x)
        if (optionUuids.length !== r.optionKeys.length) continue

        const createdItem = await createProductItemRequester(productUuid, {
          sku: (r.sku || "").trim() || undefined,
          stockQuantity: toInt(r.stock),
          priceMinor: toMinor(r.price),
          imageUrl: null,
          isEnable: r.isEnable
        })
        const newUuid = (createdItem as { uuid?: string } | null)?.uuid
        if (!newUuid) continue

        if (r.image && r.image.url.startsWith("blob:")) {
          const f = await toFileFromBlobUrl(r.image)
          await uploadProductItemImageRequester(productUuid, newUuid, f)
        }

        if (optionUuids.length) {
          await setItemConfigurationsRequester(
            productUuid,
            newUuid,
            optionUuids
          )
        }
      }

      const baseById = new Map(itemBaselines.map((b) => [b.uuid, b]))
      const updates: Array<Promise<unknown>> = []
      for (const r of itemEdits) {
        if (!r.uuid || r.toBeDeleted) continue
        const base = baseById.get(r.uuid)
        if (!base) continue

        const img = r.image ?? null
        const had = r.imageBaselineUuid ?? base.imageUuid ?? null
        if (!img && had) {
          await deleteProductItemImageRequester(productUuid, r.uuid)
        }
        if (img && img.url.startsWith("blob:")) {
          const f = await toFileFromBlobUrl(img)
          await uploadProductItemImageRequester(productUuid, r.uuid, f)
        }

        const nextPriceMinor = toMinor(r.price)
        const nextStock = toInt(r.stock)
        const nextSku = (r.sku || "").trim()

        const patch: UpdateItemPayload = {}
        if (base.sku !== nextSku) patch.sku = nextSku
        if (base.priceMinor !== nextPriceMinor)
          patch.priceMinor = nextPriceMinor
        if (base.stockQuantity !== nextStock) patch.stockQuantity = nextStock
        if (base.isEnable !== r.isEnable) patch.isEnable = r.isEnable

        if (Object.keys(patch).length) {
          updates.push(updateProductItemRequester(productUuid, r.uuid, patch))
        }
      }
      if (updates.length) await Promise.all(updates)

      alert("Saved")
      router.push(`/products/${productUuid}`)
    } catch (e) {
      console.error(e)
      alert("Error while saving")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <MerchantHeader
        title="Edit Product"
        description="Update your product detail"
      />
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
                cropAspect={1}
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

            {/* Variations */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Variations</label>
              <VariationEditor
                value={variationsDraft}
                onChange={setVariationsDraft}
              />
              <p className="text-xs text-muted-foreground">
                • แก้ชื่อ/เพิ่ม/ลบ และลากเรียงตัวเลือกได้ —
                ระบบจะบันทึกจริงตอนกด Save เท่านั้น
              </p>
            </div>

            {/* Items editor */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Items (SKUs)</div>
              {itemEdits.length === 0 ? (
                <div className="text-sm text-muted-foreground">No items</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[1080px] w-full text-sm border rounded">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="text-left p-2 w-[88px]">Enable</th>
                        <th className="text-left p-2 w-[124px]">Image</th>
                        <th className="text-left p-2 min-w-[220px]">Options</th>
                        <th className="text-left p-2">SKU</th>
                        <th className="text-right p-2">Price (THB)</th>
                        <th className="text-right p-2">Stock</th>
                        <th className="text-right p-2 w-[96px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemEdits.map((r) => {
                        const isNew = !r.uuid && !r.toBeDeleted
                        const willDelete = !!r.toBeDeleted
                        const pairs = getOptionPairs(r)
                        return (
                          <tr
                            key={r.key}
                            className={[
                              "border-t align-top",
                              isNew ? "bg-emerald-50/40" : "",
                              willDelete ? "bg-rose-50/60 opacity-90" : ""
                            ].join(" ")}
                            title={
                              isNew
                                ? "ยังไม่มี UUID — จะถูกสร้างเมื่อกด Save"
                                : willDelete
                                  ? "คอมบิเนชันนี้ไม่อยู่ใน Variations ปัจจุบัน — จะถูกลบเมื่อกด Save"
                                  : undefined
                            }
                          >
                            <td className="p-2 align-top">
                              <input
                                type="checkbox"
                                checked={r.isEnable}
                                disabled={willDelete}
                                onChange={(e) =>
                                  patchItem(r.key, {
                                    isEnable: e.target.checked
                                  })
                                }
                              />
                            </td>

                            <td className="p-2 align-top">
                              <div className="relative w-20 h-20">
                                <ImageUpload
                                  variant="compact"
                                  mode="local"
                                  images={r.image ? [r.image] : []}
                                  onImagesChange={(imgs) =>
                                    patchItem(r.key, {
                                      image: imgs[0] ?? null
                                    })
                                  }
                                  maxImages={1}
                                  cropAspect={1}
                                />

                                {/* Badges */}
                                {isNew && (
                                  <span className="absolute -top-1.5 -left-1.5 bg-emerald-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow pointer-events-none">
                                    ใหม่
                                  </span>
                                )}
                                {willDelete && (
                                  <span className="absolute -top-1.5 -left-1.5 bg-rose-500 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow pointer-events-none">
                                    จะถูกลบ
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* NEW: Option mapping badges */}
                            <td className="p-2 align-top">
                              {pairs.length ? (
                                <div className="flex flex-wrap gap-1">
                                  {pairs.map((p, idx) => (
                                    <span
                                      key={idx}
                                      title={p.name}
                                      className={[
                                        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] bg-muted/40",
                                        willDelete ? "opacity-60" : ""
                                      ].join(" ")}
                                    >
                                      {p.name && (
                                        <span className="text-muted-foreground mr-1">
                                          {p.name}:
                                        </span>
                                      )}
                                      <span className="font-medium">
                                        {p.value}
                                      </span>
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  –
                                </span>
                              )}
                            </td>

                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <Input
                                  value={r.sku}
                                  disabled={willDelete}
                                  onChange={(e) =>
                                    patchItem(r.key, { sku: e.target.value })
                                  }
                                  placeholder="SKU"
                                />
                                {isNew && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                                    ใหม่
                                  </span>
                                )}
                                {willDelete && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                                    จะถูกลบ
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="p-2 text-right">
                              <Input
                                className="text-right"
                                type="number"
                                step="0.01"
                                min="0"
                                disabled={willDelete}
                                value={r.price}
                                onChange={(e) =>
                                  patchItem(r.key, { price: e.target.value })
                                }
                                placeholder="0.00"
                              />
                            </td>

                            <td className="p-2 text-right">
                              <Input
                                className="text-right"
                                type="number"
                                min="0"
                                disabled={willDelete}
                                value={r.stock}
                                onChange={(e) =>
                                  patchItem(r.key, { stock: e.target.value })
                                }
                                placeholder="0"
                              />
                            </td>

                            <td className="p-2 text-right">
                              <Button
                                size="sm"
                                variant={willDelete ? "secondary" : "outline"}
                                onClick={() => removeItem(r.key)}
                              >
                                {willDelete ? "Undo" : "Delete"}
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                • แถวพื้นเขียว = คอมบิเนชันใหม่ (จะถูกสร้างเมื่อ Save) —
                แถวพื้นชมพู = คอมบิเนชันที่จะถูกลบเมื่อ Save
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
