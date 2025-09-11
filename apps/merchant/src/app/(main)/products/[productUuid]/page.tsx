// apps/merchant/src/app/(main)/products/[productUuid]/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { MerchantHeader } from "@/components/dashboard-header"
import {
  fetchProductDetailRequester,
  deleteProductRequester,
  duplicateProductRequester
} from "@/utils/requestUtils/requestProductUtils"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type ProductDetail = Awaited<ReturnType<typeof fetchProductDetailRequester>>

export default function ProductDetailPage() {
  const params = useParams<{ productUuid: string }>()
  const router = useRouter()
  const productUuid = params.productUuid

  const [data, setData] = useState<ProductDetail>(null)
  const [loading, setLoading] = useState<boolean>(false)

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

  // ====== Derived UI values ======
  const mainImage = useMemo(() => {
    const imgs = data?.images ?? []
    return imgs.find((i) => i.isMain) ?? imgs[0] ?? null
  }, [data])

  const totalStock = useMemo(() => {
    return (data?.items ?? []).reduce(
      (sum, it) => sum + (it.stockQuantity ?? 0),
      0
    )
  }, [data])

  const minPriceMinor = useMemo(() => {
    const items = data?.items ?? []
    if (items.length === 0) return null
    let min = Number.POSITIVE_INFINITY
    for (const it of items) {
      if (typeof it.priceMinor === "number") {
        min = Math.min(min, it.priceMinor)
      }
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
                  <div className="h-20 w-20 rounded-lg overflow-hidden bg-muted border">
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
                  </div>

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
                        Created:{" "}
                        {new Date(data.createdAt as any).toLocaleString()}
                      </div>
                      <div className="px-2 py-1 rounded border bg-muted/40">
                        Updated:{" "}
                        {new Date(data.updatedAt as any).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => router.push(`/products/${data.uuid}/edit`)}
                  >
                    Edit
                  </Button>
                  <Button variant="secondary" onClick={handleDuplicate}>
                    Duplicate
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/products")}
                  >
                    Back
                  </Button>
                  <Button variant="destructive" onClick={handleDelete}>
                    Delete
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                {/* Quick stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-muted-foreground">SKUs</div>
                    <div className="text-lg font-semibold">
                      {(data.items ?? []).length}
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
                    {data.images.map((img) => (
                      <div
                        key={img.uuid}
                        className="border rounded overflow-hidden"
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
                      </div>
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
                      {(v.options ?? []).length > 0
                        ? v.options.map((o) => (
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
                <CardTitle>Items (SKUs)</CardTitle>
                <CardDescription>Each sellable combination</CardDescription>
              </CardHeader>
              <CardContent>
                {(data.items ?? []).length === 0 && (
                  <div className="text-sm text-muted-foreground">No items</div>
                )}
                {(data.items ?? []).length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-[760px] w-full text-sm border rounded">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="text-left p-2">Image</th>
                          <th className="text-left p-2">SKU</th>
                          <th className="text-left p-2">Configurations</th>
                          <th className="text-right p-2">Price</th>
                          <th className="text-right p-2">Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data.items ?? []).map((it) => (
                          <tr key={it.uuid} className="border-t">
                            <td className="p-2">
                              {it.imageUrl ? (
                                <img
                                  src={it.imageUrl}
                                  alt={it.sku}
                                  className="h-10 w-10 rounded object-cover border"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded border flex items-center justify-center text-[10px] text-muted-foreground">
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
