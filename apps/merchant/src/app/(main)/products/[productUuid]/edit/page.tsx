'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MerchantHeader } from '@/components/dashboard-header'
import { ImageUpload, type ImageLike } from '@/components/product/imageUpload'
import {
  fetchProductDetailRequester,
  fetchCategoriesRequester,
  type CategoryDto,
  updateProductDesiredRequester,
  type DesiredPayload
} from '@/utils/requestUtils/requestProductUtils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import PRODUCT_STATUS_MASTER from '@/constants/master/productStatusMaster.json'
import { ProductItemLite } from '@/types/props/productProp'
import {
  VariationEditor,
  type VariationDraft
} from '@/components/product/variationEditor'
import { Switch } from '@/components/ui/switch'

// ใช้ค่านี้เป็นตัวแทน "ไม่เลือกหมวด"
const NONE_VALUE = 'none'

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
  key: string
  uuid?: string
  optionKeys: string[]
  label: string
  sku: string
  price: string
  stock: string
  isEnable: boolean
  image?: ImageLike | null
  imageBaselineUuid?: string | null
  toBeDeleted?: boolean
}

export default function EditProductPage() {
  const { productUuid } = useParams<{ productUuid: string }>()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [categoryUuid, setCategoryUuid] = useState<string>(NONE_VALUE)
  const [status, setStatus] = useState<string>('DRAFT')
  const [description, setDescription] = useState<string>('')
  const [updatedAt, setUpdatedAt] = useState<string | undefined>(undefined)

  // images
  const [uiImages, setUiImages] = useState<ImageLike[]>([])
  const [initialServerImages, setInitialServerImages] = useState<
    ServerImageLite[]
  >([])

  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [catLoading, setCatLoading] = useState(false)

  const [itemBaselines, setItemBaselines] = useState<ItemBaseline[]>([])
  const [itemEdits, setItemEdits] = useState<ItemEdit[]>([])
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
    const n = parseInt(val || '0', 10)
    return Number.isNaN(n) || n < 0 ? 0 : n
  }

  const randomKey = () => Math.random().toString(36).slice(2, 10)

  const toFileFromBlobUrl = async (img: ImageLike, uploadKey: string) => {
    const resp = await fetch(img.url)
    const blob = await resp.blob()
    const ext = img.fileName?.split('.').pop() ?? 'jpg'
    const fileName = `${uploadKey}__${img.fileName || `image.${ext}`}`
    return new File([blob], fileName, { type: blob.type || undefined })
  }

  // cartesian
  const cartesian = <T,>(arr: T[][]): T[][] =>
    arr.length === 0
      ? []
      : arr.reduce<T[][]>(
          (acc, cur) => acc.flatMap((a) => cur.map((c) => [...a, c])),
          [[]]
        )
  const comboLabel = (vals: string[]) => vals.join(' / ')
  const comboKey = (keys: string[]) => keys.join('|')

  // ===== Load detail =====
  useEffect(() => {
    const run = async () => {
      setLoading(true)
      const res = await fetchProductDetailRequester(productUuid)
      setLoading(false)
      if (!res) return

      setName(res.name || '')
      setCategoryUuid(res.category?.uuid || NONE_VALUE)
      setStatus(res.status || 'DRAFT')
      setDescription(res.description || '')
      setUpdatedAt(res.updatedAt)

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
            const ta = new Date(a.createdAt ?? '').getTime() || 0
            const tb = new Date(b.createdAt ?? '').getTime() || 0
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
            sku: it.sku ?? '',
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
          sku: it.sku ?? '',
          priceMinor: it.priceMinor ?? 0,
          stockQuantity: it.stockQuantity ?? 0,
          isEnable: Boolean((it as ProductItemLite).isEnable ?? true),
          imageUuid: it.productItemImage?.uuid ?? null
        }))
      )
      setItemEdits(baseRows)
      setBaselineRowsByKey(new Map(baseRows.map((r) => [r.key, r])))
    }
    run()
  }, [productUuid])

  useEffect(() => {
    const run = async () => {
      setCatLoading(true)
      const list = await fetchCategoriesRequester()
      setCategories(list)
      setCatLoading(false)
    }
    run()
  }, [])

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
            sku: '',
            price: '',
            stock: '',
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

  const serverUuidsInitial = useMemo(
    () => new Set(initialServerImages.map((i) => i.uuid)),
    [initialServerImages]
  )

  const patchItem = (key: string, patch: Partial<ItemEdit>) => {
    setItemEdits((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r))
    )
  }

  const removeItem = (key: string) => {
    setItemEdits((prev) => {
      const row = prev.find((r) => r.key === key)
      if (!row) return prev
      if (!row.uuid) return prev.filter((r) => r.key !== key)
      // return prev.map((r) =>
      //   r.key === key ? { ...r, toBeDeleted: !r.toBeDeleted } : r
      // )
      return prev
    })
  }
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
      const parts = (r.label || '').split(' / ').filter(Boolean)
      if (parts.length) return parts.map((val) => ({ value: val }))
    }
    return pairs
  }
  // ===== Save (Desired) =====
  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please fill product name')
      return
    }

    // SKU duplicate เฉพาะแถวที่ไม่ถูกลบ
    const seen = new Set<string>()
    for (const r of itemEdits.filter((x) => !x.toBeDeleted)) {
      const k = (r.sku || '').trim().toUpperCase()
      if (!k) continue
      if (seen.has(k)) {
        alert(`Duplicate SKU: ${r.sku}`)
        return
      }
      seen.add(k)
    }
    // SKU ต้องมี (เฉพาะแถว active ที่จะถูกบันทึก)
    const missing = itemEdits
      .filter((x) => !x.toBeDeleted)
      .filter((x) => !(x.sku || '').trim())
      .map((x) => x.label)

    if (missing.length) {
      alert(
        'SKU is required for:\n' +
          missing.map((s, i) => `${i + 1}. ${s}`).join('\n')
      )
      return
    }
    setSaving(true)
    try {
      // product images
      const productImageFiles: File[] = []
      const desiredImages = await Promise.all(
        uiImages.map(async (img, idx) => {
          if (!img.uuid && img.url.startsWith('blob:')) {
            const uploadKey = `p-${randomKey()}`
            const f = await toFileFromBlobUrl(img, uploadKey)
            productImageFiles.push(f)
            return {
              uploadKey,
              fileName: img.fileName,
              isMain: !!img.isMain,
              sortOrder: idx
            }
          }
          return {
            uuid: img.uuid,
            fileName: img.fileName,
            isMain: !!img.isMain,
            sortOrder: idx
          }
        })
      )

      // variations
      const desiredVariations = variationsDraft.map((v) => ({
        uuid: v.uuid,
        clientId: v.clientId,
        name: v.name,
        options: v.options
          .slice()
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((o) => ({
            uuid: o.uuid,
            clientId: o.clientId,
            value: o.value,
            sortOrder: o.sortOrder ?? 0
          }))
      }))

      // items
      const itemImageFiles: File[] = []
      const desiredItems = await Promise.all(
        itemEdits.map(async (r) => {
          if (r.toBeDeleted) {
            // ข้าม — BE จะลบจาก diff เพราะไม่มี uuid แสดงใน payload
            return null
          }
          let image: DesiredPayload['items'][number]['image'] = null
          const had = r.imageBaselineUuid ?? null
          const cur = r.image ?? null

          if (!cur && had) {
            image = { remove: true }
          } else if (cur && cur.url.startsWith('blob:')) {
            const uploadKey = `it-${randomKey()}`
            const f = await toFileFromBlobUrl(cur, uploadKey)
            itemImageFiles.push(f)
            image = { uploadKey }
          } else if (cur && cur.uuid) {
            image = { uuid: cur.uuid }
          } else {
            image = null // ไม่แตะ
          }

          return {
            uuid: r.uuid,
            clientKey: r.key,
            sku: (r.sku || '').trim() || undefined,
            priceMinor: toMinor(r.price),
            stockQuantity: toInt(r.stock),
            isEnable: r.isEnable,
            optionRefs: r.optionKeys, // uuid หรือ clientId ก็ได้
            image
          }
        })
      )

      const payload: DesiredPayload = {
        ifMatchUpdatedAt: updatedAt ?? null,
        product: {
          name,
          description,
          status,
          categoryUuid: categoryUuid === NONE_VALUE ? null : categoryUuid
        },
        images: { product: desiredImages },
        variations: desiredVariations,
        items: desiredItems.filter(Boolean) as []
      }

      const updated = await updateProductDesiredRequester(
        productUuid,
        payload,
        productImageFiles,
        itemImageFiles
      )
      if (!updated?.uuid) {
        alert('Save failed')
        setSaving(false)
        return
      }

      alert('Saved')
      router.push(`/products/${productUuid}`)
    } catch (e) {
      console.error(e)
      alert('Error while saving')
    } finally {
      setSaving(false)
    }
  }

  // ===== UI (เดิม) =====
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
                * รูป/ลำดับ/main จะถูกบันทึกตอนกด Save
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
                        catLoading ? 'Loading...' : 'Select category'
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
                // ส่งรายการ items (เฉพาะแถวที่ไม่ถูกลบ) ให้ Editor ใช้เติม SKU
                items={itemEdits
                  .filter((r) => !r.toBeDeleted)
                  .map((r) => ({
                    key: r.key,
                    optionCids: r.optionKeys, // map ชื่อให้ตรงกับที่ VariationEditor ใช้
                    sku: r.sku,
                    label: r.label
                  }))}
                // ให้ Editor อัปเดตกลับเฉพาะค่า SKU ที่ถูกเติม
                onItemsChange={(next) =>
                  setItemEdits((prev) =>
                    prev.map((r) => {
                      const found = next.find((n) => n.key === r.key)
                      return found ? { ...r, sku: found.sku } : r
                    })
                  )
                }
                // prefix สำหรับสร้าง SKU (จะใช้ชื่อสินค้าก็ได้ หรือมีฟิลด์ code ก็ส่งอันนั้น)
                skuPrefix={name}
              />

              <p className="text-xs text-muted-foreground">
                • แก้ชื่อ/เพิ่ม/ลบ และลากเรียงตัวเลือกได้ —
                ระบบจะบันทึกจริงตอนกด Save เท่านั้น
              </p>
            </div>

            {/* Items editor (เดิม) */}
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
                        {/* <th className="text-right p-2 w-[96px]">Actions</th> */}
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
                              'border-t align-top',
                              isNew ? 'bg-emerald-50/40' : '',
                              willDelete ? 'bg-rose-50/60 opacity-90' : ''
                            ].join(' ')}
                            title={
                              isNew
                                ? 'ยังไม่มี UUID — จะถูกสร้างเมื่อกด Save'
                                : willDelete
                                  ? 'คอมบิเนชันนี้ไม่อยู่ใน Variations ปัจจุบัน — จะถูกลบเมื่อกด Save'
                                  : undefined
                            }
                          >
                            {/* <td className="p-2 align-top">
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
                            </td> */}
                            <td className="p-2 align-top">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={r.isEnable}
                                  disabled={willDelete}
                                  onCheckedChange={(checked) =>
                                    patchItem(r.key, { isEnable: checked })
                                  }
                                  aria-label={`Toggle enable for ${r.sku || r.label}`}
                                />
                                <span className="text-xs text-muted-foreground">
                                  {r.isEnable ? 'Enabled' : 'Disabled'}
                                </span>
                              </div>
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
                                        'inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] bg-muted/40',
                                        willDelete ? 'opacity-60' : ''
                                      ].join(' ')}
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

                            {/* <td className="p-2 text-right">
                              <Button
                                size="sm"
                                variant={willDelete ? "secondary" : "outline"}
                                onClick={() => removeItem(r.key)}
                              >
                                {willDelete ? "Undo" : "Delete"}
                              </Button>
                            </td> */}
                            {/* <td className="p-2 text-right">
                              {!r.uuid ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeItem(r.key)}
                                >
                                  Discard
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  disabled
                                  title="Cannot delete directly. Remove by editing variations/options."
                                >
                                  Delete
                                </Button>
                              )}
                            </td> */}
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
                {saving ? 'Saving...' : 'Save'}
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
