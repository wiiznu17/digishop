"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
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

import {
  fetchAdminList,
  fetchAdminSuggest
} from "@/utils/requesters/adminRequester"
import type { AdminListItem } from "@/types/system/admin"
import { Pager } from "@/components/common/Pager"

// simple pager
// function Pager({ page, pageSize, total, onPage, onPageSize }: any) {
//   const totalPages = Math.max(1, Math.ceil(total / pageSize))
//   return (
//     <div className="flex items-center justify-between gap-3 py-3">
//       <div className="text-sm text-muted-foreground">
//         Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)}{" "}
//         of {total}
//       </div>
//       <div className="flex items-center gap-2">
//         <Select
//           value={String(pageSize)}
//           onValueChange={(v) => onPageSize(Number(v))}
//         >
//           <SelectTrigger className="w-[120px]">
//             <SelectValue />
//           </SelectTrigger>
//           <SelectContent>
//             {[10, 20, 50].map((s) => (
//               <SelectItem key={s} value={String(s)}>
//                 {s} / page
//               </SelectItem>
//             ))}
//           </SelectContent>
//         </Select>
//         <Button
//           variant="outline"
//           onClick={() => onPage(Math.max(1, page - 1))}
//           disabled={page <= 1}
//         >
//           Prev
//         </Button>
//         <Button
//           variant="outline"
//           onClick={() => onPage(Math.min(totalPages, page + 1))}
//           disabled={page >= totalPages}
//         >
//           Next
//         </Button>
//       </div>
//     </div>
//   )
// }

function useDebounce<T>(v: T, ms = 250) {
  const [s, setS] = useState(v)
  useEffect(() => {
    const t = setTimeout(() => setS(v), ms)
    return () => clearTimeout(t)
  }, [v, ms])
  return s
}

export default function AdminUsersRolesPage() {
  // filters (draft)
  const [qDraft, setQDraft] = useState("")
  const [roleDraft, setRoleDraft] = useState<string | "ALL">("ALL")
  const [statusDraft, setStatusDraft] = useState<string | "ALL">("ALL")

  // submitted
  const [q, setQ] = useState("")
  const [role, setRole] = useState<string | "ALL">("ALL")
  const [status, setStatus] = useState<string | "ALL">("ALL")

  // list state
  const [rows, setRows] = useState<AdminListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const params = useMemo(
    () => ({
      q: q || undefined,
      role: role === "ALL" ? undefined : role,
      status: status === "ALL" ? undefined : status,
      sortBy: "createdAt" as const,
      sortDir: "desc" as const,
      page,
      pageSize
    }),
    [q, role, status, page, pageSize]
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, meta } = await fetchAdminList(params)
      setRows(data)
      setTotal(meta.total)
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    void load()
  }, [load])

  // Suggest
  const [openSuggest, setOpenSuggest] = useState(false)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [suggest, setSuggest] = useState<
    Array<{ id: number; name: string; email: string }>
  >([])
  const dq = useDebounce(qDraft, 250)
  useEffect(() => {
    let alive = true
    ;(async () => {
      const term = dq.trim()
      if (!term) {
        setOpenSuggest(false)
        setSuggest([])
        return
      }
      setSuggestLoading(true)
      try {
        const s = await fetchAdminSuggest(term)
        if (!alive) return
        setSuggest(s.slice(0, 8))
        setOpenSuggest(true)
      } finally {
        setSuggestLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [dq])

  // Actions
  const handleSubmit = useCallback(() => {
    setQ(qDraft.trim() || "")
    setRole(roleDraft)
    setStatus(statusDraft)
    setPage(1)
    setTimeout(() => void load(), 0)
  }, [qDraft, roleDraft, statusDraft, load])

  const handleClear = useCallback(() => {
    setQDraft("")
    setRoleDraft("ALL")
    setStatusDraft("ALL")
    setQ("")
    setRole("ALL")
    setStatus("ALL")
    setPage(1)
    setTimeout(() => void load(), 0)
  }, [load])

  // quick view (optional)
  const [openQV, setOpenQV] = useState(false)
  const [current, setCurrent] = useState<AdminListItem | null>(null)

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <CardTitle>Admin Users & Roles</CardTitle>
            <CardDescription>Manage admin user</CardDescription>
          </div>
          {/* ปุ่ม Add (แสดงได้ แต่ backend บังคับ Super Admin อยู่แล้ว) */}
          <Button asChild className="gap-2">
            <Link href="/admin/admins/new">
              <UserPlus className="h-4 w-4" />
              Add admin
            </Link>
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            {/* Search + Suggest */}
            <div className="md:col-span-3">
              <label className="block text-sm mb-1">Search admin</label>
              <Popover open={openSuggest} onOpenChange={setOpenSuggest}>
                <PopoverAnchor asChild>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Name / email"
                      value={qDraft}
                      onChange={(e) => setQDraft(e.target.value)}
                      onFocus={() => {
                        if (qDraft.trim()) setOpenSuggest(true)
                      }}
                      onBlur={() =>
                        setTimeout(() => setOpenSuggest(false), 120)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSubmit()
                      }}
                    />
                  </div>
                </PopoverAnchor>
                <PopoverContent
                  className="w-[520px] p-0"
                  align="start"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <div className="max-h-80 overflow-auto">
                    {suggestLoading ? (
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
                            setQDraft(s.email)
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

            {/* Role */}
            <div className="md:col-span-1">
              <label className="block text-sm mb-1">Role</label>
              <Select
                value={roleDraft}
                onValueChange={(v) => setRoleDraft(v as string)}
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

            {/* Status */}
            <div className="md:col-span-1">
              <label className="block text-sm mb-1">Status</label>
              <Select
                value={statusDraft}
                onValueChange={(v) => setStatusDraft(v as string)}
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

            {/* ปุ่มชิดขวา: Search | Clear */}
            <div className="md:col-span-1 flex items-end justify-end gap-2">
              <Button onClick={handleSubmit} className="gap-2">
                <Search className="h-4 w-4" /> Search
              </Button>
              <Button variant="outline" onClick={handleClear}>
                Clear filter
              </Button>
            </div>
          </div>

          {/* Table */}
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
                {loading && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-sm text-muted-foreground"
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  rows.map((a) => (
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
                          {a.primaryRole}
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
                          <Link href={`/admin/admins/${a.id}`}>Detail</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                {!loading && rows.length === 0 && (
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

          <Pager
            page={page}
            pageSize={pageSize}
            total={total}
            onPage={(p: number) => {
              setPage(p)
              setTimeout(() => void load(), 0)
            }}
            onPageSize={(s: number) => {
              setPageSize(s)
              setPage(1)
              setTimeout(() => void load(), 0)
            }}
          />
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
              <div>Roles: {current.roles.join(", ")}</div>
              <div>Status: {current.status}</div>
              <div>
                Last login:{" "}
                {current.lastLoginAt
                  ? new Date(current.lastLoginAt).toLocaleString()
                  : "-"}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
