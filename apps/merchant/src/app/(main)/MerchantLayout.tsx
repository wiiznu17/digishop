"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { ToastProvider } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function MerchantLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log("User in MerchantLayout:", user)
    if (!isLoading) {
      if (!user) {
        console.log("User not authenticated, redirecting to login")
        router.push("/login")
      } else if (user.role !== "MERCHANT") {
        router.replace("/register")
      }
    }
  }, [user, isLoading, router])

  // if (isLoading) return <p>Loading...</p>

  return (
    <div className="antialiased">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <ToastProvider>{children}</ToastProvider>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
