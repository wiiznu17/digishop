"use client"

import { AdminSidebar } from "@/components/app-sidebar"
import AuthGuard from "@/components/AuthGuard"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useEffect } from "react"

export default function ClientBody({
  children
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // This runs only on the client after hydration
    document.body.className = "antialiased"
  }, [])

  return (
    <div className="antialiased">
      <AuthGuard>
        <SidebarProvider>
          <AdminSidebar />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </AuthGuard>
    </div>
  )
}
