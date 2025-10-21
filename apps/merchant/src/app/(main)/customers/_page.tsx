"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { MerchantHeader } from "@/components/dashboard-header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  DollarSign,
  Search,
  Eye
} from "lucide-react"

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  location: string
  joinDate: string
  totalOrders: number
  totalSpent: number
  lastOrder: string
  status: "Active" | "Inactive"
}

const initialCustomers: Customer[] = [
  {
    id: "CUST-001",
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1 (555) 123-4567",
    location: "New York, NY",
    joinDate: "2023-08-15",
    totalOrders: 12,
    totalSpent: 1456.78,
    lastOrder: "2024-01-10",
    status: "Active"
  },
  {
    id: "CUST-002",
    name: "Michael Chen",
    email: "michael.chen@email.com",
    phone: "+1 (555) 234-5678",
    location: "San Francisco, CA",
    joinDate: "2023-09-22",
    totalOrders: 8,
    totalSpent: 892.45,
    lastOrder: "2024-01-08",
    status: "Active"
  },
  {
    id: "CUST-003",
    name: "Emily Rodriguez",
    email: "emily.rodriguez@email.com",
    phone: "+1 (555) 345-6789",
    location: "Austin, TX",
    joinDate: "2023-07-10",
    totalOrders: 15,
    totalSpent: 2134.56,
    lastOrder: "2024-01-12",
    status: "Active"
  },
  {
    id: "CUST-004",
    name: "David Wilson",
    email: "david.wilson@email.com",
    phone: "+1 (555) 456-7890",
    location: "Chicago, IL",
    joinDate: "2023-11-03",
    totalOrders: 3,
    totalSpent: 267.89,
    lastOrder: "2023-12-15",
    status: "Inactive"
  },
  {
    id: "CUST-005",
    name: "Lisa Thompson",
    email: "lisa.thompson@email.com",
    phone: "+1 (555) 567-8901",
    location: "Miami, FL",
    joinDate: "2023-06-28",
    totalOrders: 20,
    totalSpent: 3245.67,
    lastOrder: "2024-01-14",
    status: "Active"
  }
]

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  )
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const viewCustomerDetails = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsDetailOpen(true)
  }

  const activeCustomers = customers.filter((c) => c.status === "Active").length
  const totalRevenue = customers.reduce(
    (sum, customer) => sum + customer.totalSpent,
    0
  )
  const avgOrderValue =
    totalRevenue /
    customers.reduce((sum, customer) => sum + customer.totalOrders, 0)

  return (
    <div>
      <MerchantHeader
        title="Customers"
        description="Manage your customer relationships and track their activity"
      />

      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Customer Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Customers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
              <p className="text-xs text-muted-foreground">
                {activeCustomers} active customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Customer Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total customer spending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Order Value
              </CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${avgOrderValue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Per customer order
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Retention Rate
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87.5%</div>
              <p className="text-xs text-muted-foreground">
                Customer retention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Customer Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Customer Directory</CardTitle>
                <CardDescription>
                  View and manage all your customers
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-[250px]"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Last Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {customer.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {customer.location}
                      </div>
                    </TableCell>
                    <TableCell>{customer.totalOrders}</TableCell>
                    <TableCell>${customer.totalSpent.toFixed(2)}</TableCell>
                    <TableCell>
                      {new Date(customer.lastOrder).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          customer.status === "Active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                        }`}
                      >
                        {customer.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewCustomerDetails(customer)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Customer Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Customer Details - {selectedCustomer?.name}
            </DialogTitle>
            <DialogDescription>
              Complete customer information and purchase history
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedCustomer.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedCustomer.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {selectedCustomer.location}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Account Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Joined:{" "}
                        {new Date(
                          selectedCustomer.joinDate
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {selectedCustomer.totalOrders} orders placed
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        ${selectedCustomer.totalSpent.toFixed(2)} total spent
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Purchase Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        $
                        {(
                          selectedCustomer.totalSpent /
                          selectedCustomer.totalOrders
                        ).toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Average Order Value
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {Math.round(
                          (new Date().getTime() -
                            new Date(selectedCustomer.joinDate).getTime()) /
                            (1000 * 60 * 60 * 24 * 30)
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Months as Customer
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {new Date(
                          selectedCustomer.lastOrder
                        ).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Last Purchase
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      {
                        id: "ORD-101",
                        date: "2024-01-14",
                        amount: 89.99,
                        status: "Delivered"
                      },
                      {
                        id: "ORD-089",
                        date: "2024-01-08",
                        amount: 156.78,
                        status: "Delivered"
                      },
                      {
                        id: "ORD-067",
                        date: "2023-12-22",
                        amount: 245.99,
                        status: "Delivered"
                      }
                    ].map((order, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{order.id}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(order.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${order.amount}</div>
                          <div className="text-sm text-green-600">
                            {order.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
