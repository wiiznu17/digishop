"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Popover, PopoverAnchor } from "@/components/ui/popover"
import Link from "next/link"
import { Search, Plus } from "lucide-react"
import {
  fetchRoleList,
  createRole,
  type AdminRoleListItem
} from "@/utils/requesters/rolesRequester"
import { Pager } from "@/components/common/Pager"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function AdminRolesPage() {
  // filters (draft)
  const [qDraft, setQDraft] = useState("")
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [rows, setRows] = useState<AdminRoleListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const params = useMemo(
    () => ({
      q: q || undefined,
      sortBy: "createdAt" as const,
      sortDir: "desc" as const,
      page,
      pageSize
    }),
    [q, page, pageSize]
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, meta } = await fetchRoleList(params)
      setRows(data)
      setTotal(meta.total)
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    void load()
  }, [load])

  const onSearch = useCallback(() => {
    setQ(qDraft.trim())
    setPage(1)
    setTimeout(() => void load(), 0)
  }, [qDraft, load])

  const onClear = useCallback(() => {
    setQDraft("")
    setQ("")
    setPage(1)
    setTimeout(() => void load(), 0)
  }, [load])

  // ─────────────────────────
  // Create role (Dialog)
  // ─────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [slugDraft, setSlugDraft] = useState("")
  const [nameDraft, setNameDraft] = useState("")
  const [formErr, setFormErr] = useState<string | null>(null)

  function resetDialog() {
    setSlugDraft("")
    setNameDraft("")
    setFormErr(null)
  }

  function normalizeSlug(s: string) {
    // ช่วยผู้ใช้เล็กน้อย: trim + แปลงช่องว่าง/ตัวพิเศษเป็น "-"
    return s
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "_")
      .replace(/[^A-Z0-9_]/g, "")
  }

  async function handleCreateRole(e?: React.FormEvent) {
    e?.preventDefault()
    const slug = normalizeSlug(slugDraft)
    const name = nameDraft.trim() || slug

    if (!slug) {
      setFormErr("Slug is required")
      return
    }
    if (slug === "SUPER_ADMIN") {
      setFormErr("SUPER_ADMIN is reserved and cannot be created here.")
      return
    }

    setCreating(true)
    setFormErr(null)
    try {
      await createRole({ slug, name })
      resetDialog()
      setDialogOpen(false)
      await load()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      // แสดง error จาก backend ถ้ามี
      const message =
        err?.response?.data?.error || err?.message || "Failed to create role"
      setFormErr(message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <CardTitle>Roles</CardTitle>
            <CardDescription>Assign roles & Permission</CardDescription>
          </div>

          {/* New role dialog trigger */}
          {/* <Dialog
            open={dialogOpen}
            onOpenChange={(o) => {
              setDialogOpen(o)
              if (!o) resetDialog()
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> New role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New role</DialogTitle>
                <DialogDescription>
                  Create a new role to group permissions and assign to admins.
                </DialogDescription>
              </DialogHeader>

              <form className="space-y-4" onSubmit={handleCreateRole}>
                <div className="space-y-2">
                  <Label htmlFor="role-slug">Slug (unique) *</Label>
                  <Input
                    id="role-slug"
                    value={slugDraft}
                    onChange={(e) => setSlugDraft(e.target.value)}
                    placeholder="e.g. RBAC_ADMIN"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    Use uppercase letters, digits and underscores only. (e.g.,{" "}
                    <span className="font-mono">RBAC_ADMIN</span>)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role-name">Name</Label>
                  <Input
                    id="role-name"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    placeholder="e.g. RBAC Admin"
                  />
                </div>

                {formErr && (
                  <div className="text-sm text-destructive">{formErr}</div>
                )}

                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetDialog()
                      setDialogOpen(false)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? "Saving..." : "Create role"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog> */}
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="md:col-span-4">
              <label className="block text-sm mb-1">Search role</label>
              <Popover>
                <PopoverAnchor asChild>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Role name"
                      value={qDraft}
                      onChange={(e) => setQDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onSearch()
                      }}
                    />
                  </div>
                </PopoverAnchor>
              </Popover>
            </div>
            <div className="md:col-span-2 flex items-end justify-end gap-2">
              <Button onClick={onSearch} className="gap-2">
                <Search className="h-4 w-4" /> Search
              </Button>
              <Button variant="outline" onClick={onClear}>
                Clear filter
              </Button>
            </div>
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  {/* <TableHead>Slug</TableHead> */}
                  <TableHead>Permissions</TableHead>
                  <TableHead>System</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.name}</TableCell>
                      {/* <TableCell className="font-mono text-xs">
                        {r.slug}
                      </TableCell> */}
                      <TableCell>{r.permissionCount}</TableCell>
                      <TableCell>{r.isSystem ? "Yes" : "No"}</TableCell>
                      <TableCell>
                        {new Date(r.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" asChild>
                          <Link href={`/admin/roles/${r.id}`}>Edit</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                {!loading && rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-sm text-muted-foreground"
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
    </div>
  )
}
