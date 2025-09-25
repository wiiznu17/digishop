"use client"

import Link from "next/link"
import Image from "next/image"
import {
  Home,
  ShoppingCart,
  RotateCcw,
  Gavel,
  CreditCard,
  Wallet,
  Package,
  FolderTree,
  Users,
  Store,
  UserCog,
  MessageSquareWarning,
  Star,
  BadgePercent,
  Truck,
  Image as ImageIcon,
  ShieldCheck,
  Shield,
  SlidersHorizontal,
  Settings,
  User,
  ChevronUp,
  BarChart3
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Button } from "./ui/button"
import { logout } from "@/utils/requesters/authRequester"
import { useAuth } from "@/components/AuthGuard"

type NavItem = {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
}

type NavGroup = {
  label: string
  items: NavItem[]
}

const groups: NavGroup[] = [
  {
    label: "Platform Overview",
    items: [
      { title: "Dashboard", url: "/", icon: Home },
      { title: "Analytics", url: "/admin/analytics", icon: BarChart3 }
    ]
  },
  {
    label: "Commerce",
    items: [
      { title: "Orders*", url: "/admin/orders", icon: ShoppingCart },
      { title: "Refunds", url: "/admin/refunds", icon: RotateCcw },
      // { title: "Disputes", url: "/admin/disputes", icon: Gavel },
      // { title: "Payments", url: "/admin/payments", icon: CreditCard },
      // { title: "Payouts", url: "/admin/payouts", icon: Wallet }
    ]
  },
  {
    label: "Catalog",
    items: [
      { title: "Products", url: "/admin/products", icon: Package },
      { title: "Categories", url: "/admin/categories", icon: FolderTree }
    ]
  },
  {
    label: "Users & Merchants",
    items: [
      { title: "Customers", url: "/admin/customers", icon: Users },
      // { title: "Stores", url: "/admin/stores", icon: Store },
      { title: "Merchants", url: "/admin/merchants", icon: UserCog }
    ]
  },
  // {
  //   label: "Moderation",
  //   items: [
  //     { title: "Reviews", url: "/admin/reviews", icon: Star },
  //     { title: "Reports", url: "/admin/reports", icon: MessageSquareWarning }
  //   ]
  // },
  // {
  //   label: "Growth & Ops",
  //   items: [
  //     { title: "Promotions", url: "/admin/promotions", icon: BadgePercent },
  //     { title: "Logistics", url: "/admin/logistics", icon: Truck },
  //     { title: "Banners / CMS", url: "/admin/cms", icon: ImageIcon }
  //   ]
  // },
  {
    label: "System",
    items: [
      {
        title: "Admin Users & Roles",
        url: "/admin/admins",
        icon: Shield
      },
      {
        title: "Audit Logs",
        url: "/admin/audit-logs",
        icon: ShieldCheck
      } // ,
      // {
      //   title: "Feature Flags",
      //   url: "/admin/system/feature-flags",
      //   icon: SlidersHorizontal
      // },
      // { title: "Settings", url: "/admin/system/settings", icon: Settings }
    ]
  }
]

export function AdminSidebar() {
  // const { loading } = useAuth()
  return (
    <Sidebar>
      <SidebarContent>
        {/* Brand */}
        <div className="px-3 pt-4 pb-3 border-b">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted transition"
          >
            {/* วางไฟล์โลโก้ไว้ที่ /public/logo.svg */}
            <Image
              src="/logo.svg"
              alt="DigiShop"
              width={28}
              height={28}
              className="rounded-sm"
              priority
            />
            <span className="text-lg font-semibold tracking-tight">
              DigiShop
            </span>
          </Link>
        </div>

        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User /> Admin Account
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                {/* <DropdownMenuItem asChild>
                  <Link href="/admin/account">Account Settings</Link>
                </DropdownMenuItem> */}
                <DropdownMenuItem asChild>
                  <Link href="/admin/system/admins">Team & Roles</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/system/audit-logs">View Audit Logs</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    // disabled={loading}
                    onClick={async () => {
                      try {
                        await logout()
                      } finally {
                        // ไม่ต้องทำอะไรต่อ AuthGuard จะพาออกเอง
                      }
                    }}
                  >
                    Logout
                  </Button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
