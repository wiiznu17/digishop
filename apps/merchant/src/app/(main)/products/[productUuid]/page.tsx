"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { MerchantHeader } from "@/components/dashboard-header"
import {
  fetchProductDetailRequester,
  deleteProductRequester,
  duplicateProductRequester
} from "@/utils/requestUtils/requestProductUtils"

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

  return (
    <div>
      <MerchantHeader
        title="Product Detail"
        description="View product information"
      />
      <div className="p-4 space-y-4">
        {loading && (
          <div className="text-sm text-muted-foreground">Loading...</div>
        )}
        {!loading && !data && (
          <div className="text-sm text-destructive">Not found</div>
        )}
        {!loading && data && (
          <>
            {/* Head */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{data.name}</h2>
                <p className="text-xs text-neutral-500">UUID: {data.uuid}</p>
                <p className="text-sm text-muted-foreground">
                  {data.description ?? "-"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn"
                  onClick={() => router.push(`/products/${data.uuid}/edit`)}
                >
                  Edit
                </button>
                <button className="btn" onClick={handleDuplicate}>
                  Duplicate
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => router.push("/products")}
                >
                  Back
                </button>
                <button className="btn btn-destructive" onClick={handleDelete}>
                  Delete
                </button>
              </div>
            </div>

            {/* Images */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(data.images ?? []).map((img) => (
                <div key={img.uuid} className="border rounded overflow-hidden">
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

            {/* Variations */}
            <div className="space-y-2">
              <h3 className="font-semibold">Variations</h3>
              {(data.variations ?? []).length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No variations
                </div>
              )}
              {(data.variations ?? []).map((v) => (
                <div key={v.uuid}>
                  <div className="font-medium">{v.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {(v.options ?? []).map((o) => o.value).join(", ") || "-"}
                  </div>
                </div>
              ))}
            </div>

            {/* Items */}
            <div className="space-y-2">
              <h3 className="font-semibold">Items (SKUs)</h3>
              {(data.items ?? []).length === 0 && (
                <div className="text-sm text-muted-foreground">No items</div>
              )}
              {(data.items ?? []).map((it) => (
                <div key={it.uuid} className="border rounded p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div>SKU: {it.sku}</div>
                      <div>
                        Price:{" "}
                        {(it.priceMinor / 100).toLocaleString("th-TH", {
                          style: "currency",
                          currency: "THB"
                        })}
                      </div>
                      <div>Stock: {it.stockQuantity}</div>
                    </div>
                    {it.imageUrl ? (
                      <img
                        src={it.imageUrl}
                        alt={it.sku}
                        className="w-14 h-14 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded border flex items-center justify-center text-xs text-muted-foreground">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Config:{" "}
                    {(it.configurations ?? [])
                      .map((c) => c.variationOption?.value)
                      .filter(Boolean)
                      .join(" · ") || "-"}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
