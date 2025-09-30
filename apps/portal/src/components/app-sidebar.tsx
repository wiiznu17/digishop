"use client"

import Link from "next/link"
import Image from "next/image"
import {
  Home,
  ShoppingCart,
  RotateCcw,
  Package,
  FolderTree,
  Users,
  UserCog,
  ShieldCheck,
  Shield,
  User,
  ChevronUp
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
import { useMemo } from "react"

type NavItem = {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  perms?: string[] // สิทธิ์ที่ต้องมีทั้งหมดเพื่อแสดงเมนูนี้ (AND)
}

type NavGroup = { label: string; items: NavItem[] }

// กำหนดสิทธิ์ของแต่ละเมนู
const groups: NavGroup[] = [
  {
    label: "Platform Overview",
    items: [
      {
        title: "Dashboard",
        url: "/admin/dashboards",
        icon: Home,
        perms: ["DASHBOARD_VIEW"]
      }
    ]
  },
  {
    label: "Commerce",
    items: [
      {
        title: "Orders",
        url: "/admin/orders",
        icon: ShoppingCart,
        perms: ["ORDERS_READ"]
      },
      {
        title: "Refunds",
        url: "/admin/refunds",
        icon: RotateCcw,
        perms: ["REFUNDS_READ"]
      }
    ]
  },
  {
    label: "Catalog",
    items: [
      {
        title: "Products",
        url: "/admin/products",
        icon: Package,
        perms: ["PRODUCTS_READ"]
      },
      {
        title: "Categories",
        url: "/admin/categories",
        icon: FolderTree,
        perms: ["CATEGORIES_READ"]
      }
    ]
  },
  {
    label: "Users & Merchants",
    items: [
      {
        title: "Customers",
        url: "/admin/customers",
        icon: Users,
        perms: ["CUSTOMERS_READ"]
      },
      {
        title: "Merchants",
        url: "/admin/merchants",
        icon: UserCog,
        perms: ["MERCHANTS_READ"]
      }
    ]
  },
  {
    label: "System",
    items: [
      {
        title: "Admin Users",
        url: "/admin/admins",
        icon: Shield,
        perms: ["ADMIN_USERS_READ"]
      },
      {
        title: "Roles",
        url: "/admin/roles",
        icon: Shield,
        perms: ["ROLES_READ"]
      },
      {
        title: "Audit Logs",
        url: "/admin/audit-logs",
        icon: ShieldCheck,
        perms: ["AUDIT_LOGS_READ"]
      }
    ]
  }
]

export function AdminSidebar() {
  const { me, loading } = useAuth()

  // เช็คสิทธิ์แบบ AND: ต้องมีครบทุก perm ในรายการถึงจะแสดง
  const hasPerms = (need?: string[]) => {
    if (!need || need.length === 0) return true
    if (!me) return false
    const set = new Set(me.permissions || [])
    return need.every((p) => set.has(p))
  }

  // กรองเมนูตามสิทธิ์ (ซ่อนทั้ง item และ group ที่ว่าง)
  const visibleGroups = useMemo(() => {
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((it) => hasPerms(it.perms))
      }))
      .filter((g) => g.items.length > 0)
  }, [me])

  return (
    <Sidebar>
      <SidebarContent>
        {/* Brand */}
        <div className="px-3 pt-4 pb-3 border-b">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted transition"
          >
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

        {/* Loading state: กัน layout shift */}
        {loading ? (
          <div className="p-3 text-xs text-muted-foreground">Loading menu…</div>
        ) : (
          visibleGroups.map((group) => (
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
          ))
        )}
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
                    disabled={loading}
                    onClick={async () => {
                      try {
                        await logout()
                      } finally {
                        // AuthGuard จะพาออกเองเมื่อ token หาย
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
