// apps/portal/src/app/(main)/admin/system/admins/page.tsx
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Eye, Search, Shield, UserPlus } from "lucide-react"
import Link from "next/link"

type AdminRow = {
  id: number
  name: string
  email: string
  role: "SUPER_ADMIN" | "ADMIN" | "MODERATOR" | "VIEWER"
  status: "ACTIVE" | "SUSPENDED"
  lastLoginAt?: string
}

const MOCK_ADMINS: AdminRow[] = Array.from({ length: 48 }).map((_, i) => ({
  id: 900 + i,
  name: `Admin ${i + 1}`,
  email: `admin${i + 1}@digishop.local`,
  role: (["SUPER_ADMIN", "ADMIN", "MODERATOR", "VIEWER"] as const)[i % 4],
  status: i % 9 === 0 ? "SUSPENDED" : "ACTIVE",
  lastLoginAt: new Date(Date.now() - (i % 15) * 86400000).toISOString()
}))

function useDebounce<T>(v: T, ms = 300) {
  const [s, setS] = useState(v)
  useEffect(() => {
    const t = setTimeout(() => setS(v), ms)
    return () => clearTimeout(t)
  }, [v, ms])
  return s
}

export default function AdminUsersRolesPage() {
  // search + suggest
  const [q, setQ] = useState("")
  const dq = useDebounce(q, 250)
  const [openSuggest, setOpenSuggest] = useState(false)
  const [loadingSuggest, setLoadingSuggest] = useState(false)
  const [suggest, setSuggest] = useState<AdminRow[]>([])
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (!dq.trim()) {
      setOpenSuggest(false)
      setSuggest([])
      return
    }
    setLoadingSuggest(true)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      const t = dq.toLowerCase()
      const res = MOCK_ADMINS.filter(
        (a) =>
          a.name.toLowerCase().includes(t) || a.email.toLowerCase().includes(t)
      ).slice(0, 8)
      setSuggest(res)
      setLoadingSuggest(false)
      setOpenSuggest(true)
    }, 200)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [dq])

  // filters
  const [role, setRole] = useState<"ALL" | AdminRow["role"]>("ALL")
  const [status, setStatus] = useState<"ALL" | AdminRow["status"]>("ALL")

  // list
  const rows = useMemo(() => {
    let f = MOCK_ADMINS
    if (q.trim()) {
      const t = q.toLowerCase()
      f = f.filter(
        (a) =>
          a.name.toLowerCase().includes(t) || a.email.toLowerCase().includes(t)
      )
    }
    if (role !== "ALL") f = f.filter((a) => a.role === role)
    if (status !== "ALL") f = f.filter((a) => a.status === status)
    return f
  }, [q, role, status])

  // paging
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const total = rows.length
  const pageRows = useMemo(() => {
    const s = (page - 1) * pageSize
    return rows.slice(s, s + pageSize)
  }, [rows, page, pageSize])

  // quick view
  const [openQV, setOpenQV] = useState(false)
  const [current, setCurrent] = useState<AdminRow | null>(null)

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>Admin Users & Roles</CardTitle>
            <CardDescription>จัดการผู้ดูแลระบบ บทบาท และสถานะ</CardDescription>
          </div>
          <Button asChild className="gap-2">
            <Link href="/admin/system/admins/new">
              <UserPlus className="h-4 w-4" />
              Add admin
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* search + suggest */}
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Search admin</label>
            <Popover open={openSuggest} onOpenChange={setOpenSuggest}>
              <PopoverAnchor asChild>
                <div className="flex gap-2">
                  <Input
                    placeholder="Name / email"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onFocus={() => {
                      if (q.trim()) setOpenSuggest(true)
                    }}
                    onBlur={() => {
                      setTimeout(() => setOpenSuggest(false), 120)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setOpenSuggest(false)
                    }}
                  />
                  <Button onClick={() => setOpenSuggest(false)}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </PopoverAnchor>
              <PopoverContent
                className="w-[520px] p-0"
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <div className="max-h-80 overflow-auto">
                  {loadingSuggest ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Searching...
                    </div>
                  ) : suggest.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No suggestions
                    </div>
                  ) : (
                    suggest.map((s) => (
                      <button
                        key={s.id}
                        className="w-full text-left px-3 py-2 hover:bg-accent"
                        onClick={() => {
                          setQ(s.email)
                          setOpenSuggest(false)
                        }}
                      >
                        <div className="text-sm font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.email}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="block text-sm mb-1">Role</label>
            <Select
              value={role}
              onValueChange={(v: any) => {
                setRole(v)
                setPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="SUPER_ADMIN">SUPER_ADMIN</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
                <SelectItem value="MODERATOR">MODERATOR</SelectItem>
                <SelectItem value="VIEWER">VIEWER</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm mb-1">Status</label>
            <Select
              value={status}
              onValueChange={(v: any) => {
                setStatus(v)
                setPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admin list</CardTitle>
          <CardDescription>
            แสดงเฉพาะข้อมูลที่จำเป็นต่อการจัดการ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last login</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{a.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {a.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <Shield className="h-3 w-3" />
                        {a.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          a.status === "ACTIVE"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        }
                      >
                        {a.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {a.lastLoginAt
                        ? new Date(a.lastLoginAt).toLocaleString()
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-2"
                        onClick={() => {
                          setCurrent(a)
                          setOpenQV(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" asChild>
                        <Link href={`/admin/system/admins/${a.id}`}>
                          Detail
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {pageRows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-sm text-muted-foreground"
                    >
                      No data
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* pager */}
          <div className="flex items-center justify-between gap-3 py-3">
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1}-
              {Math.min(page * pageSize, total)} of {total}
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  const s = Number(v)
                  setPageSize(s)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50].map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setPage(Math.min(Math.ceil(total / pageSize), page + 1))
                }
                disabled={page >= Math.ceil(total / pageSize)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick view */}
      <Dialog open={openQV} onOpenChange={setOpenQV}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin quick view</DialogTitle>
          </DialogHeader>
          {current && (
            <div className="text-sm space-y-2">
              <div>
                Name: <span className="font-medium">{current.name}</span>
              </div>
              <div>Email: {current.email}</div>
              <div>Role: {current.role}</div>
              <div>Status: {current.status}</div>
              <div>
                Last login:{" "}
                {current.lastLoginAt
                  ? new Date(current.lastLoginAt).toLocaleString()
                  : "-"}
              </div>
              <div className="text-muted-foreground">* Mock only</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
