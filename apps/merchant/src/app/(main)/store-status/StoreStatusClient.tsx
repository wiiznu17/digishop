"use client"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"

const statusTextMap: Record<string, { title: string; desc: string }> = {
  PENDING: {
    title: "Your store is pending approval",
    desc: "Our team is reviewing your store information. Please wait for confirmation. If it takes too long, please contact support."
  },
  REJECTED: {
    title: "Your store has been rejected",
    desc: "Sorry, your store application was not approved. Please review your information and resubmit your request or contact support for assistance."
  },
  SUSPENDED: {
    title: "Your store has been suspended",
    desc: "Your store account has been temporarily suspended. Please contact support for more details."
  }
}

export default function StoreStatusPage() {
  const sp = useSearchParams()
  const router = useRouter()
  const { storeStatus, isLoading } = useAuth()

  const queryStatus = (sp.get("status") || "").toUpperCase()

  // If the store becomes approved, redirect to merchant home
  useEffect(() => {
    if (!isLoading && storeStatus === "APPROVED") {
      router.replace("/")
    }
  }, [isLoading, storeStatus, router])

  const info =
    statusTextMap[queryStatus] ??
    statusTextMap[storeStatus ?? "PENDING"] ??
    statusTextMap["PENDING"]

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-xl w-full border rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-2">{info.title}</h1>
        <p className="text-muted-foreground mb-6">{info.desc}</p>

        <div className="flex gap-3">
          <button
            onClick={() => router.refresh()}
            className="px-4 py-2 rounded-lg border"
          >
            Check Again
          </button>
          <a
            href="mailto:support@example.com"
            className="px-4 py-2 rounded-lg border"
          >
            Contact Support
          </a>
          <button
            onClick={() => router.replace("/")}
            className="px-4 py-2 rounded-lg border"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}
