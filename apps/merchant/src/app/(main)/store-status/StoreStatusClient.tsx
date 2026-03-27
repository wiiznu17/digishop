'use client'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'

const statusTextMap: Record<string, { title: string; desc: string }> = {
  PENDING: {
    title: 'Your store is pending approval',
    desc: 'Our team is reviewing your store information. Please wait for confirmation. If it takes too long, please contact support.'
  },
  REJECTED: {
    title: 'Your store has been rejected',
    desc: 'Sorry, your store application was not approved. Please review your information and resubmit your request or contact support for assistance.'
  },
  SUSPENDED: {
    title: 'Your store has been suspended',
    desc: 'Your store account has been temporarily suspended. Please contact support for more details.'
  }
}

export default function StoreStatusPage() {
  const sp = useSearchParams()
  const router = useRouter()
  const { storeStatus, isLoading } = useAuth()

  const queryStatus = (sp.get('status') || '').toUpperCase()

  // ดึง URL หลักจาก env เช่น https://digishop.example.com
  const DIGISHOP_URL =
    process.env.NEXT_PUBLIC_DIGISHOP_URL ?? 'https://digishop.localhost'

  useEffect(() => {
    if (!isLoading && storeStatus === 'APPROVED') {
      router.replace('/')
    }
  }, [isLoading, storeStatus, router])

  const info =
    statusTextMap[queryStatus] ??
    statusTextMap[storeStatus ?? 'PENDING'] ??
    statusTextMap['PENDING']

  const btnBase =
    'px-4 py-2 rounded-lg border transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'

  return (
    <div className="min-h-screen w-full grid place-items-center p-6">
      <div className="max-w-xl w-full border rounded-2xl p-8 shadow-sm bg-white">
        <h1 className="text-2xl font-bold mb-2">{info.title}</h1>
        <p className="text-muted-foreground mb-6">{info.desc}</p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => router.refresh()}
            className={`${btnBase} hover:bg-gray-50 hover:border-gray-300 focus-visible:ring-gray-300`}
          >
            Check Again
          </button>

          <a
            href="mailto:support@example.com"
            className={`${btnBase} hover:bg-gray-50 hover:border-gray-300 focus-visible:ring-gray-300`}
          >
            Contact Support
          </a>

          {/* ใช้ href จาก ENV แทน router.replace */}
          <a
            href={DIGISHOP_URL}
            className={`${btnBase} bg-gray-900 text-white border-gray-900 hover:bg-black hover:border-black focus-visible:ring-gray-400`}
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}
