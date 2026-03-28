'use client'

import Link from 'next/link'
import { MerchantHeader } from '@/components/dashboard-header'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { ShoppingCart, Package, Users, DollarSign } from 'lucide-react'
import { formatCurrencyTHB } from '@/utils/formatters/currency'
import { useMerchantDashboardQuery } from '@/hooks/queries/useMerchantQueries'

export default function Home() {
  const { data, isLoading: loading, error } = useMerchantDashboardQuery()

  const statCards = [
    {
      title: 'Total Revenue',
      value: data ? formatCurrencyTHB(data.totalRevenueMinor) : '—',
      change: data ? data.revenueChangeText : '',
      icon: DollarSign
    },
    {
      title: 'Orders',
      value: data ? String(data.ordersCount) : '—',
      change: data ? data.ordersChangeText : '',
      icon: ShoppingCart
    },
    {
      title: 'Products',
      value: data ? String(data.productsCount) : '—',
      // change: data ? data.productsChangeText : "",
      icon: Package
    },
    {
      title: 'Active Customers',
      value: data ? String(data.activeCustomers) : '—',
      // change: data ? data.customersChangeText : "",
      icon: Users
    }
  ]

  return (
    <div>
      <MerchantHeader
        title="Dashboard"
        description="Welcome to your merchant dashboard"
      />

      <div className="flex flex-1 flex-col gap-4 p-4">
        {error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-destructive">
              {error instanceof Error
                ? error.message
                : 'Failed to load dashboard'}
            </CardContent>
          </Card>
        )}

        <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, idx) => (
            <Card key={idx}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <span className="animate-pulse">•••</span>
                  ) : (
                    stat.value
                  )}
                </div>
                {!loading && (
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
              <CardDescription>
                {loading
                  ? 'Loading…'
                  : `You made ${data?.thisMonthSalesCount ?? 0} sales this month.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {(data?.recentSales ?? []).slice(0, 5).map((s, i) => (
                  <div className="flex items-center" key={i}>
                    <div className="ml-0 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {s.customerName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.customerEmail}
                      </p>
                    </div>
                    <div className="ml-auto font-medium">
                      +{formatCurrencyTHB(s.amountMinor)}
                    </div>
                  </div>
                ))}
                {!loading && (data?.recentSales?.length ?? 0) === 0 && (
                  <div className="text-sm text-muted-foreground">
                    No sales yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your business operations</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2 mt-4">
              <Link
                href="/products"
                className="p-4 border rounded-lg hover:bg-muted transition-colors"
              >
                <Package className="h-7 w-7 mb-4" />
                <div className="text-sm font-medium">Add Product</div>
              </Link>
              <Link
                href="/orders"
                className="p-4 border rounded-lg hover:bg-muted transition-colors"
              >
                <ShoppingCart className="h-7 w-7 mb-4" />
                <div className="text-sm font-medium">View Orders</div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
