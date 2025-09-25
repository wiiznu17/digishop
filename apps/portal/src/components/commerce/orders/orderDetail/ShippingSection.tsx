"use client"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card"
import { VerticalTimeline, TimelineItem } from "./VerticalTimeline"
import type {
  AdminOrderDetail,
  AdminOrderStatus
} from "@/types/commerce/orders"

export function ShippingSection({
  data,
  shippingTimeline,
  THB
}: {
  data: AdminOrderDetail
  shippingTimeline: {
    id: number
    toStatus: AdminOrderStatus
    createdAt: string | Date
    reason?: string | null
    source?: string | null
  }[]
  THB: (n?: number | null) => string
}) {
  const items: TimelineItem[] = shippingTimeline.map((t) => ({
    id: t.id,
    title: t.toStatus,
    time: new Date(t.createdAt).toLocaleString(),
    description: t.reason || undefined,
    footer: t.source ? `via ${t.source}` : undefined
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipping</CardTitle>
        <CardDescription>Info &amp; timeline</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!data.shipping && (
          <div className="text-sm text-muted-foreground">No shipping info</div>
        )}

        {!!data.shipping && (
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Carrier:</span>{" "}
              {data.shipping.carrier ?? "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Tracking:</span>{" "}
              {data.shipping.trackingNumber ?? "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Method:</span>{" "}
              {data.shipping.shippingTypeName} (
              {THB(data.shipping.shippingPriceMinor)})
            </div>
            <div>
              <span className="text-muted-foreground">Shipped at:</span>{" "}
              {data.shipping.shippedAt
                ? new Date(data.shipping.shippedAt).toLocaleString()
                : "—"}
            </div>
          </div>
        )}

        <div>
          <div className="font-medium mb-2">Shipping Timeline</div>
          <VerticalTimeline items={items} emptyText="No shipping events" />
        </div>
      </CardContent>
    </Card>
  )
}
