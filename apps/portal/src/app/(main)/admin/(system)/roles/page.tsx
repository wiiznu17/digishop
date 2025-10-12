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

  // create role quick
  const [creating, setCreating] = useState(false)
  const handleQuickCreate = async () => {
    const slug = window.prompt("Slug (unique):")
    if (!slug) return
    const name = window.prompt("Name:") || slug
    setCreating(true)
    try {
      await createRole({ slug, name })
      await load()
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
          <Button
            className="gap-2"
            onClick={handleQuickCreate}
            disabled={creating}
          >
            <Plus className="h-4 w-4" /> New role
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="md:col-span-4">
              <label className="block text-sm mb-1">Search role</label>
              <Popover>
                <PopoverAnchor asChild>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Name / slug"
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
                  <TableHead>Slug</TableHead>
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
                      <TableCell className="font-mono text-xs">
                        {r.slug}
                      </TableCell>
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
