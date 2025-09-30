"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { fetchAdminOrderDetailRequester } from "@/utils/requesters/orderRequester"
import type {
  AdminOrderDetail,
  AdminOrderStatus
} from "@/types/commerce/orders"
import { OrderHeaderCard } from "@/components/commerce/orders/orderDetail/OrderHeaderCard"
import { ItemsTable } from "@/components/commerce/orders/orderDetail/ItemsTable"
import { ShippingSection } from "@/components/commerce/orders/orderDetail/ShippingSection"
import { RefundsSection } from "@/components/commerce/orders/orderDetail/RefundsSection"
import {
  VerticalTimeline,
  TimelineItem
} from "@/components/commerce/orders/orderDetail/VerticalTimeline"

const THB = (n?: number | null) =>
  n == null
    ? "-"
    : (n / 100).toLocaleString("th-TH", { style: "currency", currency: "THB" })

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<AdminOrderDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const res = await fetchAdminOrderDetailRequester(Number(id))
      setLoading(false)
      setData(res)
    }
    void load()
  }, [id])

  const totals = useMemo(
    () => ({
      subtotal: THB(data?.subtotalMinor),
      shipping: THB(data?.shippingFeeMinor),
      tax: THB(data?.taxTotalMinor),
      discount: THB(data?.discountTotalMinor ? -data!.discountTotalMinor : 0),
      grand: THB(data?.grandTotalMinor)
    }),
    [data]
  )

  // Shipping timeline = filter from order timeline
  const shippingTimeline = useMemo(() => {
    if (!data) return []
    const shipStates: AdminOrderStatus[] = [
      "HANDED_OVER",
      "SHIPPED",
      "DELIVERED",
      "REFUND_REQUEST",
      "REFUND_PROCESSING",
      "REFUND_SUCCESS",
      "REFUND_FAIL",
      "MERCHANT_CANCELED"
    ]
    return data.timeline.filter((t) => shipStates.includes(t.toStatus))
  }, [data])

  // Full order timeline items for the generic component
  const orderTimelineItems: TimelineItem[] = useMemo(
    () =>
      (data?.timeline ?? []).map((t) => ({
        id: t.id,
        title: t.toStatus,
        time: new Date(t.createdAt).toLocaleString(),
        description: t.reason || undefined,
        footer: t.source ? `via ${t.source}` : undefined
      })),
    [data]
  )

  return (
    <div>
      <DashboardHeader title="Order Detail" description="Admin view" />
      <div className="p-4 space-y-6">
        {loading && (
          <div className="text-sm text-muted-foreground">Loading...</div>
        )}
        {!loading && !data && (
          <div className="text-sm text-destructive">Not found</div>
        )}

        {!!data && (
          <>
            <OrderHeaderCard data={data} totalText={totals.grand} />

            <ItemsTable items={data.items} totals={totals} THB={THB} />

            <ShippingSection
              data={data}
              // shippingTimeline={shippingTimeline}
              THB={THB}
            />

            {/* Order Timeline (ใช้คอมโพเนนต์เดียวกับ Shipping/Refund) */}
            <div className="rounded-xl border">
              <div className="p-4">
                <div className="text-base font-semibold">Order Timeline</div>
              </div>
              <div className="px-4 pb-4">
                <VerticalTimeline
                  items={orderTimelineItems}
                  emptyText="No status changes"
                />
              </div>
            </div>
            {!!data.refunds && (
              <RefundsSection refunds={data.refunds} THB={THB} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
