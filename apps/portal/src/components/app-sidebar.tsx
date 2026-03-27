'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  Home,
  ShoppingCart,
  RotateCcw,
  Package,
  FolderTree,
  Users,
  UserCog,
  Shield,
  User,
  ChevronUp
} from 'lucide-react'

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
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from './ui/button'
import { logout } from '@/utils/requesters/authRequester'
import { useAuth } from '@/components/AuthGuard'
import { useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation' // ⬅️ เพิ่ม usePathname

type NavItem = {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  perms?: string[]
}

type NavGroup = { label: string; items: NavItem[] }

const groups: NavGroup[] = [
  {
    label: 'Commerce',
    items: [
      {
        title: 'Orders',
        url: '/admin/orders',
        icon: ShoppingCart,
        perms: ['ORDERS_READ']
      },
      {
        title: 'Refund orders',
        url: '/admin/refunds',
        icon: RotateCcw,
        perms: ['REFUNDS_READ']
      }
    ]
  },
  {
    label: 'Catalog',
    items: [
      {
        title: 'Products',
        url: '/admin/products',
        icon: Package,
        perms: ['PRODUCTS_READ']
      },
      {
        title: 'Categories',
        url: '/admin/categories',
        icon: FolderTree,
        perms: ['CATEGORIES_READ']
      }
    ]
  },
  {
    label: 'Users & Merchants',
    items: [
      {
        title: 'Customers',
        url: '/admin/customers',
        icon: Users,
        perms: ['CUSTOMERS_READ']
      },
      {
        title: 'Merchants',
        url: '/admin/merchants',
        icon: UserCog,
        perms: ['MERCHANTS_READ']
      }
    ]
  },
  {
    label: 'System',
    items: [
      {
        title: 'Admin Users',
        url: '/admin/admins',
        icon: Shield,
        perms: ['ADMIN_USERS_READ']
      },
      {
        title: 'Roles',
        url: '/admin/roles',
        icon: Shield,
        perms: ['ROLES_READ']
      }
    ]
  }
]

export function AdminSidebar() {
  const { me, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname() // ⬅️ ใช้ path ปัจจุบัน

  const hasPerms = (need?: string[]) => {
    if (!need || need.length === 0) return true
    if (!me) return false
    const set = new Set(me.permissions || [])
    return need.every((p) => set.has(p))
  }

  const visibleGroups = useMemo(
    () =>
      groups
        .map((g) => ({
          ...g,
          items: g.items.filter((it) => hasPerms(it.perms))
        }))
        .filter((g) => g.items.length > 0),
    [me]
  )

  // กำหนด active เมื่อ path ตรงหรือเป็น path ย่อย
  const isActive = (url: string) =>
    pathname === url || pathname.startsWith(url + '/')

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

        {/* Loading state */}
        {loading ? (
          <div className="p-3 text-xs text-muted-foreground">Loading menu…</div>
        ) : (
          visibleGroups.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const active = isActive(item.url)
                    return (
                      <SidebarMenuItem key={item.title}>
                        {/* ถ้า lib รองรับ prop isActive จะช่วยใส่ data-state ให้ด้วย */}
                        <SidebarMenuButton
                          asChild
                          isActive={active} // เผื่อคอมโพเนนต์รองรับ
                          className={
                            active
                              ? 'bg-gray-100 text-gray-900 hover:bg-gray-300' // พื้นหลังเทาเมื่อ active
                              : ''
                          }
                        >
                          <Link
                            href={item.url}
                            className="flex items-center gap-2"
                          >
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
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
                  <Link href="/admin/admins">Team & Roles</Link>
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
                        router.replace('/login')
                        window.setTimeout(() => window.location.reload(), 50)
                      } catch {
                        router.replace('/login')
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
