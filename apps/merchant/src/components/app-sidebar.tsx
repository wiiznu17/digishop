"use client"

import {
  ChevronUp,
  Home,
  Package,
  Settings,
  ShoppingCart,
  User,
  BarChart3,
  Users,
  WalletCards,
  WalletMinimal
} from "lucide-react"
import Link from "next/link"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
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
    title: "Bank Account",
    url: "/balance",
    icon: WalletMinimal
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
// วางฟังก์ชันนี้ไว้นอก AppSidebar หรือจะ import มาจากไฟล์อื่นก็ได้
function Logo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mr-2 h-6 w-6"
    >
      <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
    </svg>
  )
}

export function AppSidebar() {
  const { logout, isLoading } = useAuth()
  const router = useRouter()

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          {/* <SidebarGroupLabel>Merchant</SidebarGroupLabel> */}
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Logo />
              <h2 className="text-xl font-semibold tracking-tight">DigiShop</h2>
            </div>
          </SidebarHeader>
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
