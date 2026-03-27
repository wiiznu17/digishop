'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard-header'
import {
  fetchAdminProductDetailRequester,
  adminModerateProductRequester
} from '@/utils/requesters/productRequester'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  AdminProductDetail,
  AdminProductImage,
  AdminProductItem,
  AdminProductItemConfiguration,
  AdminVariation,
  AdminVariationOption
} from '@/types/admin/catalog'
import AuthGuard from '@/components/AuthGuard'

const fmtTHB = (minor?: number | null) =>
  minor == null
    ? '-'
    : (minor / 100).toLocaleString('th-TH', {
        style: 'currency',
        currency: 'THB'
      })

const formatDate = (v: unknown) => {
  if (v instanceof Date) return v.toLocaleString()
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString()
  }
  return '-'
}

function AdminProductDetailPage() {
  const { uuid } = useParams<{ uuid: string }>()
  const router = useRouter()
  const [data, setData] = useState<AdminProductDetail | null>(null)
  const [loading, setLoading] = useState(false)

  // preview
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [previewList, setPreviewList] = useState<
    { url: string; label?: string }[]
  >([])
  const openPreview = (list: { url: string; label?: string }[], index = 0) => {
    if (!list?.length) return
    setPreviewList(list)
    setPreviewIndex(Math.max(0, Math.min(index, list.length - 1)))
    setPreviewOpen(true)
  }
  const nextPreview = () =>
    setPreviewIndex((i) => (i + 1) % Math.max(1, previewList.length))
  const prevPreview = () =>
    setPreviewIndex(
      (i) =>
        (i - 1 + Math.max(1, previewList.length)) %
        Math.max(1, previewList.length)
    )

  const load = async () => {
    setLoading(true)
    const res = await fetchAdminProductDetailRequester(uuid)
    setLoading(false)
    setData(res)
  }
  useEffect(() => {
    void load()
  }, [uuid])

  const mainImage = useMemo(() => {
    const imgs = data?.images ?? []
    return imgs.find((i) => i.isMain) ?? imgs[0] ?? null
  }, [data])

  const totalStock = useMemo(
    () =>
      (data?.items ?? []).reduce((sum, it) => sum + (it.stockQuantity ?? 0), 0),
    [data]
  )
  const minPriceMinor = useMemo(() => {
    const items = data?.items ?? []
    if (items.length === 0) return null
    let min = Number.POSITIVE_INFINITY
    for (const it of items) {
      if (typeof it.priceMinor === 'number') min = Math.min(min, it.priceMinor)
    }
    return Number.isFinite(min) ? min : null
  }, [data])

  // Moderate (PENDING -> APPROVED|REJECT)
  const onApprove = async () => {
    const ok = await adminModerateProductRequester(uuid, {
      reqStatus: 'APPROVED'
    })
    if (ok) await load()
  }
  const onReject = async () => {
    const reason = window.prompt('Reject reason?')
    if (!reason) return
    const ok = await adminModerateProductRequester(uuid, {
      reqStatus: 'REJECT',
      rejectReason: reason
    })
    if (ok) await load()
  }

  const galleryList = useMemo(
    () =>
      (data?.images ?? []).map((g: AdminProductImage) => ({
        url: g.url,
        label: g.fileName
      })),
    [data]
  )

  return (
    <div>
      <DashboardHeader title="Product Detail" description="Admin view" />
      <div className="p-4 space-y-6">
        {loading && (
          <div className="text-sm text-muted-foreground">Loading...</div>
        )}
        {!loading && !data && (
          <div className="text-sm text-destructive">Not found</div>
        )}

        {!loading && !!data && (
          <>
            <Card>
              <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                  <button
                    type="button"
                    className="h-60 w-60 rounded-lg overflow-hidden bg-muted border cursor-zoom-in"
                    onClick={() =>
                      mainImage &&
                      openPreview(
                        galleryList,
                        Math.max(
                          0,
                          galleryList.findIndex((g) => g.url === mainImage.url)
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
                      <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                        No image
                      </div>
                    )}
                  </button>

                  <div>
                    <CardTitle className="text-xl">{data.name}</CardTitle>
                    {/* <CardDescription className="mt-1">
                      UUID: {data.uuid}
                    </CardDescription> */}
                    <p className="text-sm text-muted-foreground mt-2">
                      {data.description || '—'}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {data.store?.storeName && (
                        <div className="px-2 py-1 rounded border bg-muted/40">
                          Store: {data.store.storeName}
                        </div>
                      )}
                      {data.category?.name && (
                        <div className="px-2 py-1 rounded border bg-muted/40">
                          Category: {data.category.name}
                        </div>
                      )}
                      <div className="px-2 py-1 rounded border bg-muted/40">
                        Status: {data.status}
                      </div>
                      <div className="px-2 py-1 rounded border bg-muted/40">
                        Approval: {data.reqStatus}
                      </div>
                      <div className="px-2 py-1 rounded border bg-muted/40">
                        Created: {formatDate(data.createdAt)}
                      </div>
                      <div className="px-2 py-1 rounded border bg-muted/40">
                        Updated: {formatDate(data.updatedAt)}
                      </div>
                    </div>

                    {data.reqStatus === 'REJECT' && !!data.rejectReason && (
                      <div className="mt-3 text-sm rounded-md border border-destructive/40 bg-destructive/10 text-destructive px-3 py-2">
                        <span className="font-medium">Rejected reason:</span>{' '}
                        <span className="opacity-90">{data.rejectReason}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/admin/products')}
                  >
                    Back
                  </Button>
                  {data.reqStatus === 'PENDING' && (
                    <>
                      <Button onClick={onApprove}>Approve</Button>
                      <Button variant="destructive" onClick={onReject}>
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
                          (i: AdminProductItem) =>
                            (i.isEnable ?? true) !== false
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
                      {fmtTHB(minPriceMinor)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Images */}
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {data.images.map((img: AdminProductImage, idx: number) => (
                      <button
                        key={img.uuid}
                        type="button"
                        className="border rounded overflow-hidden cursor-zoom-in"
                        onClick={() => openPreview(galleryList, idx)}
                        title="Click to preview"
                      >
                        <img
                          src={img.url}
                          alt={img.fileName}
                          className="w-full aspect-square object-cover"
                        />
                        <div className="p-2 text-xs flex items-center justify-between">
                          <span className="truncate">{img.fileName}</span>
                          {img.isMain && (
                            <span className="px-1 rounded bg-yellow-200 text-yellow-900">
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

            {/* Variations */}
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
                {(data.variations ?? []).map((v: AdminVariation) => (
                  <div key={v.uuid} className="rounded border p-3">
                    <div className="font-medium">{v.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-2">
                      {(v.options?.length ?? 0) > 0
                        ? v.options?.map((o: AdminVariationOption) => (
                            <span
                              key={o.uuid}
                              className="px-2 py-1 rounded bg-muted/40 border"
                            >
                              {o.value}
                            </span>
                          ))
                        : '—'}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Items */}
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
                    <table className="min-w-[900px] w-full text-sm border rounded">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="text-left p-2">Image</th>
                          <th className="text-left p-2">SKU</th>
                          <th className="text-left p-2">Configurations</th>
                          <th className="text-right p-2">Price</th>
                          <th className="text-right p-2">Stock</th>
                          <th className="text-center p-2">Enable</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data.items ?? []).map((it: AdminProductItem) => {
                          const enabled = (it.isEnable ?? true) !== false
                          const itemImgUrl =
                            it.productItemImage?.url ?? it.imageUrl ?? null
                          const itemLabel =
                            it.sku ||
                            it.productItemImage?.fileName ||
                            'Item image'
                          return (
                            <tr key={it.uuid} className="border-t">
                              <td className="p-2">
                                {itemImgUrl ? (
                                  <button
                                    type="button"
                                    className="h-20 w-20 rounded object-cover border overflow-hidden cursor-zoom-in"
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
                                  <div className="h-20 w-20 rounded border flex items-center justify-center text-[10px] text-muted-foreground">
                                    No Image
                                  </div>
                                )}
                              </td>
                              <td className="p-2">{it.sku || '-'}</td>
                              <td className="p-2 text-xs text-muted-foreground">
                                {(it.configurations ?? [])
                                  .map(
                                    (c: AdminProductItemConfiguration) =>
                                      c.variationOption?.value
                                  )
                                  .filter(Boolean)
                                  .join(' · ') || '—'}
                              </td>
                              <td className="p-2 text-right">
                                {fmtTHB(it.priceMinor ?? null)}
                              </td>
                              <td className="p-2 text-right">
                                {it.stockQuantity ?? 0}
                              </td>
                              <td className="p-2 text-center">
                                <Badge variant="outline">
                                  {enabled ? 'Enabled' : 'Disabled'}
                                </Badge>
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

      {/* Lightbox */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[70vw] lg:max-w-[60vw] p-0 overflow-hidden">
          {/* A11y: ต้องมี DialogTitle เสมอ ถ้าไม่อยากแสดง ใช้ sr-only */}
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
            {previewList[previewIndex]?.label}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Guard({ children }: { children: React.ReactNode }) {
  'use client'
  return <AuthGuard requiredPerms={['PRODUCTS_READ']}>{children}</AuthGuard>
}

export default function DeatailPage() {
  return (
    <Guard>
      <AdminProductDetailPage />
    </Guard>
  )
}
