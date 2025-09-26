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
import type { AdminUserDetail, MonthlySpend } from "@/types/admin/users"
import { fetchAdminUserDetail } from "@/utils/requesters/userRequester"

// ⬇️ กราฟ (recharts)
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from "recharts"

function formatTHBMinor(minor: number) {
  const v = (minor ?? 0) / 100
  return v.toLocaleString("th-TH", { style: "currency", currency: "THB" })
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<AdminUserDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetchAdminUserDetail(Number(id))
        if (alive) setData(res)
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [id])

  const summary = data?.orders.summary
  const latest = data?.orders.latest ?? []

  // เตรียม data สำหรับกราฟ (บาท)
  const monthlyChartData = useMemo(() => {
    const arr = data?.orders.monthly ?? []
    return arr
      .slice() // clone
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((m) => ({
        month: m.month, // YYYY-MM
        spent: (m.totalSpentMinor ?? 0) / 100, // แปลงเป็นบาทเพื่ออ่านง่ายบนแกน Y
        count: m.orderCount ?? 0
      }))
  }, [data?.orders.monthly])

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <CardTitle className="text-xl">{data?.name ?? "User"}</CardTitle>
            <CardDescription>User detail</CardDescription>
            {!!data && (
              <div className="mt-2 text-sm space-y-1">
                <div>
                  <span className="text-muted-foreground">Email: </span>
                  {data.email}
                </div>
                <div>
                  <span className="text-muted-foreground">Created: </span>
                  {new Date(data.createdAt).toLocaleString()}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/customers")}
            >
              Back
            </Button>
            {/* ลิ้งค์ดูออเดอร์ทั้งหมดของลูกค้าคนนี้ */}
            {!!data && (
              <Button
                onClick={() =>
                  router.push(`/admin/orders?customerId=${data.id}`)
                }
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
        </CardContent>
      </Card>

      {!!data && (
        <>
          {/* Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Total spent</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatTHBMinor(summary?.totalSpentMinor ?? 0)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Orders</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {summary?.totalOrders ?? 0}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Average order</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatTHBMinor(summary?.averageOrderMinor ?? 0)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Last order</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold text-balance">
                {summary?.lastOrderAt
                  ? new Date(summary.lastOrderAt).toLocaleString()
                  : "—"}
              </CardContent>
            </Card>
          </div>

          {/* Monthly spend chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly spend</CardTitle>
              <CardDescription>
                Total spent &amp; order count per month (click on month to view
                orders)
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              {monthlyChartData.length === 0 ? (
                <div className="text-sm text-muted-foreground">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthlyChartData}
                    onClick={(state: { activeLabel?: string }) => {
                      // state?.activeLabel คือค่า X (เช่น "2025-03")
                      const m = state?.activeLabel as string
                      const lastDayofmonth = (m: string) => {
                        const [y, mm] = m.split("-").map((x) => Number(x))
                        return new Date(y, mm, 0).getDate()
                      }
                      const mToParam = `dateFrom=${m}-01&dateTo=${m}-${lastDayofmonth(m)}`
                      if (m && data) {
                        router.push(`/admin/orders?${mToParam}`)
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickFormatter={(m) => m.slice(2)} />
                    <YAxis
                      tickFormatter={(v) =>
                        Number(v).toLocaleString("th-TH", {
                          maximumFractionDigits: 0
                        })
                      }
                    />
                    <Tooltip
                      formatter={(v: number, key: string) => {
                        if (key === "spent")
                          return [
                            v.toLocaleString("th-TH", {
                              style: "currency",
                              currency: "THB"
                            }),
                            "Spent"
                          ]
                        return [v, key]
                      }}
                      labelFormatter={(m) => `Month ${m}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="spent"
                      name="Spent (THB)"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Addresses */}
          <Card>
            <CardHeader>
              <CardTitle>Addresses</CardTitle>
              <CardDescription>
                Shipping addresses of this customer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.addresses.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No addresses
                </div>
              )}
              {data.addresses.map((a) => (
                <div key={a.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">
                      {a.recipientName} • {a.phone}
                    </div>
                    {a.isDefault && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {a.addressNumber}
                    {a.building ? `, ${a.building}` : ""}
                    {a.subStreet ? `, ${a.subStreet}` : ""}, {a.street},{" "}
                    {a.subdistrict}, {a.district}, {a.province} {a.postalCode},{" "}
                    {a.country}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Type: {a.addressType ?? "—"} • Created:{" "}
                    {new Date(a.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent orders (คลิกลิ้งก์ไปหน้า order detail) */}
          <Card>
            <CardHeader>
              <CardTitle>Recent orders</CardTitle>
              <CardDescription>Latest 10 orders</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {latest.length === 0 ? (
                <div className="text-sm text-muted-foreground">No orders</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 pr-2">Order #</th>
                      <th className="py-2 pr-2">Date</th>
                      <th className="py-2 pr-2">Store</th>
                      <th className="py-2 pr-2">Status</th>
                      <th className="py-2 pr-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latest.map((o) => (
                      <tr key={o.id} className="border-t">
                        <td className="py-2 pr-2">
                          <button
                            className="text-primary hover:text-destructive"
                            onClick={() => router.push(`/admin/orders/${o.id}`)}
                            title="Open order detail"
                          >
                            {o.id} ({o.orderCode})
                          </button>
                        </td>
                        <td className="py-2 pr-2">
                          {new Date(o.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2 pr-2">{o.storeNameSnapshot}</td>
                        <td className="py-2 pr-2">{o.status}</td>
                        <td className="py-2 pr-2 text-right">
                          {formatTHBMinor(o.grandTotalMinor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* Store (owner) */}
          {!!data.store && (
            <Card>
              <CardHeader>
                <CardTitle>Store</CardTitle>
                <CardDescription>This user owns a store</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium">{data.store.storeName}</div>
                  <div className="text-muted-foreground">
                    Status: {data.store.status}
                  </div>
                </div>
                <Button
                  onClick={() =>
                    router.push(`/admin/merchants/${data.store!.id}`)
                  }
                >
                  Open store detail
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Counters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Reviews</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {data.reviewsCount}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Disputes</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {data.disputesCount}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
