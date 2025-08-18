// "use client"

// import Link from "next/link"
// import { usePathname } from "next/navigation"
// // import { cn } from "@/utils/tailwindUtils"
// import {
//   LayoutDashboard,

// } from "lucide-react"

// const navigationItems = [
//   {
//     title: "Profile",
//     href: "/digishop/setting/profile"
//   },
//   {
//     title: "Status",
//     href: "/digishop/setting/status"
//   }
// ]

// export function SidebarNav() {
//   const pathname = usePathname()

//   return (
//     <div className="flex h-full w-64 flex-col bg-background border-r">
//       <div className="flex h-16 items-center border-b px-6">
//         <div className="flex items-center space-x-2">
//           <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
//             {/* <LayoutDashboard className="h-5 w-5 text-primary-foreground" /> */}
//           </div>
//         </div>
//       </div>
//       <nav className="flex-1 space-y-1 p-4">
//         {navigationItems.map((item) => {
//           const isActive = pathname === item.href
//           return (
//             <Link
//               key={item.href}
//               href={item.href}
//               className={(` flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
//                   ?"bg-primary text-primary-foreground": "text-muted-foreground hover:bg-accent hover:text-accent-foreground" }`
//               )}
//             >
//             </Link>
//           )
//         })}
//       </nav>
//     </div>
//   )
// }

"use client"

// import {
//   Calendar,
//   ChevronUp,
//   Home,
//   Inbox,
//   Package,
//   Search,
//   Settings,
//   ShoppingCart,
//   User,
//   BarChart3,
//   Plus,
//   Users
// } from "lucide-react"
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
} from "@/components/ui/sideBar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
// import { useAuth } from "@/contexts/auth-context"
import { Button } from "./ui/button"

const items = [
  {
    title: "Profile",
    href: "/setting/profile"
  },
  {
    title: "Status",
    href: "/setting/status"
  }
]

export function AppSidebar() {
//   const { logout, isLoading } = useAuth()
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
                    <Link href={item.href}>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {/* <SidebarFooter>
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
      </SidebarFooter> */}
    </Sidebar>
  )
}
