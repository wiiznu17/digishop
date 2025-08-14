"use client"

import {
  Calendar,
  ChevronUp,
  Home,
  Inbox,
  Package,
  Search,
  Settings,
  ShoppingCart,
  User,
  BarChart3,
  Plus,
  Users
} from "lucide-react"
import Link from "next/link"

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
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "./ui/button"

const items = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home
  },
  {
    title: "Orders",
    url: "/orders",
    icon: ShoppingCart
  },
  {
    title: "Products",
    url: "/products",
    icon: Package
  },
  {
    title: "Customers",
    url: "/customers",
    icon: Users
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3
  },
  {
    title: "Balance",
    url: "/balance",
    icon: Inbox
  },
  {
    title: "Profile",
    url: "/profile",
    icon: User
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings
  }
]

export function AppSidebar() {
  const { logout, isLoading } = useAuth()
  const router = useRouter()

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Merchant</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
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
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User /> Merchant Account
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem>
                  <span>Account Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Business Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    disabled={isLoading}
                    onClick={async () => {
                      await logout()
                      router.push("/login")
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
