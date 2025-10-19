สมมติจะเข้าหน้า orders ที่มี authguard
ทำไมมันเข้าไม่ได้
# apps/portal/src/app/(auth)/login/page.tsx
<"use client"

import { Suspense, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { login } from "@/utils/requesters/authRequester"

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen grid place-items-center p-4">
          Loading…
        </main>
      }
    >
      <LoginInner />
    </Suspense>
  )
}

function LoginInner() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMsg, setErrorMsg] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)

  const router = useRouter()
  const search = useSearchParams()

  const nextPath = useMemo(() => {
    const next = search.get("next")
    // กัน open redirect: ต้องขึ้นต้นด้วย "/"
    if (!next || !next.startsWith("/")) return "/admin/orders"
    return next
  }, [search])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitting) return
    setErrorMsg("")
    setSubmitting(true)

    try {
      await login(email.trim(), password)
      console.log("nextpath: ", nextPath)
      router.replace(nextPath)
    } catch (err: unknown) {
      const msg =
        (isAxiosError(err) &&
          (err.response?.data as { error?: string })?.error) ||
        (err instanceof Error ? err.message : "Login failed")
      setErrorMsg(humanizeError(msg))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-3 rounded-xl border p-6 shadow-sm bg-white"
      >
        <h1 className="text-xl font-semibold dark:text-gray-900">Sign in</h1>

        <label className="block">
          <span className="text-sm text-gray-700">Email</span>
          <input
            className="mt-1 border p-2 w-full rounded outline-none focus:ring focus:ring-black/10"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email"
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-700">Password</span>
          <input
            className="mt-1 border p-2 w-full rounded outline-none focus:ring focus:ring-black/10"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        {errorMsg && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-black px-3 py-2 text-white disabled:opacity-50"
          aria-busy={submitting}
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  )
}

function isAxiosError(
  e: unknown
): e is { isAxiosError: boolean; response?: { data?: unknown } } {
  return typeof e === "object" && e !== null && "isAxiosError" in e
}

function humanizeError(codeOrMsg: string): string {
  switch (codeOrMsg) {
    case "EMAIL_PASSWORD_REQUIRED":
      return "Please enter email and password."
    case "INVALID_CREDENTIALS":
      return "Email or password is incorrect."
    case "ACCOUNT_SUSPENDED":
      return "Your account is suspended. Contact administrator."
    default:
      return "Login failed. Please try again."
  }
}
>

# apps/portal/src/app/(main)/admin/(commerce)/orders/page.tsx
<"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { DashboardHeader } from "@/components/dashboard-header"

import { OrdersSearchBox } from "@/components/commerce/orders/OrderSearchBox"
import { OrdersFilterBar } from "@/components/commerce/orders/OrderFilterBar"
import { OrdersTable } from "@/components/commerce/orders/OrderTable"
import { StatusBadge } from "@/components/commerce/orders/StatusBadge"
import { Pager } from "@/components/common/Pager"

import {
  AdminFetchOrdersParams,
  AdminOrderListItem,
  AdminOrderStatus
} from "@/types/commerce/orders"

import { fetchAdminOrdersRequester } from "@/utils/requesters/orderRequester"
import { CustomerEmailSearchBox } from "@/components/commerce/orders/CustomerEmailSearchBox"
import { Store } from "lucide-react"
import { StoreNameSearchBox } from "@/components/commerce/orders/storeNameSearchBox"
import AuthGuard from "@/components/AuthGuard"

const THB = (n?: number | null) =>
  n == null
    ? "-"
    : (n / 100).toLocaleString("th-TH", { style: "currency", currency: "THB" })

