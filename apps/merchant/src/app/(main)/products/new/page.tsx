'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MerchantHeader } from '@/components/dashboard-header'
import { ImageUpload, type ImageLike } from '@/components/product/imageUpload'
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
import { useProductCategoriesQuery } from '@/hooks/queries/useProductQueries'
import { useCreateProductMutation } from '@/hooks/mutations/useProductDetailMutations'
import type { DesiredPayload } from '@/utils/requestUtils/requestProductUtils'

const NONE_VALUE = '__NONE__'

export default function AddProductPage() {
  const router = useRouter()
  const { data: categories = [], isLoading: catLoading } =
    useProductCategoriesQuery()
  const createProductMutation = useCreateProductMutation()

  const [name, setName] = useState('')
  const [categoryUuid, setCategoryUuid] = useState<string | undefined>(
    undefined
  )
  const [status, setStatus] = useState<string>('DRAFT')
  const [description, setDescription] = useState<string>('')
  const [uiImages, setUiImages] = useState<ImageLike[]>([])
  const [variations, setVariations] = useState<VariationDraft[]>([])
  const [rows, setRows] = useState<ItemDraft[]>([])

  const toMinor = (val: string) => {
    const n = Number(val || 0)
    return Number.isNaN(n) ? 0 : Math.round(n * 100)
  }

  const toInt = (val: string) => {
    const n = parseInt(val || '0', 10)
    return Number.isNaN(n) ? 0 : n
  }

  const randomKey = () => Math.random().toString(36).slice(2, 10)

  const toFileFromBlobUrl = async (img: ImageLike, uploadKey: string) => {
    const resp = await fetch(img.url)
    const blob = await resp.blob()
    const ext = img.fileName?.split('.').pop() ?? 'jpg'
    const fileName = `${uploadKey}__${img.fileName || `image.${ext}`}`
    return new File([blob], fileName, { type: blob.type || undefined })
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      window.alert('Please fill product name')
      return
    }

    if (rows.length < 1) {
      window.alert('Please add at least 1 SKU (add a variation and an option).')
      return
    }

    const productImageFiles: File[] = []
    const desiredImages: DesiredPayload['images']['product'] = []

    for (const [idx, img] of uiImages.entries()) {
      if (img.url.startsWith('blob:')) {
        const uploadKey = `p-${randomKey()}`
        const file = await toFileFromBlobUrl(img, uploadKey)
        productImageFiles.push(file)
        desiredImages.push({
          uploadKey,
          fileName: img.fileName,
          isMain: !!img.isMain,
          sortOrder: idx
        })
        continue
      }

      desiredImages.push({
        fileName: img.fileName,
        isMain: !!img.isMain,
        sortOrder: idx
      })
    }

    const desiredVariations = variations.map((variation) => ({
      clientId: variation.cid,
      name: variation.name,
      options: variation.options
        .slice()
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((option) => ({
          clientId: option.cid,
          value: option.value,
          sortOrder: option.sortOrder ?? 0
        }))
    }))

    const itemImageFiles: File[] = []
    const desiredItems = await Promise.all(
      rows.map(async (row) => {
        let image: DesiredPayload['items'][number]['image'] = null
        if (row.image?.url.startsWith('blob:')) {
          const uploadKey = `it-${randomKey()}`
          const file = await toFileFromBlobUrl(row.image, uploadKey)
          itemImageFiles.push(file)
          image = { uploadKey }
        }

        return {
          clientKey: row.key,
          sku: (row.sku || '').trim() || undefined,
          priceMinor: toMinor(row.price),
          stockQuantity: toInt(row.stock),
          isEnable: !!row.enabled,
          optionRefs: row.optionCids,
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

    try {
      const created = await createProductMutation.mutateAsync({
        payload,
        productImages: productImageFiles,
        itemImages: itemImageFiles
      })
      router.push(`/products/${created.uuid}`)
    } catch {
      // toast handled in mutation hook
    }
  }

  return (
    <div>
      <MerchantHeader title="Add Product" description="Create a new product" />
      <div className="p-4 space-y-8">
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

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium">Category</label>
            <Select
              value={categoryUuid ?? NONE_VALUE}
              onValueChange={(value) =>
                setCategoryUuid(value === NONE_VALUE ? undefined : value)
              }
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={catLoading ? 'Loading...' : 'Select category'}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>(None)</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.uuid} value={category.uuid}>
                    {category.name}
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

        <section className="space-y-2">
          <VariationBuilder
            variations={variations}
            onVariationsChange={setVariations}
            items={rows}
            onItemsChange={setRows}
            skuPrefix={name}
          />
        </section>

        <div className="flex gap-3">
          <Button
            onClick={handleCreate}
            disabled={createProductMutation.isPending}
          >
            {createProductMutation.isPending ? 'Creating...' : 'Create'}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/products')}
            disabled={createProductMutation.isPending}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
