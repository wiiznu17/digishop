'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ChevronUp,
  Home,
  Package,
  Settings,
  ShoppingCart,
  User,
  BarChart3,
  Users,
  WalletMinimal
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'

type NavItem = {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
}

const items: NavItem[] = [
  { title: 'Dashboard', url: '/', icon: Home },
  { title: 'Orders', url: '/orders', icon: ShoppingCart },
  { title: 'Products', url: '/products', icon: Package },
  // { title: "Customers", url: "/customers", icon: Users },
  // { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: 'Bank Account', url: '/balance', icon: WalletMinimal },
  { title: 'Profile', url: '/profile', icon: User }
  // { title: "Settings", url: "/settings", icon: Settings }
]

// โลโก้ง่าย ๆ (inline SVG) — เปลี่ยนได้ตามต้องการ
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
      aria-hidden="true"
    >
      <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
    </svg>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, isLoading } = useAuth()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarHeader className="border-b px-3 py-4">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
              <h2 className="text-xl font-semibold tracking-tight">DigiShop</h2>
            </Link>
          </SidebarHeader>

          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link
                      href={item.url}
                      aria-current={isActive(item.url) ? 'page' : undefined}
                    >
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
                  <User />
                  Merchant Account
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                {/* <DropdownMenuItem asChild>
                  <Link href="/profile">Account Settings</Link>
                </DropdownMenuItem> */}
                <DropdownMenuItem asChild>
                  <Link href="/profile">Business Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    disabled={isLoading}
                    onClick={async () => {
                      await logout()
                      router.push('/login')
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
