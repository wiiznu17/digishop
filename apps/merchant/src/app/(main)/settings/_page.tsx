"use client"

import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { MerchantHeader } from "@/components/dashboard-header"

export default function SettingsPage() {
  const { user, isLoading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login")
      } else if (user.role !== "MERCHANT") {
        router.replace("/register")
      }
    }
  }, [user, isLoading, router])

  if (isLoading) return <p>Loading...</p>

  return (
    <div className="antialiased">
      <MerchantHeader
        title="Settings"
        description="Manage your account settings and preferences"
      />
    </div>
  )
}
