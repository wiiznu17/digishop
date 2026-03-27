'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MerchantHeader } from '@/components/dashboard-header'
import { ImageUpload, type ImageLike } from '@/components/product/imageUpload'
import {
  fetchCategoriesRequester,
  type CategoryDto,
  createProductDesiredRequester,
  type DesiredPayload
} from '@/utils/requestUtils/requestProductUtils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import PRODUCT_STATUS_MASTER from '@/constants/master/productStatusMaster.json'
import VariationBuilder, {
  type VariationDraft,
  type ItemDraft
} from '@/components/product/variationBuilder'

export default function AddProductPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [categoryUuid, setCategoryUuid] = useState<string | undefined>(
    undefined
  )
  const [status, setStatus] = useState<string>('DRAFT')
  const [description, setDescription] = useState<string>('')

  const [uiImages, setUiImages] = useState<ImageLike[]>([])
  const [creating, setCreating] = useState(false)

  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [catLoading, setCatLoading] = useState(false)

  const [variations, setVariations] = useState<VariationDraft[]>([])
  const [rows, setRows] = useState<ItemDraft[]>([])

  const NONE_VALUE = '__NONE__'

  useEffect(() => {
    const run = async () => {
      setCatLoading(true)
      const list = await fetchCategoriesRequester()
      setCategories(list)
      setCatLoading(false)
    }
    void run()
  }, [])

  // helpers
  const toMinor = (val: string) => {
    const n = Number(val || 0)
    return Number.isNaN(n) ? 0 : Math.round(n * 100)
  }
  const toInt = (val: string) => {
    const n = parseInt(val || '0', 10)
    return Number.isNaN(n) ? 0 : n
  }
  const randomKey = () => Math.random().toString(36).slice(2, 10)

  // สร้าง File ใหม่พร้อม “ชื่อไฟล์ = uploadKey__original”
  const toFileFromBlobUrl = async (img: ImageLike, uploadKey: string) => {
    const resp = await fetch(img.url)
    const blob = await resp.blob()
    const ext = img.fileName?.split('.').pop() ?? 'jpg'
    const fileName = `${uploadKey}__${img.fileName || `image.${ext}`}`
    return new File([blob], fileName, { type: blob.type || undefined })
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      alert('Please fill product name')
      return
    }
    if (rows.length < 1) {
      alert('Please add at least 1 SKU (add a variation and an option).')
      return
    }

    // ----- build desired payload -----
    const productImageFiles: File[] = []
    const desiredImages: DesiredPayload['images']['product'] = []
    for (let idx = 0; idx < uiImages.length; idx++) {
      const img = uiImages[idx]
      if (img.url.startsWith('blob:')) {
        const uploadKey = `p-${randomKey()}`
        const f = await toFileFromBlobUrl(img, uploadKey)
        productImageFiles.push(f)
        desiredImages.push({
          uploadKey,
          fileName: img.fileName,
          isMain: !!img.isMain,
          sortOrder: idx
        })
      } else {
        desiredImages.push({
          fileName: img.fileName,
          isMain: !!img.isMain,
          sortOrder: idx
        })
      }
    }

    // variations
    const desiredVariations = variations.map((v) => ({
      clientId: v.cid,
      name: v.name,
      options: v.options
        .slice()
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((o) => ({
          clientId: o.cid,
          value: o.value,
          sortOrder: o.sortOrder ?? 0
        }))
    }))

    // items
    const itemImageFiles: File[] = []
    const desiredItems = await Promise.all(
      rows.map(async (r) => {
        let image: DesiredPayload['items'][number]['image'] = null
        if (r.image && r.image.url.startsWith('blob:')) {
          const uploadKey = `it-${randomKey()}`
          const f = await toFileFromBlobUrl(r.image, uploadKey)
          itemImageFiles.push(f)
          image = { uploadKey }
        }
        return {
          clientKey: r.key,
          sku: (r.sku || '').trim() || undefined,
          priceMinor: toMinor(r.price),
          stockQuantity: toInt(r.stock),
          isEnable: !!r.enabled,
          optionRefs: r.optionCids, // <- clientIds; BE จะ map จาก variations.options.clientId -> uuid
          image
        }
      })
    )

    const payload: DesiredPayload = {
      product: {
        name,
        description: description || null,
        status,
        categoryUuid: categoryUuid ?? null
      },
      images: { product: desiredImages },
      variations: desiredVariations,
      items: desiredItems
    }

    setCreating(true)
    try {
      console.log('create product with: ', payload)
      console.log('create product image with: ', productImageFiles)
      console.log('create product item image with: ', itemImageFiles)
      const created = await createProductDesiredRequester(
        payload,
        productImageFiles,
        itemImageFiles
      )
      if (!created?.uuid) {
        alert('Create failed')
        setCreating(false)
        return
      }
      alert('Created')
      router.push(`/products/${created.uuid}`)
    } catch (e) {
      console.error(e)
      alert('Error while creating')
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
            cropAspect={1}
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
                  placeholder={catLoading ? 'Loading...' : 'Select category'}
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
            {creating ? 'Creating...' : 'Create'}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/products')}
            disabled={creating}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
