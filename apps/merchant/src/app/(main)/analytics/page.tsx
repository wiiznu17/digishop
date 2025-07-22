"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard-header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  Eye,
  Calendar,
  MapPin
} from "lucide-react"

const revenueData = [
  { month: "Jan", revenue: 12400, orders: 89 },
  { month: "Feb", revenue: 15600, orders: 112 },
  { month: "Mar", revenue: 18200, orders: 134 },
  { month: "Apr", revenue: 16800, orders: 121 },
  { month: "May", revenue: 21300, orders: 156 },
  { month: "Jun", revenue: 25100, orders: 187 }
]

const topProducts = [
  { name: "Wireless Bluetooth Headphones", sales: 124, revenue: 9916 },
  { name: "Cotton T-Shirt", sales: 98, revenue: 2449 },
  { name: "Coffee Beans - Premium Blend", sales: 76, revenue: 1406 },
  { name: "Smartphone Case", sales: 64, revenue: 1920 },
  { name: "Yoga Mat", sales: 52, revenue: 1560 }
]

const customerInsights = [
  { location: "New York", customers: 342, revenue: 18230 },
  { location: "California", customers: 298, revenue: 15670 },
  { location: "Texas", customers: 234, revenue: 12340 },
  { location: "Florida", customers: 189, revenue: 9870 },
  { location: "Illinois", customers: 156, revenue: 8230 }
]

export default function AnalyticsPage() {
  return (
    <div>
      <DashboardHeader
        title="Analytics"
        description="Business insights and performance metrics"
      />

      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$109,400</div>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +23.2% from last period
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Orders
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">699</div>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +18.7% from last period
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                New Customers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,219</div>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12.4% from last period
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Conversion Rate
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3.2%</div>
              <div className="flex items-center text-xs text-red-600">
                <TrendingDown className="h-3 w-3 mr-1" />
                -2.1% from last period
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-7">
          {/* Revenue Chart */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>
                Monthly revenue and order trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <div className="flex h-full items-end justify-between gap-2 p-4">
                  {revenueData.map((data, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center flex-1"
                    >
                      <div
                        className="w-full bg-primary rounded-t-sm mb-2 flex items-end justify-center text-xs text-primary-foreground"
                        style={{
                          height: `${(data.revenue / 25100) * 200}px`,
                          minHeight: "20px"
                        }}
                      >
                        ${(data.revenue / 1000).toFixed(0)}k
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {data.month}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>
                Best performing products this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium truncate max-w-[150px]">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product.sales} sales
                        </p>
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      ${product.revenue.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Customer Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Customer Locations
              </CardTitle>
              <CardDescription>
                Top customer locations by revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerInsights.map((location, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{location.location}</p>
                        <p className="text-sm text-muted-foreground">
                          {location.customers} customers
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${location.revenue.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ${(location.revenue / location.customers).toFixed(0)}{" "}
                        avg
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Key business indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Average Order Value</span>
                </div>
                <span className="font-medium">$156.50</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Customer Lifetime Value</span>
                </div>
                <span className="font-medium">$432.80</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Return Rate</span>
                </div>
                <span className="font-medium">2.1%</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Page Views</span>
                </div>
                <span className="font-medium">15,672</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Avg. Days to Purchase</span>
                </div>
                <span className="font-medium">3.2 days</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Growth Rate</span>
                </div>
                <span className="font-medium text-green-600">+18.5%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Performance</CardTitle>
            <CardDescription>Daily breakdown for this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-4">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                (day, index) => (
                  <div key={day} className="text-center">
                    <div className="text-sm font-medium mb-2">{day}</div>
                    <div className="space-y-2">
                      <div className="text-lg font-bold">
                        ${(Math.random() * 2000 + 1000).toFixed(0)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Math.floor(Math.random() * 50 + 20)} orders
                      </div>
                      <div
                        className={`text-xs ${index % 2 === 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {index % 2 === 0 ? "+" : "-"}
                        {(Math.random() * 10 + 1).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
