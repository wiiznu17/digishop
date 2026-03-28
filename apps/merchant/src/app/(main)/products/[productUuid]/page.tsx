'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MerchantHeader } from '@/components/dashboard-header'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductItemLite } from '@/types/props/productProp'
import { useProductDetailQuery } from '@/hooks/queries/useProductQueries'
import {
  useDeleteProductDetailMutation,
  useDuplicateProductMutation,
  useToggleProductItemMutation
} from '@/hooks/mutations/useProductDetailMutations'

const formatDate = (value: unknown) => {
  if (value instanceof Date) return value.toLocaleString()
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString()
  }
  return '-'
}

export default function ProductDetailPage() {
  const { productUuid } = useParams<{ productUuid: string }>()
  const router = useRouter()
  const { data, isLoading, isError } = useProductDetailQuery(productUuid)
  const deleteProductMutation = useDeleteProductDetailMutation(productUuid)
  const duplicateProductMutation = useDuplicateProductMutation()
  const toggleProductItemMutation = useToggleProductItemMutation(productUuid)

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [previewList, setPreviewList] = useState<
    { url: string; label?: string }[]
  >([])

  const openPreview = (list: { url: string; label?: string }[], index = 0) => {
    if (list.length === 0) return
    setPreviewList(list)
    setPreviewIndex(Math.max(0, Math.min(index, list.length - 1)))
    setPreviewOpen(true)
  }

  const nextPreview = () => {
    setPreviewIndex((index) => (index + 1) % Math.max(1, previewList.length))
  }

  const prevPreview = () => {
    setPreviewIndex(
      (index) =>
        (index - 1 + Math.max(1, previewList.length)) %
        Math.max(1, previewList.length)
    )
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this product?')) return

    try {
      await deleteProductMutation.mutateAsync()
      router.push('/products')
    } catch {
      // toast handled in mutation hook
    }
  }

  const handleDuplicate = async () => {
    try {
      const duplicated = await duplicateProductMutation.mutateAsync(productUuid)
      router.push(`/products/${duplicated.uuid}/edit`)
    } catch {
      // toast handled in mutation hook
    }
  }

  const handleToggleEnable = async (itemUuid: string, next: boolean) => {
    try {
      await toggleProductItemMutation.mutateAsync({ itemUuid, next })
    } catch {
      // toast handled in mutation hook
    }
  }

  const mainImage = useMemo(() => {
    const images = data?.images ?? []
    return images.find((image) => image.isMain) ?? images[0] ?? null
  }, [data])

  const totalStock = useMemo(
    () =>
      (data?.items ?? []).reduce(
        (sum, item) => sum + (item.stockQuantity ?? 0),
        0
      ),
    [data]
  )

  const minPriceMinor = useMemo(() => {
    const items = data?.items ?? []
    if (items.length === 0) return null

    let min = Number.POSITIVE_INFINITY
    for (const item of items) {
      if (typeof item.priceMinor === 'number') {
        min = Math.min(min, item.priceMinor)
      }
    }

    return Number.isFinite(min) ? min : null
  }, [data])

  const formatTHB = (minor: number | null) =>
    minor == null
      ? '-'
      : (minor / 100).toLocaleString('th-TH', {
          style: 'currency',
          currency: 'THB'
        })

  const galleryList = useMemo(
    () =>
      (data?.images ?? []).map((image) => ({
        url: image.url,
        label: image.fileName
      })),
    [data]
  )

  return (
    <div>
      <MerchantHeader
        title="Product Detail"
        description="View product information"
      />

      <div className="space-y-6 p-4">
        {isLoading && (
          <div className="text-sm text-muted-foreground">Loading...</div>
        )}
        {!isLoading && (isError || !data) && (
          <div className="text-sm text-destructive">Not found</div>
        )}

        {!isLoading && data && (
          <>
            <Card>
              <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                  <button
                    type="button"
                    className="h-60 w-60 overflow-hidden rounded-lg border bg-muted"
                    onClick={() =>
                      mainImage &&
                      openPreview(
                        galleryList,
                        Math.max(
                          0,
                          galleryList.findIndex(
                            (image) => image.url === mainImage.url
                          )
                        )
                      )
                    }
                    title={mainImage ? 'Click to preview' : undefined}
                  >
                    {mainImage ? (
                      <img
                        src={mainImage.url}
                        alt={mainImage.fileName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        No image
                      </div>
                    )}
                  </button>

                  <div>
                    <CardTitle className="text-xl">{data.name}</CardTitle>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {data.description || '—'}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {data.category?.name && (
                        <div className="rounded border bg-muted/40 px-2 py-1">
                          Category: {data.category.name}
                        </div>
                      )}
                      <div className="rounded border bg-muted/40 px-2 py-1">
                        Status: {data.status}
                      </div>
                      <div className="rounded border bg-muted/40 px-2 py-1">
                        Approval: {data.reqStatus}
                      </div>
                      <div className="rounded border bg-muted/40 px-2 py-1">
                        Created: {formatDate(data.createdAt)}
                      </div>
                      <div className="rounded border bg-muted/40 px-2 py-1">
                        Updated: {formatDate(data.updatedAt)}
                      </div>
                    </div>

                    {data.reqStatus === 'REJECT' && !!data.rejectReason && (
                      <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        <span className="font-medium">Rejected reason:</span>{' '}
                        <span className="opacity-90">{data.rejectReason}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/products')}
                  >
                    Back
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDuplicate}
                    disabled={duplicateProductMutation.isPending}
                  >
                    Duplicate
                  </Button>
                  <Button
                    onClick={() => router.push(`/products/${data.uuid}/edit`)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteProductMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">SKUs</div>
                    <div className="text-lg font-semibold">
                      {(data.items ?? []).length}
                    </div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">
                      Enabled SKUs
                    </div>
                    <div className="text-lg font-semibold">
                      {
                        (data.items ?? []).filter(
                          (item) =>
                            (item as { isEnable?: boolean }).isEnable !== false
                        ).length
                      }
                    </div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">
                      Total Stock
                    </div>
                    <div className="text-lg font-semibold">{totalStock}</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">
                      Min Price
                    </div>
                    <div className="text-lg font-semibold">
                      {formatTHB(minPriceMinor)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
                <CardDescription>Gallery</CardDescription>
              </CardHeader>
              <CardContent>
                {(!data.images || data.images.length === 0) && (
                  <div className="text-sm text-muted-foreground">No images</div>
                )}
                {data.images && data.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {data.images.map((image, index) => (
                      <button
                        key={image.uuid}
                        type="button"
                        className="overflow-hidden rounded border"
                        onClick={() => openPreview(galleryList, index)}
                        title="Click to preview"
                      >
                        <img
                          src={image.url}
                          alt={image.fileName}
                          className="aspect-square w-full object-cover"
                        />
                        <div className="flex items-center justify-between p-2 text-xs">
                          <span className="truncate">{image.fileName}</span>
                          {image.isMain && (
                            <span className="rounded bg-yellow-200 px-1 text-yellow-900">
                              Main
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Variations</CardTitle>
                <CardDescription>Options of this product</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(data.variations ?? []).length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    No variations
                  </div>
                )}
                {(data.variations ?? []).map((variation) => (
                  <div key={variation.uuid} className="rounded border p-3">
                    <div className="font-medium">{variation.name}</div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {(variation.options?.length ?? 0) > 0
                        ? variation.options?.map((option) => (
                            <span
                              key={option.uuid}
                              className="rounded border bg-muted/40 px-2 py-1"
                            >
                              {option.value}
                            </span>
                          ))
                        : '—'}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Items (SKUs)</CardTitle>
                <CardDescription>Each sellable combination</CardDescription>
              </CardHeader>
              <CardContent>
                {(data.items ?? []).length === 0 && (
                  <div className="text-sm text-muted-foreground">No items</div>
                )}
                {(data.items ?? []).length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-[900px] w-full rounded border text-sm">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="p-2 text-left">Image</th>
                          <th className="p-2 text-left">SKU</th>
                          <th className="p-2 text-left">Configurations</th>
                          <th className="p-2 text-right">Price</th>
                          <th className="p-2 text-right">Stock</th>
                          <th className="p-2 text-center">Enable</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data.items ?? []).map((item) => {
                          const enabled =
                            (item as { isEnable?: boolean }).isEnable !== false
                          const itemImgUrl =
                            (item as ProductItemLite).productItemImage?.url ??
                            item.imageUrl ??
                            null
                          const itemLabel =
                            item.sku ||
                            (item as ProductItemLite).productItemImage
                              ?.fileName ||
                            'Item image'

                          return (
                            <tr key={item.uuid} className="border-t">
                              <td className="p-2">
                                {itemImgUrl ? (
                                  <button
                                    type="button"
                                    className="h-20 w-20 overflow-hidden rounded border"
                                    onClick={() =>
                                      openPreview(
                                        [{ url: itemImgUrl, label: itemLabel }],
                                        0
                                      )
                                    }
                                    title="Click to preview"
                                  >
                                    <img
                                      src={itemImgUrl}
                                      alt={itemLabel}
                                      className="h-full w-full object-cover"
                                    />
                                  </button>
                                ) : (
                                  <div className="flex h-20 w-20 items-center justify-center rounded border text-[10px] text-muted-foreground">
                                    No Image
                                  </div>
                                )}
                              </td>
                              <td className="p-2">{item.sku || '-'}</td>
                              <td className="p-2 text-xs text-muted-foreground">
                                {(item.configurations ?? [])
                                  .map(
                                    (config) => config.variationOption?.value
                                  )
                                  .filter(Boolean)
                                  .join(' · ') || '—'}
                              </td>
                              <td className="p-2 text-right">
                                {formatTHB(item.priceMinor ?? null)}
                              </td>
                              <td className="p-2 text-right">
                                {item.stockQuantity ?? 0}
                              </td>
                              <td className="p-2 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Switch
                                    checked={enabled}
                                    onCheckedChange={(checked: boolean) =>
                                      handleToggleEnable(item.uuid, checked)
                                    }
                                    disabled={
                                      toggleProductItemMutation.isPending
                                    }
                                    aria-label={`Toggle enable for ${item.sku}`}
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    {enabled ? 'Enabled' : 'Disabled'}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-[90vw] md:max-w-[70vw] lg:max-w-[60vw]">
          <DialogHeader>
            <DialogTitle className="sr-only">Image preview</DialogTitle>
          </DialogHeader>

          <div className="relative bg-black">
            {previewList[previewIndex] && (
              <img
                src={previewList[previewIndex].url}
                alt={previewList[previewIndex].label ?? 'preview'}
                className="max-h-[80vh] w-full object-contain"
              />
            )}

            {previewList.length > 1 && (
              <>
                <button
                  type="button"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 transition-colors hover:bg-white"
                  onClick={prevPreview}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 transition-colors hover:bg-white"
                  onClick={nextPreview}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          <div className="truncate px-4 py-2 text-sm text-muted-foreground">
            {previewList[previewIndex]?.label}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
