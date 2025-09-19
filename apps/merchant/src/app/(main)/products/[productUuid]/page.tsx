"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { MerchantHeader } from "@/components/dashboard-header"
import {
  fetchProductDetailRequester,
  deleteProductRequester,
  duplicateProductRequester,
  updateProductItemRequester // toggle enable
} from "@/utils/requestUtils/requestProductUtils"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { ProductItemLite } from "@/types/props/productProp"

type ProductDetail = Awaited<ReturnType<typeof fetchProductDetailRequester>>

// ช่วย format วันที่ โดยไม่ต้อง cast any
const formatDate = (v: unknown) => {
  if (v instanceof Date) return v.toLocaleString()
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString()
  }
  return "-"
}

export default function ProductDetailPage() {
  const params = useParams<{ productUuid: string }>()
  const router = useRouter()
  const productUuid = params.productUuid

  const [data, setData] = useState<ProductDetail>(null)
  const [loading, setLoading] = useState<boolean>(false)

  // ===== Lightbox preview state =====
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)
  const [previewList, setPreviewList] = useState<
    { url: string; label?: string }[]
  >([])

  const openPreview = (list: { url: string; label?: string }[], index = 0) => {
    if (!list || list.length === 0) return
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
    const res = await fetchProductDetailRequester(productUuid)
    setLoading(false)
    setData(res)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productUuid])

  const handleDelete = async () => {
    if (!confirm("Delete this product?")) return
    const ok = await deleteProductRequester(productUuid)
    if (ok) router.push("/products")
  }

  const handleDuplicate = async () => {
    const res = await duplicateProductRequester(productUuid)
    if (res?.uuid) router.push(`/products/${res.uuid}/edit`)
  }

  // toggle isEnable แบบ optimistic update
  const handleToggleEnable = async (
    itemUuid: string,
    next: boolean,
    prev: boolean
  ) => {
    // optimistic
    setData((prevData) =>
      prevData
        ? ({
            ...prevData,
            items: (prevData.items ?? []).map((it) =>
              it.uuid === itemUuid ? { ...it, isEnable: next } : it
            )
          } as ProductDetail)
        : prevData
    )

    try {
      const res = await updateProductItemRequester(productUuid, itemUuid, {
        isEnable: next
      })
      if (!res) throw new Error("Update failed")
    } catch {
      // revert
      setData((prevData) =>
        prevData
          ? ({
              ...prevData,
              items: (prevData.items ?? []).map((it) =>
                it.uuid === itemUuid ? { ...it, isEnable: prev } : it
              )
            } as ProductDetail)
          : prevData
      )
      alert("Failed to update enable status")
    }
  }

  // ====== Derived UI values ======
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
      if (typeof it.priceMinor === "number") min = Math.min(min, it.priceMinor)
    }
    return Number.isFinite(min) ? min : null
  }, [data])

  const formatTHB = (minor: number | null) =>
    minor == null
      ? "-"
      : (minor / 100).toLocaleString("th-TH", {
          style: "currency",
          currency: "THB"
        })

  // แกลเลอรีทั้งหมดของ product
  const galleryList = useMemo(
    () => (data?.images ?? []).map((g) => ({ url: g.url, label: g.fileName })),
    [data]
  )

  return (
    <div>
      <MerchantHeader
        title="Product Detail"
        description="View product information"
      />

      <div className="p-4 space-y-6">
        {/* Loading / Not found */}
        {loading && (
          <div className="text-sm text-muted-foreground">Loading...</div>
        )}
        {!loading && !data && (
          <div className="text-sm text-destructive">Not found</div>
        )}

        {!loading && !!data && (
          <>
            {/* ===== Top Header Card ===== */}
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
                    title={mainImage ? "Click to preview" : undefined}
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
                    <CardDescription className="mt-1">
                      UUID: {data.uuid}
                    </CardDescription>
                    <p className="text-sm text-muted-foreground mt-2">
                      {data.description || "—"}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
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

                    {data.reqStatus === "REJECT" && !!data.rejectReason && (
                      <div className="mt-3 text-sm rounded-md border border-destructive/40 bg-destructive/10 text-destructive px-3 py-2">
                        <span className="font-medium">Rejected reason:</span>{" "}
                        <span className="opacity-90">{data.rejectReason}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/products")}
                  >
                    Back
                  </Button>
                  <Button variant="outline" onClick={handleDuplicate}>
                    Duplicate
                  </Button>
                  <Button
                    onClick={() => router.push(`/products/${data.uuid}/edit`)}
                  >
                    Edit
                  </Button>
                  <Button variant="destructive" onClick={handleDelete}>
                    Delete
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {/* Quick stats */}
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
                          (i) =>
                            (i as { isEnable?: boolean }).isEnable !== false
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

            {/* ===== Images ===== */}
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
                    {data.images.map((img, idx) => (
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

            {/* ===== Variations ===== */}
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
                {(data.variations ?? []).map((v) => (
                  <div key={v.uuid} className="rounded border p-3">
                    <div className="font-medium">{v.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-2">
                      {(v.options?.length ?? 0) > 0
                        ? v.options?.map((o) => (
                            <span
                              key={o.uuid}
                              className="px-2 py-1 rounded bg-muted/40 border"
                            >
                              {o.value}
                            </span>
                          ))
                        : "—"}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* ===== Items (SKUs) ===== */}
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
                        {(data.items ?? []).map((it) => {
                          const enabled =
                            (it as { isEnable?: boolean }).isEnable !== false
                          // รองรับทั้ง field เดิมและใหม่
                          const itemImgUrl =
                            (it as ProductItemLite).productItemImage?.url ??
                            it.imageUrl ??
                            null
                          const itemLabel =
                            it.sku ||
                            (it as ProductItemLite).productItemImage
                              ?.fileName ||
                            "Item image"
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
                              <td className="p-2">{it.sku || "-"}</td>
                              <td className="p-2 text-xs text-muted-foreground">
                                {(it.configurations ?? [])
                                  .map((c) => c.variationOption?.value)
                                  .filter(Boolean)
                                  .join(" · ") || "—"}
                              </td>
                              <td className="p-2 text-right">
                                {formatTHB(it.priceMinor ?? null)}
                              </td>
                              <td className="p-2 text-right">
                                {it.stockQuantity ?? 0}
                              </td>
                              <td className="p-2 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <Switch
                                    checked={enabled}
                                    onCheckedChange={(checked: boolean) =>
                                      handleToggleEnable(
                                        it.uuid,
                                        checked,
                                        enabled
                                      )
                                    }
                                    aria-label={`Toggle enable for ${it.sku}`}
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    {enabled ? "Enabled" : "Disabled"}
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

      {/* ===== Lightbox Preview ===== */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[70vw] lg:max-w-[60vw] p-0 overflow-hidden">
          <div className="relative bg-black">
            {previewList[previewIndex] && (
              <img
                src={previewList[previewIndex].url}
                alt={previewList[previewIndex].label ?? "preview"}
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
