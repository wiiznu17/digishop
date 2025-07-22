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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
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
import { DashboardHeader } from "@/components/dashboard-header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Plus, Edit, Trash2, Package } from "lucide-react"

interface Product {
  id: string
  name: string
  category: string
  price: number
  stock: number
  status: string
  description: string
}

const initialProducts: Product[] = [
  {
    id: "1",
    name: "Wireless Bluetooth Headphones",
    category: "Electronics",
    price: 79.99,
    stock: 45,
    status: "Active",
    description: "High-quality wireless headphones with noise cancellation"
  },
  {
    id: "2",
    name: "Cotton T-Shirt",
    category: "Fashion",
    price: 24.99,
    stock: 120,
    status: "Active",
    description: "Comfortable 100% cotton t-shirt available in multiple colors"
  },
  {
    id: "3",
    name: "Coffee Beans - Premium Blend",
    category: "Food & Beverage",
    price: 18.5,
    stock: 0,
    status: "Out of Stock",
    description: "Premium arabica coffee beans, medium roast"
  }
]

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    status: "Active",
    description: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const productData = {
      id: editingProduct?.id || Date.now().toString(),
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      status: formData.status,
      description: formData.description
    }

    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? productData : p))
      )
    } else {
      setProducts((prev) => [...prev, productData])
    }

    resetForm()
    setIsDialogOpen(false)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      price: "",
      stock: "",
      status: "Active",
      description: ""
    })
    setEditingProduct(null)
  }

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      status: product.status,
      description: product.description
    })
    setEditingProduct(product)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div>
      <DashboardHeader
        title="Products"
        description="Manage your product inventory"
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Edit Product" : "Add New Product"}
              </DialogTitle>
              <DialogDescription>
                {editingProduct
                  ? "Update product information"
                  : "Enter product details to add to your inventory"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Product name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  onValueChange={(value) => handleChange("category", value)}
                  value={formData.category}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Fashion">Fashion</SelectItem>
                    <SelectItem value="Food & Beverage">
                      Food & Beverage
                    </SelectItem>
                    <SelectItem value="Home & Garden">Home & Garden</SelectItem>
                    <SelectItem value="Books">Books</SelectItem>
                    <SelectItem value="Sports">Sports</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleChange("price", e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">Stock *</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => handleChange("stock", e.target.value)}
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  onValueChange={(value) => handleChange("status", value)}
                  value={formData.status}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Product description..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingProduct ? "Update Product" : "Add Product"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </DashboardHeader>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle>Product Inventory</CardTitle>
            <CardDescription>
              Manage your products and track inventory levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {product.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <span
                        className={
                          product.stock === 0 ? "text-destructive" : ""
                        }
                      >
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          product.status === "Active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : product.status === "Out of Stock"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                        }`}
                      >
                        {product.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
