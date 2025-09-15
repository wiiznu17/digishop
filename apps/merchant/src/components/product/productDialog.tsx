"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { ProductListResponse } from "@/utils/requestUtils/requestProductUtils"

type ProductRow = ProductListResponse["data"][number]

interface ProductDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  product: ProductRow | null
}

/**
 * View-only quick view dialog (ใช้กับปุ่ม eye ใน product list)
 * แสดงข้อมูล + ปุ่ม "View detail" เท่านั้น
 */
export function ProductDialog({
  isOpen,
  onOpenChange,
  product
}: ProductDialogProps) {
  const router = useRouter()

  // lightbox states
  const gallery = useMemo(
    () =>
      (product?.images ?? []).map((g) => ({ url: g.url, label: g.fileName })),
    [product]
  )
  const [idx, setIdx] = useState(0)
  const hasMulti = gallery.length > 1
  const next = () => setIdx((i) => (i + 1) % Math.max(1, gallery.length))
  const prev = () =>
    setIdx(
      (i) => (i - 1 + Math.max(1, gallery.length)) % Math.max(1, gallery.length)
    )

  const main = product?.images?.[0] ?? null
  const totalImages =
    (product as any)?.totalImageCount ??
    ((product as any)?.productImageCount ?? 0) +
      ((product as any)?.itemImageCount ?? 0)

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{product?.name ?? "-"}</span>
            {product?.status && (
              <Badge variant="secondary">{product.status}</Badge>
            )}
          </DialogTitle>
          <DialogDescription>UUID: {product?.uuid}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          {/* left: image preview */}
          <Card className="p-0 overflow-hidden">
            <div className="relative bg-black">
              {gallery[idx] ? (
                <img
                  src={gallery[idx].url}
                  alt={gallery[idx].label ?? "preview"}
                  className="w-full max-h-[380px] object-contain"
                />
              ) : main ? (
                <img
                  src={main.url}
                  alt={main.fileName}
                  className="w-full max-h-[380px] object-contain"
                />
              ) : (
                <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                  No image
                </div>
              )}

              {hasMulti && (
                <>
                  <button
                    type="button"
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                    onClick={prev}
                    aria-label="Prev"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white transition-colors"
                    onClick={next}
                    aria-label="Next"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
            <div className="px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
              <span className="truncate">
                {gallery[idx]?.label ?? main?.fileName ?? "-"}
              </span>
              <span>{totalImages ?? 0} images</span>
            </div>
          </Card>

          {/* right: info */}
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {product?.description || "—"}
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded border p-2">
                <div className="text-xs text-muted-foreground">Category</div>
                <div className="font-medium">
                  {product?.category?.name ?? "—"}
                </div>
              </div>
              <div className="rounded border p-2">
                <div className="text-xs text-muted-foreground">
                  Images (total)
                </div>
                <div className="font-medium">{totalImages ?? 0}</div>
              </div>
              <div className="rounded border p-2">
                <div className="text-xs text-muted-foreground">Min price</div>
                <div className="font-medium">
                  {product?.minPriceMinor != null
                    ? (Number(product.minPriceMinor) / 100).toLocaleString(
                        "th-TH",
                        { style: "currency", currency: "THB" }
                      )
                    : "-"}
                </div>
              </div>
              <div className="rounded border p-2">
                <div className="text-xs text-muted-foreground">Total stock</div>
                <div className="font-medium">
                  {Number(product?.totalStock ?? 0)}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                className="w-full"
                onClick={() => {
                  if (!product?.uuid) return
                  onOpenChange(false)
                  router.push(`/products/${product.uuid}`)
                }}
              >
                View detail
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ProductDialog
