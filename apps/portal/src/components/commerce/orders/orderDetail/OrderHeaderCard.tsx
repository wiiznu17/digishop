'use client'

import { useRouter } from 'next/navigation'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  StatusBadge,
  ORDER_STATUS_CLASS,
  PAYMENT_STATUS_CLASS
} from './StatusBadge'
import type { AdminOrderDetail } from '@/types/commerce/orders'

export function OrderHeaderCard({
  data,
  totalText
}: {
  data: AdminOrderDetail
  totalText: string
}) {
  const router = useRouter()
  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle className="text-xl">{data.orderCode}</CardTitle>
          <CardDescription>Order ID: {data.id}</CardDescription>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <StatusBadge
              text={data.status}
              className={ORDER_STATUS_CLASS[data.status]}
            />
            <span className="px-2 py-1 rounded border bg-muted/40">
              Created: {new Date(data.createdAt).toLocaleString()}
            </span>
            <span className="px-2 py-1 rounded border bg-muted/40">
              Updated: {new Date(data.updatedAt).toLocaleString()}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/orders')}
          >
            Back
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Customer</div>
            <div className="text-sm">
              {data.customer ? (
                <>
                  <button
                    className="font-semibold hover:text-primary"
                    title="Open customer detail"
                    onClick={() =>
                      router.push(`/admin/customers/${data.customer!.id}`)
                    }
                  >
                    {data.customer.name}
                  </button>
                  <div className="text-xs text-muted-foreground">
                    {data.customer.email}
                  </div>
                </>
              ) : (
                '—'
              )}
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Store</div>
            <div className="text-sm">
              {data.store ? (
                <span title={data.store.uuid}>{data.store.name}</span>
              ) : (
                '—'
              )}
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Grand Total</div>
            <div className="text-lg font-semibold">{totalText}</div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Payment</div>
            <div className="text-sm">
              {data.payment ? (
                <div className="flex items-center gap-2">
                  <StatusBadge
                    text={data.payment.status}
                    className={
                      PAYMENT_STATUS_CLASS[data.payment.status] ??
                      'bg-muted text-foreground'
                    }
                  />
                  <span className="text-xs text-muted-foreground">
                    {data.payment.channel}
                  </span>
                </div>
              ) : (
                '—'
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
