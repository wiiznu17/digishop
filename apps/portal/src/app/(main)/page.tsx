'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight } from 'lucide-react'
import AuthGuard from '@/components/AuthGuard'
import Link from 'next/link'
import { DashboardHeader } from '@/components/dashboard-header'

function WelcomeHero() {
  return (
    <div>
      {/* ชิดบน-ซ้ายด้วยการหัก padding ของเพจ */}
      <div className="-mt-4 -ml-4 md:-mt-6 md:-ml-6">
        <DashboardHeader title="Welcome" description="DigiShop Portal Admin" />
      </div>

      {/* HERO: ใหญ่และกึ่งกลาง */}
      <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600/10 via-sky-500/10 to-purple-500/10 border mt-4">
        <div className="mx-auto max-w-5xl px-6 md:px-10">
          <div className="min-h-[70vh] flex items-center justify-center">
            <div className="relative z-10 flex flex-col items-center text-center gap-6">
              {/* <Badge
                variant="outline"
                className="border-indigo-500/40 text-indigo-600 text-sm md:text-base px-3 py-1.5"
              >
                Portal Admin
              </Badge> */}

              <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight">
                Welcome to <span className="text-indigo-600">DigiShop</span>{' '}
                Portal Admin
              </h1>

              <p className="text-muted-foreground text-base md:text-xl max-w-3xl">
                Manage multi-vendor commerce platform. Use the quick actions
                below to jump straight into what matters most.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 pt-2">
                <Link href="/admin/merchants">
                  <Button size="lg" className="gap-3">
                    Go to Merchants <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/admin/orders">
                  <Button size="lg" variant="outline" className="gap-3">
                    View Orders <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/admin/products">
                  <Button size="lg" variant="ghost" className="gap-3">
                    Browse Products <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                {/* <Link href="/admin/users">
                  <Button size="lg" variant="ghost" className="gap-3">
                    Manage Users <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link> */}
              </div>
            </div>
          </div>
        </div>

        {/* animated blobs */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -top-10 -left-10 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl"
          animate={{ x: [0, 12, -12, 0], y: [0, -8, 8, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl"
          animate={{ x: [0, -14, 14, 0], y: [0, 10, -10, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  )
}

function Guard({ children }: { children: React.ReactNode }) {
  'use client'
  return <AuthGuard requiredPerms={['DASHBOARD_VIEW']}>{children}</AuthGuard>
}

export default function Page() {
  return (
    <Guard>
      {/* เพจยังมี padding ตามเดิม */}
      <div className="p-4 md:p-6">
        <WelcomeHero />
      </div>
    </Guard>
  )
}
