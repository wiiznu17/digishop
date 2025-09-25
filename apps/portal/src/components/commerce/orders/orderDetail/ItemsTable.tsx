"use client"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card"
import type { AdminOrderDetail } from "@/types/commerce/orders"

export function ItemsTable({
  items,
  totals,
  THB
}: {
  items: AdminOrderDetail["items"]
  totals: {
    subtotal: string
    shipping: string
    tax: string
    discount: string
    grand: string
  }
  THB: (n?: number | null) => string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Items</CardTitle>
        <CardDescription>
          Latest product/sku info (fallback to snapshot)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 && (
          <div className="text-sm text-muted-foreground">No items</div>
        )}
        {items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm border rounded">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left p-2">Image</th>
                  <th className="text-left p-2">Product</th>
                  <th className="text-left p-2">SKU</th>
                  <th className="text-left p-2">Options</th>
                  <th className="text-right p-2">Unit</th>
                  <th className="text-right p-2">Qty</th>
                  <th className="text-right p-2">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-t">
                    <td className="p-2">
                      {it.productImage ? (
                        <img
                          src={it.productImage}
                          alt={it.productName}
                          className="h-16 w-16 rounded object-cover border"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded border flex items-center justify-center text-[10px] text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </td>
                    <td className="p-2">
                      <div className="flex flex-col">
                        <span className="font-medium">{it.productName}</span>
                        {it.productUuid && (
                          <button
                            className="text-xs text-primary hover:underline w-fit"
                            onClick={() =>
                              window.open(
                                `/admin/products/${it.productUuid}`,
                                "_blank"
                              )
                            }
                          >
                            Open latest product
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-2">{it.productSku ?? "—"}</td>
                    <td className="p-2 text-xs text-muted-foreground">
                      {it.optionsText ?? "—"}
                    </td>
                    <td className="p-2 text-right">{THB(it.unitPriceMinor)}</td>
                    <td className="p-2 text-right">{it.quantity}</td>
                    <td className="p-2 text-right">{THB(it.lineTotalMinor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-start-3 md:col-span-3 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span>{totals.subtotal}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Shipping</span>
              <span>{totals.shipping}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tax</span>
              <span>{totals.tax}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Discount</span>
              <span>{totals.discount}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{totals.grand}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
