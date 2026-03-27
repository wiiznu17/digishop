'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  CreditCard,
  User,
  Calendar,
  Phone,
  Mail,
  Clock,
  Undo2
} from 'lucide-react'

import { MerchantHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'

import { Order, OrderStatus } from '@/types/props/orderProp'
import { OrderStatusManager } from '@/components/order/orderManager'
import { useOrderStatus } from '@/hooks/useOrderStatus'
import {
  getOrderByIdRequester,
  handOverOrderRequester,
  updateOrderRequester
} from '@/utils/requestUtils/requestOrderUtils'
import { useToast } from '@/hooks/use-toast'

/** ---------- helpers ---------- */
const fmtTHB = (n?: number) =>
  `฿${(n ?? 0).toLocaleString('th-TH', { maximumFractionDigits: 0 })}`

const fmtDate = (iso?: string) =>
  iso
    ? new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(new Date(iso))
    : '-'

/** ---------- page ---------- */
export default function OrderDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const orderId = params.id
  const { toast } = useToast()
  const { getStatusBadgeColor, getStatusIcon, getStatusText } = useOrderStatus()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // fetch
  useEffect(() => {
    const ac = new AbortController()
    setLoading(true)
    getOrderByIdRequester(orderId, ac.signal)
      .then((res) => setOrder(res.data))
      .finally(() => setLoading(false))
    return () => ac.abort()
  }, [orderId])

  // actions (reuse logic จากหน้า list)
  const handleStatusChange = async (id: string, newStatus: OrderStatus) => {
    if (!order || order.id !== id) return
    const prev = order
    setOrder({
      ...order,
      status: newStatus,
      statusHistory: [...(order.statusHistory ?? [order.status]), newStatus]
    })
    try {
      const res = await updateOrderRequester(id, { status: newStatus })
      setOrder(res.data)
      toast({
        title: 'Status updated',
        description: getStatusText(res.data.status)
      })
    } catch (e) {
      setOrder(prev)
      toast({ title: 'Failed to update', variant: 'destructive' })
    }
  }

  const handleTrackingNumberUpdate = async (
    id: string,
    trackingNumber: string
  ) => {
    if (!order || order.id !== id) return
    const prev = order
    setOrder({ ...order, trackingNumber })
    try {
      const res = await updateOrderRequester(id, { trackingNumber })
      setOrder(res.data)
      toast({ title: 'Tracking updated' })
    } catch (e) {
      setOrder(prev)
      toast({ title: 'Failed to update tracking', variant: 'destructive' })
    }
  }

  const handleHandedOver = async (
    id: string,
    trackingNumber: string,
    carrier?: string
  ) => {
    if (!order || order.id !== id) return
    const prev = order
    setOrder({
      ...order,
      status: 'HANDED_OVER',
      statusHistory: [
        ...(order.statusHistory ?? [order.status]),
        'HANDED_OVER'
      ],
      trackingNumber
    })
    try {
      const res = await handOverOrderRequester(id, trackingNumber, carrier)
      setOrder(res.data)
      toast({ title: 'Parcel handed over' })
    } catch (e) {
      setOrder(prev)
      toast({ title: 'Failed to hand over', variant: 'destructive' })
    }
  }

  /** derived */
  const shippingEvents = useMemo(() => order?.shipping?.events ?? [], [order])
  const returnShipments = useMemo(() => order?.returnShipments ?? [], [order])

  return (
    <div>
      <MerchantHeader
        title={`Order #${orderId}`}
        description="Full order details and actions"
      />

      <div className="px-4 pb-8">
        <div className="mb-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>

        {/* TOP STRIP: summary like dialog */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Order Overview</CardTitle>
            </div>
            {order && (
              <Badge
                className={`${getStatusBadgeColor(order.status)} px-4 py-2`}
                variant="outline"
              >
                {getStatusIcon(order.status)}
                <span className="ml-1">{getStatusText(order.status)}</span>
              </Badge>
            )}
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Order code</div>
              <div className="font-medium font-mono">
                {order?.orderCode ?? '-'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Created</div>
              <div className="font-medium">{fmtDate(order?.createdAt)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Grand Total</div>
              <div className="text-2xl font-bold">
                {fmtTHB(order?.grandTotal)}
              </div>
              <div className="text-xs text-muted-foreground">Captured</div>
              <div className="text-lg font-semibold">
                {fmtTHB(order?.payment?.captured)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* LAYOUT: left details + right actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT column (2/3) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Status Manager (ดูคล้าย dialog แต่ฝังในเพจ) */}
            {order && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status & Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <OrderStatusManager
                    currentStatus={order.status}
                    statusHistory={order.statusHistory ?? []}
                    orderId={order.id}
                    trackingNumber={order.trackingNumber ?? undefined}
                    onStatusChange={handleStatusChange}
                    onTrackingNumberUpdate={handleTrackingNumberUpdate}
                    onHandedOver={handleHandedOver}
                  />
                </CardContent>
              </Card>
            )}

            {/* Products */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-lg">Order Items</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {order?.orderItems?.length ? (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          <TableHead className="text-right">Unit</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.orderItems.map((it) => (
                          <TableRow key={it.id}>
                            <TableCell className="font-medium">
                              {it.name}
                            </TableCell>
                            <TableCell>
                              <code className="bg-muted px-2 py-1 rounded text-xs">
                                {it.sku}
                              </code>
                            </TableCell>
                            <TableCell className="text-center">
                              {it.quantity}
                            </TableCell>
                            <TableCell className="text-right">
                              {fmtTHB(it.price)}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {fmtTHB(it.price * it.quantity)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No items.</p>
                )}

                {/* totals */}
                <div className="mt-4 space-y-2 border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>{fmtTHB(order?.shippingCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>{fmtTHB(order?.tax)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total</span>
                    <span>{fmtTHB(order?.grandTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping timeline */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-lg">Shipping Timeline</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {shippingEvents.length ? (
                  <div className="space-y-4">
                    {shippingEvents.map((e) => (
                      <div key={e.id} className="flex items-start gap-3">
                        <div className="pt-0.5">
                          <div className="w-2 h-2 rounded-full bg-foreground/70" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {e.toStatus}
                          </div>
                          {e.description && (
                            <div className="text-sm text-muted-foreground">
                              {e.description}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            {fmtDate(e.occurredAt)}{' '}
                            {e.location ? `• ${e.location}` : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No shipment events yet.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Return shipments (ถ้ามี) */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Undo2 className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-lg">Return Logistics</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {returnShipments.length ? (
                  <div className="space-y-4">
                    {returnShipments.map((rs) => (
                      <div key={rs.id} className="rounded-lg border p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-medium">
                            #{rs.id} • {rs.status}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {rs.trackingNumber
                              ? `Tracking: ${rs.trackingNumber}`
                              : 'No tracking'}
                          </div>
                        </div>
                        {rs.events?.length ? (
                          <div className="mt-3 space-y-2">
                            {rs.events.map((e) => (
                              <div
                                key={e.id}
                                className="flex items-center gap-2 text-sm"
                              >
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span>{e.toStatus}</span>
                                <span className="text-muted-foreground">
                                  • {fmtDate(e.occurredAt)}
                                </span>
                                {e.location && (
                                  <span className="text-muted-foreground">
                                    • {e.location}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No return shipment.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Status history (raw) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Status History</CardTitle>
              </CardHeader>
              <CardContent>
                {order?.statusHistory?.length ? (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.statusHistory.map((s, idx) => (
                          <TableRow key={`${s}-${idx}`}>
                            <TableCell className="w-[60px]">
                              {idx + 1}
                            </TableCell>
                            <TableCell>{s}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No history.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT column (1/3) */}
          <div className="space-y-6">
            {/* Customer */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {order?.customerName || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{order?.customerEmail || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{order?.customerPhone || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{fmtDate(order?.createdAt)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Shipping address + tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Shipping
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order?.shippingAddress ? (
                  <div className="text-sm space-y-0.5">
                    <div className="font-medium">
                      {order.shippingAddress.recipientName}
                    </div>
                    <div>{order.shippingAddress.street}</div>
                    <div>{order.shippingAddress.district}</div>
                    <div>
                      {order.shippingAddress.province}{' '}
                      {order.shippingAddress.postalCode}
                    </div>
                    <div className="text-muted-foreground">
                      {order.shippingAddress.country}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No address.
                  </div>
                )}

                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground">Tracking</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {order?.trackingNumber ?? '—'}
                    </code>
                    {order?.carrier && (
                      <span className="text-xs text-muted-foreground">
                        ({order.carrier})
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provider</span>
                  <span className="font-medium">
                    {order?.payment?.provider ?? '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Channel</span>
                  <span className="font-medium">
                    {order?.payment?.channel ?? '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Authorized</span>
                  <span className="font-medium">
                    {fmtTHB(order?.payment?.authorized)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Captured</span>
                  <span className="font-medium">
                    {fmtTHB(order?.payment?.captured)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Refunded</span>
                  <span className="font-medium">
                    {fmtTHB(order?.payment?.refunded)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid at</span>
                  <span className="font-medium">
                    {order?.payment?.paidAt
                      ? fmtDate(order.payment.paidAt)
                      : '-'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Links</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <Link href="/orders" className="text-primary underline">
                  Back to orders
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Skeleton */}
        {loading && (
          <div className="mt-6 text-sm text-muted-foreground">
            Loading order…
          </div>
        )}
      </div>
    </div>
  )
}
