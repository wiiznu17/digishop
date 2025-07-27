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
import { MerchantHeader } from "@/components/dashboard-header"
import {
  User,
  Building,
  CreditCard,
  Bell,
  Shield,
  Save,
  Upload
} from "lucide-react"

export default function ProfilePage() {
  const [profileData, setProfileData] = useState({
    // Business Information
    businessName: "Tech Solutions Store",
    ownerName: "John Doe",
    email: "john@techsolutions.com",
    phone: "+1 (555) 123-4567",
    address: "123 Main Street, New York, NY 10001",
    businessType: "Electronics",
    description:
      "We provide cutting-edge technology solutions for businesses and consumers.",
    website: "https://techsolutions.com",
    taxId: "123-45-6789",

    // Notification Settings
    emailNotifications: true,
    orderAlerts: true,
    inventoryAlerts: true,
    promotionUpdates: false,

    // Business Hours
    mondayHours: "9:00 AM - 6:00 PM",
    tuesdayHours: "9:00 AM - 6:00 PM",
    wednesdayHours: "9:00 AM - 6:00 PM",
    thursdayHours: "9:00 AM - 6:00 PM",
    fridayHours: "9:00 AM - 6:00 PM",
    saturdayHours: "10:00 AM - 4:00 PM",
    sundayHours: "Closed"
  })

  const handleChange = (field: string, value: string | boolean) => {
    setProfileData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    // Handle save logic here
    console.log("Profile updated:", profileData)
    // Show success message
  }

  return (
    <div>
      <MerchantHeader
        title="Profile"
        description="Manage your merchant account and business settings"
      >
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </MerchantHeader>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="grid gap-4 md:grid-cols-3">
          {/* Business Information */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Business Information
              </CardTitle>
              <CardDescription>
                Update your business details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={profileData.businessName}
                    onChange={(e) =>
                      handleChange("businessName", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerName">Owner Name</Label>
                  <Input
                    id="ownerName"
                    value={profileData.ownerName}
                    onChange={(e) => handleChange("ownerName", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Textarea
                  id="address"
                  value={profileData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type</Label>
                  <Select
                    value={profileData.businessType}
                    onValueChange={(value) =>
                      handleChange("businessType", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Fashion">Fashion</SelectItem>
                      <SelectItem value="Food & Beverage">
                        Food & Beverage
                      </SelectItem>
                      <SelectItem value="Home & Garden">
                        Home & Garden
                      </SelectItem>
                      <SelectItem value="Books">Books</SelectItem>
                      <SelectItem value="Sports">Sports</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={profileData.website}
                    onChange={(e) => handleChange("website", e.target.value)}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Business Description</Label>
                <Textarea
                  id="description"
                  value={profileData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID Number</Label>
                <Input
                  id="taxId"
                  value={profileData.taxId}
                  onChange={(e) => handleChange("taxId", e.target.value)}
                  placeholder="xxx-xx-xxxx"
                />
              </div>
            </CardContent>
          </Card>

          {/* Profile Picture & Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Picture
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
                  <User className="h-12 w-12 text-muted-foreground" />
                </div>
                <Button variant="outline" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Photo
                </Button>
              </div>

              <div className="space-y-2 pt-4">
                <div className="flex justify-between">
                  <span className="text-sm">Member Since</span>
                  <span className="text-sm font-medium">Jan 2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Products</span>
                  <span className="text-sm font-medium">245</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Orders</span>
                  <span className="text-sm font-medium">1,234</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Rating</span>
                  <span className="text-sm font-medium">4.8/5</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Business Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Business Hours</CardTitle>
            <CardDescription>
              Set your operating hours for customer reference
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { day: "Monday", field: "mondayHours" },
                { day: "Tuesday", field: "tuesdayHours" },
                { day: "Wednesday", field: "wednesdayHours" },
                { day: "Thursday", field: "thursdayHours" },
                { day: "Friday", field: "fridayHours" },
                { day: "Saturday", field: "saturdayHours" },
                { day: "Sunday", field: "sundayHours" }
              ].map(({ day, field }) => (
                <div key={day} className="space-y-2">
                  <Label htmlFor={field}>{day}</Label>
                  <Input
                    id={field}
                    value={
                      profileData[field as keyof typeof profileData] as string
                    }
                    onChange={(e) => handleChange(field, e.target.value)}
                    placeholder="9:00 AM - 6:00 PM"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to receive updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive general updates via email
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="emailNotifications"
                  checked={profileData.emailNotifications}
                  onChange={(e) =>
                    handleChange("emailNotifications", e.target.checked)
                  }
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="orderAlerts">Order Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about new orders
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="orderAlerts"
                  checked={profileData.orderAlerts}
                  onChange={(e) =>
                    handleChange("orderAlerts", e.target.checked)
                  }
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="inventoryAlerts">Inventory Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Low stock notifications
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="inventoryAlerts"
                  checked={profileData.inventoryAlerts}
                  onChange={(e) =>
                    handleChange("inventoryAlerts", e.target.checked)
                  }
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="promotionUpdates">Promotion Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Marketing and promotion tips
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="promotionUpdates"
                  checked={profileData.promotionUpdates}
                  onChange={(e) =>
                    handleChange("promotionUpdates", e.target.checked)
                  }
                  className="rounded"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Enable Two-Factor Authentication
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Review Login Activity
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Download Account Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
