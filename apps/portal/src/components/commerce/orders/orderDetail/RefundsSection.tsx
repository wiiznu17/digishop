'use client'

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card'
import { StatusBadge, REFUND_STATUS_CLASS } from './StatusBadge'
import { VerticalTimeline, TimelineItem } from './VerticalTimeline'
import type { AdminRefundOrderLite } from '@/types/commerce/orders'

export function RefundsSection({
  refunds,
  THB
}: {
  refunds: AdminRefundOrderLite[]
  THB: (n?: number | null) => string
}) {
  if (!refunds || refunds.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Refund</CardTitle>
        <CardDescription>Refund status &amp; timeline</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {refunds.map((r) => {
          const items: TimelineItem[] = (r.timeline ?? []).map((t) => ({
            id: t.id,
            title: t.toStatus,
            time: new Date(t.createdAt).toLocaleString(),
            description: t.reason || undefined,
            footer: t.source ? `via ${t.source}` : undefined
          }))

          return (
            <div key={r.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">Refund #{r.id}</div>
                <div className="flex items-center gap-2">
                  <StatusBadge
                    text={r.status}
                    className={
                      REFUND_STATUS_CLASS[r.status] ??
                      'bg-muted text-foreground'
                    }
                  />
                  <span className="text-sm">
                    {THB(r.amountMinor)} {r.currencyCode}
                  </span>
                </div>
              </div>

              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
                <div>Requested by: {r.requestedBy ?? '—'}</div>
                <div>Reason: {r.reason ?? '—'}</div>
                <div>
                  Approved:{' '}
                  {r.approvedAt ? new Date(r.approvedAt).toLocaleString() : '—'}
                </div>
                <div>
                  Refunded:{' '}
                  {r.refundedAt ? new Date(r.refundedAt).toLocaleString() : '—'}
                </div>
              </div>

              <div className="mt-3">
                <div className="font-medium text-sm mb-2">Timeline</div>
                <VerticalTimeline items={items} emptyText="No events" />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
