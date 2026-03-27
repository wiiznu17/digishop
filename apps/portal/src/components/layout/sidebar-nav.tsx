'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  User,
  Settings,
  BarChart3,
  Users,
  FileText
} from 'lucide-react'

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard
  },
  {
    title: 'Products',
    href: '/products',
    icon: Package
  },
  {
    title: 'Orders',
    href: '/orders',
    icon: ShoppingCart
  },
  {
    title: 'Customers',
    href: '/customers',
    icon: Users
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3
  },
  {
    title: 'Profile',
    href: '/profile',
    icon: User
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: FileText
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings
  }
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-background border-r">
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold">MerchantHub</span>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
