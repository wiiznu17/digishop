"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { AdminStoreDetail } from "@/types/admin/stores"
import { fetchAdminStoreDetail } from "@/utils/requesters/merchantRequester"

// recharts
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts"

function formatMoneyMinor(minor?: number) {
  const n = Number(minor ?? 0)
  return (n / 100).toLocaleString()
}

export default function AdminStoreDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<AdminStoreDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetchAdminStoreDetail(Number(id))
        if (alive) setData(res)
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [id])

  const chartData = useMemo(
    () =>
      data?.orders.monthly.map((m) => ({
        month: m.month,
        sales: Math.round((m.totalSalesMinor ?? 0) / 100),
        orders: m.orderCount
      })) ?? [],
    [data]
  )

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <CardTitle className="text-xl">
              {data?.storeName ?? "Store"}
            </CardTitle>
            <CardDescription>Store detail</CardDescription>
            {!!data && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Email: </span>
                  {data.email}
                </div>
                <div>
                  <span className="text-muted-foreground">Owner: </span>
                  {data.ownerName} ({data.ownerEmail})
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="outline">{data.status}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Products:</span>{" "}
                  {data.productCount}
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>{" "}
                  {new Date(data.createdAt).toLocaleString()}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/merchants")}
            >
              Back
            </Button>
            {!!data && (
              <Button
                variant="default"
                onClick={() => {
                  const storeNameQuery = encodeURIComponent(data.storeName)
                  router.push(
                    `/admin/products?q=${storeNameQuery}&reqStatus=__ALL__&sortBy=createdAt&sortDir=desc&page=1`
                  )
                }}
              >
                View all products
              </Button>
            )}
            {data && (
              <Button
                variant="secondary"
                onClick={() => {
                  const storeNameQuery = encodeURIComponent(data.storeName)
                  router.push(`/admin/orders?storeName=${storeNameQuery}`)
                }}
              >
                View all orders
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {loading && (
            <div className="text-sm text-muted-foreground">Loading...</div>
          )}
          {!loading && !data && (
            <div className="text-sm text-destructive">Not found</div>
          )}
          {!!data && (
            <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total sales</CardDescription>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  ฿{formatMoneyMinor(data.orders.summary.totalSalesMinor)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Orders</CardDescription>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {data.orders.summary.totalOrders}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Avg / order</CardDescription>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  ฿{formatMoneyMinor(data.orders.summary.averageOrderMinor)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Last order</CardDescription>
                </CardHeader>
                <CardContent className="text-lg">
                  {data.orders.summary.lastOrderAt
                    ? new Date(data.orders.summary.lastOrderAt).toLocaleString()
                    : "—"}
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales chart */}
      {!!data && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly sales</CardTitle>
            <CardDescription>Sum of order (฿) and order count</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="sales"
                  name="Sales (฿)"
                  fillOpacity={0.25}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  name="Orders"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent orders */}
      {!!data && (
        <Card>
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
            <CardDescription>
              Click to open order / product / customer
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.orders.latest.length === 0 ? (
              <div className="text-sm text-muted-foreground">No orders</div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left px-3 py-2">Order code(id)</th>
                      <th className="text-left px-3 py-2">Date</th>
                      <th className="text-left px-3 py-2">Customer</th>
                      <th className="text-left px-3 py-2">Items</th>
                      <th className="text-right px-3 py-2">Total</th>
                      <th className="text-right px-3 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.orders.latest.map((o) => (
                      <tr key={o.id} className="border-b last:border-0">
                        <td className="px-3 py-2 font-medium">
                          {o.orderCode} ({o.id})
                        </td>
                        <td className="px-3 py-2">
                          {new Date(o.createdAt).toLocaleString()}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            className="text-primary hover:underline"
                            onClick={() =>
                              router.push(`/admin/customers/${o.customer.id}`)
                            }
                          >
                            {o.customer.name || o.customer.email}
                          </button>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-2">
                            {o.items.slice(0, 3).map((it) => (
                              <button
                                key={`${o.id}-${it.productId}`}
                                className="text-primary hover:underline"
                                onClick={() =>
                                  router.push(`/admin/products/${it.uuid}`)
                                }
                              >
                                {it.productName}
                              </button>
                            ))}
                            {o.items.length > 3 && (
                              <span className="text-muted-foreground">
                                +{o.items.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right">
                          ฿{formatMoneyMinor(o.grandTotalMinor)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            size="sm"
                            onClick={() => router.push(`/admin/orders/${o.id}`)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