function AdminOrdersPage() {
  const router = useRouter()
  const sp = useSearchParams()

  const [qDraft, setQDraft] = useState(sp.get("q") ?? "")
  const [statusDraft, setStatusDraft] = useState<AdminOrderStatus | "ALL">(
    (sp.get("status") as AdminOrderStatus) ?? "ALL"
  )
  const [dateFromDraft, setDateFromDraft] = useState(sp.get("dateFrom") ?? "")
  const [dateToDraft, setDateToDraft] = useState(sp.get("dateTo") ?? "")

  const [q, setQ] = useState(sp.get("q") ?? "")
  const [status, setStatus] = useState<AdminOrderStatus | "ALL">(
    (sp.get("status") as AdminOrderStatus) ?? "ALL"
  )
  const [dateFrom, setDateFrom] = useState(sp.get("dateFrom") ?? "")
  const [dateTo, setDateTo] = useState(sp.get("dateTo") ?? "")
  const [page, setPage] = useState<number>(Number(sp.get("page") ?? 1))
  const [pageSize, setPageSize] = useState<number>(
    Number(sp.get("pageSize") ?? 20)
  )

  const [rows, setRows] = useState<AdminOrderListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [customerEmailDraft, setCustomerEmailDraft] = useState(
    sp.get("customerEmail") ?? ""
  )
  const [customerEmail, setCustomerEmail] = useState(
    sp.get("customerEmail") ?? ""
  )
  const [storeNameDraft, setStoreNameDraft] = useState(
    sp.get("storeName") ?? ""
  )
  const [storeName, setStoreName] = useState(sp.get("storeName") ?? "")

  const params: AdminFetchOrdersParams = useMemo(
    () => ({
      q: q || undefined,
      status: status === "ALL" ? undefined : status,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      customerEmail: customerEmail || undefined,
      storeName: storeName || undefined,
      sortBy: "createdAt",
      sortDir: "desc",
      page,
      pageSize
    }),
    [q, status, dateFrom, dateTo, customerEmail, storeName, page, pageSize]
  )

  const fetchList = useCallback(async () => {
    setLoading(true)
    const res = await fetchAdminOrdersRequester(params)
    setLoading(false)
    if (!res) return
    setRows(res.data)
    setTotal(res.meta.total)
  }, [params])

  // ยิงครั้งแรกตอนเปิดหน้า (ใช้ค่าจาก URL เป็น submitted)
  useEffect(() => {
    void fetchList()
  }, [fetchList])
  useEffect(() => {
    const next = new URLSearchParams()
    if (q) next.set("q", q)
    if (status !== "ALL") next.set("status", status)
    if (dateFrom) next.set("dateFrom", dateFrom)
    if (dateTo) next.set("dateTo", dateTo)
    if (customerEmail) next.set("customerEmail", customerEmail)
    if (storeName) next.set("storeName", storeName)
    if (page !== 1) next.set("page", String(page))
    if (pageSize !== 20) next.set("pageSize", String(pageSize))
    router.push(`/admin/orders${next.toString() ? `?${next.toString()}` : ""}`)
  }, [
    router,
    q,
    status,
    dateFrom,
    dateTo,
    customerEmail,
    storeName,
    page,
    pageSize
  ])

  const handleSubmitSearch = useCallback(() => {
    setQ(qDraft.trim())
    setStatus(statusDraft)
    setDateFrom(dateFromDraft)
    setDateTo(dateToDraft)
    setCustomerEmail(customerEmailDraft.trim())
    setStoreName(storeNameDraft.trim())
    setPage(1)
    void fetchList()
  }, [
    qDraft,
    statusDraft,
    dateFromDraft,
    dateToDraft,
    customerEmailDraft,
    storeNameDraft,
    fetchList
  ])
  // เปลี่ยนหน้า/ PageSize ยิงทันที (หลังจากมีผลการค้นหาแล้ว)
  const handlePage = useCallback(
    (p: number) => {
      setPage(p)
      setTimeout(() => {
        void fetchList()
      }, 0)
    },
    [fetchList]
  )
  const handlePageSize = useCallback(
    (s: number) => {
      setPageSize(s)
      setPage(1)
      setTimeout(() => {
        void fetchList()
      }, 0)
    },
    [fetchList]
  )
  const handleClearFilters = useCallback(() => {
    // ล้างค่า draft
    setQDraft("")
    setStatusDraft("ALL")
    setDateFromDraft("")
    setDateToDraft("")
    setCustomerEmailDraft("")
    setStoreNameDraft("")

    // ล้างค่า submitted
    setQ("")
    setStatus("ALL")
    setDateFrom("")
    setDateTo("")
    setCustomerEmail("")
    setStoreName("")

    // รีเซ็ตหน้า
    setPage(1)

    // ยิงโหลดใหม่หลัง state set แล้ว
    setTimeout(() => {
      void fetchList()
    }, 0)
  }, [fetchList])

  // Handlers สำหรับตาราง
  const [openQV, setOpenQV] = useState(false)
  const [current, setCurrent] = useState<AdminOrderListItem | null>(null)
  const handleDetail = useCallback(
    (row: AdminOrderListItem) => router.push(`/admin/orders/${row.id}`),
    [router]
  )
  const handleQuickView = useCallback((row: AdminOrderListItem) => {
    setCurrent(row)
    setOpenQV(true)
  }, [])

  return (
    <div>
      <DashboardHeader
        title="Orders"
        description="View all orders (per store)"
      />

      <div className="p-4 space-y-4">
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle>Orders (Admin)</CardTitle>
            <CardDescription>Search &amp; filter orders</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              {/* Order code */}
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Order code</label>
                <OrdersSearchBox value={qDraft} onChange={setQDraft} />
              </div>

              {/* Customer email */}
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Customer email</label>
                <CustomerEmailSearchBox
                  value={customerEmailDraft}
                  onChange={setCustomerEmailDraft}
                />
              </div>
              {/* Store name */}
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Store name</label>
                <StoreNameSearchBox
                  value={storeNameDraft}
                  onChange={setStoreNameDraft}
                />
              </div>

              <OrdersFilterBar
                status={statusDraft}
                onStatusChange={(v) => setStatusDraft(v)}
                dateFrom={dateFromDraft}
                onDateFromChange={setDateFromDraft}
                dateTo={dateToDraft}
                onDateToChange={setDateToDraft}
              />

              {/* ปุ่มชิดขวา ขวาสุด = Clear */}
              <div className="flex items-end justify-end gap-2">
                <Button onClick={handleSubmitSearch} className="mt-2 md:mt-6">
                  Search
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="mt-2 md:mt-6"
                >
                  Clear filter
                </Button>
              </div>
            </div>

            {/* Table */}
            <OrdersTable
              rows={rows}
              loading={loading}
              onQuickView={handleQuickView}
              onDetail={handleDetail}
            />

            <Pager
              page={page}
              pageSize={pageSize}
              total={total}
              onPage={handlePage}
              onPageSize={handlePageSize}
            />
          </CardContent>
        </Card>

        {/* Quick view */}
        <Dialog open={openQV} onOpenChange={setOpenQV}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Order Quick View {current ? `— ${current.orderCode}` : ""}
              </DialogTitle>
            </DialogHeader>
            {current && (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Customer: </span>
                  {current.customerName} ({current.customerEmail})
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Status: </span>
                  <StatusBadge status={current.status} />
                </div>
                <div>
                  <span className="text-muted-foreground">Total: </span>
                  {THB(current.grandTotalMinor)}
                </div>
                <div>
                  <span className="text-muted-foreground">Created: </span>
                  {new Date(current.createdAt).toLocaleString()}
                </div>
                <Button
                  className="mt-2"
                  onClick={() => {
                    setOpenQV(false)
                    router.push(`/admin/orders/${current.id}`)
                  }}
                >
                  Open detail
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

function Guard({ children }: { children: React.ReactNode }) {
  "use client"
  return <AuthGuard requiredPerms={["ORDERS_READ"]}>{children}</AuthGuard>
}

export default function Page() {
  return (
    <Guard>
      <AdminOrdersPage />
    </Guard>
  )
}
>


# apps/portal/src/components/AuthGuard.tsx
<// apps/portal/src/components/AuthGuard.tsx
"use client"

import React, { ReactNode, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { fetchAuth } from "@/utils/requesters/authRequester"
import { subscribe, getAccessToken } from "@/lib/tokenStore"

export type Me = {
  id: number
  email: string
  roles: string[]
  permissions: string[]
}

export function useAuth() {
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setErr] = useState<Error | null>(null)

  // refs สำหรับควบคุมลำดับ/สถานะที่ไม่ทำให้ re-render
  const didRunRef = useRef(false)
  const seqRef = useRef(0)
  const activeRef = useRef(0)
  const mountedRef = useRef(true) // track ว่ายัง mounted อยู่

  async function loadMe() {
    const token = getAccessToken()
    console.log("Get token in auth guard: ", token)
    if (token == null) {
      console.log("token is null")
      // ไม่มี token → เคลียร์ state
      if (mountedRef.current) {
        setMe(null)
        setErr(null)
        setLoading(false)
      }
      return
    }

    const mySeq = ++seqRef.current
    activeRef.current = mySeq

    if (mountedRef.current) {
      setLoading(true)
      setErr(null)
    }

    try {
      const m = await fetchAuth()
      if (activeRef.current !== mySeq || !mountedRef.current) return // ทิ้งผลเก่า
      setMe(m)
    } catch (e: unknown) {
      if (activeRef.current !== mySeq || !mountedRef.current) return
      setErr(e instanceof Error ? e : new Error("fetchAuth failed"))
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  useEffect(() => {
    mountedRef.current = true

    // dev: ให้รันครั้งเดียวต่อ component instance
    if (process.env.NODE_ENV !== "production") {
      if (!didRunRef.current) {
        didRunRef.current = true
        void loadMe()
      }
    } else {
      void loadMe()
    }

    // เมื่อ token เปลี่ยน → reload me
    const unsub = subscribe(() => {
      void loadMe()
    })

    return () => {
      mountedRef.current = false
      unsub()
    }
  }, [])

  return { me, loading, error }
}

export function useCan(perms: string[], me: Me | null) {
  const need = perms ?? []
  return useMemo(() => {
    if (!me) return false
    if (need.length === 0) return true
    const set = new Set(me.permissions || [])
    return need.every((p) => set.has(p))
  }, [me, need.join("|")])
}

export default function AuthGuard({
  children,
  requiredPerms,
  redirectTo = "/login"
}: {
  children: ReactNode
  requiredPerms?: string[]
  redirectTo?: string
}) {
  const { me, loading } = useAuth()
  const router = useRouter()
  const redirectedRef = useRef(false) // กัน redirect ซ้ำ

  const needPerms = useMemo(() => requiredPerms ?? [], [requiredPerms])
  const allowed = useCan(needPerms, me)

  useEffect(() => {
    if (redirectedRef.current) return

    // ยังโหลดอยู่ → รอ
    if (loading) return

    // ✅ ยังไม่มี me แต่มี token อยู่ → อย่า redirect (รอโหลดรอบถัดไป)
    const hasToken = !!getAccessToken()
    if (!me && hasToken) return

    // ไม่มี me และไม่มี token → ไป login
    if (!me && !hasToken) {
      redirectedRef.current = true
      router.replace(redirectTo)
      return
    }

    // ล็อกอินแล้วแต่สิทธิ์ไม่พอ → 403
    if (me && !allowed) {
      redirectedRef.current = true
      router.replace("/403")
      return
    }
  }, [loading, me, allowed, router, redirectTo])

  if (loading)
    return <div className="p-6 text-sm opacity-70">Checking session…</div>
  if (!me || !allowed) return null

  return <>{children}</>
}
>

# apps/portal/src/lib/tokenStore.ts
<let accessToken: string | null = null
const listeners = new Set<() => void>()
const bc: BroadcastChannel | null =
  typeof window !== "undefined" ? new BroadcastChannel("auth") : null

// เพิ่ม: โหลด token จาก localStorage ตอน init
if (typeof window !== "undefined") {
  accessToken = localStorage.getItem("accessToken")
}

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  console.log("Access token to set: ", token)
  accessToken = token

  // เพิ่ม: sync กับ localStorage
  if (typeof window !== "undefined") {
    console.log("type window is not undefinded ")
    if (token) {
      console.log("Access token to set: ", token)
      localStorage.setItem("accessToken", token)
    } else {
      console.log("Access token to remove: ", token)
      localStorage.removeItem("accessToken")
    }
  }

  listeners.forEach((l) => l())
  bc?.postMessage({ type: "accessToken", token })
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

if (bc) {
  bc.onmessage = (e: MessageEvent) => {
    const data = e.data as { type?: string; token?: string | null }
    if (data?.type === "accessToken") {
      accessToken = data.token ?? null

      // เพิ่ม: sync กับ localStorage
      if (typeof window !== "undefined") {
        if (accessToken) {
          localStorage.setItem("accessToken", accessToken)
        } else {
          localStorage.removeItem("accessToken")
        }
      }

      listeners.forEach((l) => l())
    }
  }
}
>

# apps/portal/src/utils/requesters/authRequester.ts
<import axios from "@/lib/axios"
import { setAccessToken } from "@/lib/tokenStore"

// export async function login(
//   email: string,
//   password: string
// ): Promise<{ accessToken: string }> {
//   const res = await axios.post("/api/auth/login", { email, password })
//   const data = res.data as { accessToken: string }
//   console.log("access tk: ", data.accessToken)
//   if (data?.accessToken) setAccessToken(data.accessToken)
//   return data
// }
export async function warmMe() {
  try {
    await axios.get("/api/auth/access")
  } catch {}
}

export async function login(email: string, password: string) {
  const res = await axios.post("/api/auth/login", { email, password })
  const { accessToken } = res.data as { accessToken: string }
  console.log("access tk: ", accessToken)
  if (accessToken) {
    setAccessToken(accessToken)
    await warmMe()
  }
  return { accessToken }
}

export async function logout(): Promise<{ ok: boolean }> {
  const res = await axios.post("/api/auth/logout")
  setAccessToken(null)
  return res.data as { ok: boolean }
}

export async function fetchAuth(): Promise<{
  id: number
  email: string
  roles: string[]
  permissions: string[]
}> {
  const res = await axios.get("/api/auth/access")
  console.log("fetch access: ", res.data)
  return res.data as {
    id: number
    email: string
    roles: string[]
    permissions: string[]
  }
}

>
