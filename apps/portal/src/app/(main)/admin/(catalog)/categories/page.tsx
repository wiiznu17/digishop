// apps/portal/src/app/(main)/admin/categories/page.tsx
"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Plus,
  Edit,
  Trash2,
  EyeOff,
  Eye,
  Search,
  AlertTriangle
} from "lucide-react"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"

// ============== Types ==============
type CatStatus = "ACTIVE" | "HIDDEN"
type CategoryNode = {
  id: string
  name: string
  slug?: string
  status: CatStatus
  parentId: string | null
  productCount: number // สินค้าที่อยู่ "ตรงหมวดนี้"
  // optional for BE later
  createdAt?: string
  updatedAt?: string
}

// ============== Mock API (replace later with real endpoints) ==============
const seed: CategoryNode[] = [
  {
    id: "c1",
    name: "Electronics",
    status: "ACTIVE",
    parentId: null,
    productCount: 12
  },
  {
    id: "c1-1",
    name: "Mobile Phones",
    status: "ACTIVE",
    parentId: "c1",
    productCount: 8
  },
  {
    id: "c1-2",
    name: "Laptops",
    status: "HIDDEN",
    parentId: "c1",
    productCount: 0
  },
  {
    id: "c1-3",
    name: "Cameras",
    status: "ACTIVE",
    parentId: "c1",
    productCount: 4
  },

  {
    id: "c2",
    name: "Home & Living",
    status: "ACTIVE",
    parentId: null,
    productCount: 0
  },
  {
    id: "c2-1",
    name: "Furniture",
    status: "ACTIVE",
    parentId: "c2",
    productCount: 0
  },
  {
    id: "c2-2",
    name: "Kitchenware",
    status: "ACTIVE",
    parentId: "c2",
    productCount: 0
  },

  {
    id: "c3",
    name: "Fashion",
    status: "ACTIVE",
    parentId: null,
    productCount: 34
  },
  {
    id: "c3-1",
    name: "Men",
    status: "ACTIVE",
    parentId: "c3",
    productCount: 10
  },
  {
    id: "c3-2",
    name: "Women",
    status: "ACTIVE",
    parentId: "c3",
    productCount: 24
  }
]

// simulate latency
const wait = (ms = 300) => new Promise((r) => setTimeout(r, ms))

const mockApi = {
  async list(): Promise<CategoryNode[]> {
    await wait(150)
    return JSON.parse(JSON.stringify(seedStore))
  },
  async create(
    payload: Omit<CategoryNode, "id" | "productCount"> & {
      productCount?: number
    }
  ): Promise<CategoryNode> {
    await wait(200)
    const id = crypto.randomUUID()
    const item: CategoryNode = {
      id,
      name: payload.name.trim(),
      slug: payload.slug?.trim(),
      status: payload.status ?? "ACTIVE",
      parentId: payload.parentId ?? null,
      productCount: payload.productCount ?? 0
    }
    seedStore.push(item)
    return JSON.parse(JSON.stringify(item))
  },
  async update(
    id: string,
    patch: Partial<Omit<CategoryNode, "id">>
  ): Promise<CategoryNode | null> {
    await wait(200)
    const idx = seedStore.findIndex((c) => c.id === id)
    if (idx === -1) return null
    seedStore[idx] = { ...seedStore[idx], ...patch }
    return JSON.parse(JSON.stringify(seedStore[idx]))
  },
  async remove(id: string): Promise<boolean> {
    await wait(200)
    const idx = seedStore.findIndex((c) => c.id === id)
    if (idx === -1) return false
    seedStore.splice(idx, 1)
    // ลบลูกหลานทั้งหมดด้วย (mock)
    for (;;) {
      const before = seedStore.length
      seedStore = seedStore.filter((c) => c.parentId !== id)
      if (seedStore.length === before) break
    }
    return true
  }
}

// in-memory store
let seedStore: CategoryNode[] = JSON.parse(JSON.stringify(seed))

// ============== Helpers ==============
type FlatRow = CategoryNode & {
  level: number
  direct: number
  total: number // รวมลูกหลานทั้งหมด
}

function buildMapByParent(items: CategoryNode[]) {
  const map = new Map<string | null, CategoryNode[]>()
  for (const c of items) {
    const k = c.parentId
    const arr = map.get(k) ?? []
    arr.push(c)
    map.set(k, arr)
  }
  // sort by name asc
  for (const [k, arr] of map) {
    arr.sort((a, b) => a.name.localeCompare(b.name))
    map.set(k, arr)
  }
  return map
}

function computeTotals(items: CategoryNode[]): Map<string, number> {
  const byParent = buildMapByParent(items)
  const childrenOf = (id: string): CategoryNode[] => byParent.get(id) ?? []

  const totals = new Map<string, number>()
  const direct = new Map<string, number>()
  for (const c of items) direct.set(c.id, c.productCount)

  const dfs = (id: string): number => {
    const mine = direct.get(id) ?? 0
    const kids = childrenOf(id)
    let sum = mine
    for (const k of kids) sum += dfs(k.id)
    totals.set(id, sum)
    return sum
  }

  // root-first
  for (const root of byParent.get(null) ?? []) dfs(root.id)
  return totals
}

function flattenTree(items: CategoryNode[]): FlatRow[] {
  const byParent = buildMapByParent(items)
  const totals = computeTotals(items)

  const out: FlatRow[] = []
  const walk = (parentId: string | null, level: number) => {
    for (const c of byParent.get(parentId) ?? []) {
      out.push({
        ...c,
        level,
        direct: c.productCount,
        total: totals.get(c.id) ?? c.productCount
      })
      walk(c.id, level + 1)
    }
  }
  walk(null, 0)
  return out
}

// paginate client-side mock
function paginate<T>(arr: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize
  const end = start + pageSize
  return arr.slice(start, end)
}

// ============== Page ==============
type FormState = {
  id?: string
  name: string
  parentId: string | null
  status: CatStatus
}

const DEFAULT_FORM: FormState = {
  name: "",
  parentId: null,
  status: "ACTIVE"
}

export default function AdminCategoriesPage() {
  // data
  const [raw, setRaw] = useState<CategoryNode[]>([])
  const [loading, setLoading] = useState(false)

  // search + filter
  const [q, setQ] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | CatStatus>("ALL")

  // suggest
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [suggestList, setSuggestList] = useState<CategoryNode[]>([])
  const suggestTimer = useRef<number | null>(null)

  // pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // dialogs
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [deleteTarget, setDeleteTarget] = useState<FlatRow | null>(null)
  const [hideTarget, setHideTarget] = useState<FlatRow | null>(null)

  // load
  const load = async () => {
    setLoading(true)
    const res = await mockApi.list()
    setRaw(res)
    setLoading(false)
  }
  useEffect(() => {
    load()
  }, [])

  // derived
  const flatAll = useMemo(() => flattenTree(raw), [raw])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    const match = (r: FlatRow) =>
      (!term || r.name.toLowerCase().includes(term)) &&
      (statusFilter === "ALL" || r.status === statusFilter)
    return flatAll.filter(match)
  }, [flatAll, q, statusFilter])

  const totalItems = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const pageData = paginate(filtered, Math.min(page, totalPages), pageSize)

  // suggest search
  useEffect(() => {
    const term = q.trim().toLowerCase()
    if (!term) {
      setSuggestList([])
      setSuggestOpen(false)
      return
    }
    if (suggestTimer.current) window.clearTimeout(suggestTimer.current)
    setSuggestOpen(true)
    suggestTimer.current = window.setTimeout(() => {
      const list = flatAll
        .filter((c) => c.name.toLowerCase().includes(term))
        .slice(0, 8)
      setSuggestList(list)
    }, 250)
    return () => {
      if (suggestTimer.current) window.clearTimeout(suggestTimer.current)
    }
  }, [q, flatAll])

  // actions
  const openCreate = () => {
    setForm({ ...DEFAULT_FORM })
    setFormOpen(true)
  }
  const openEdit = (row: FlatRow) => {
    setForm({
      id: row.id,
      name: row.name,
      parentId: row.parentId,
      status: row.status
    })
    setFormOpen(true)
  }

  const canDelete = (row: FlatRow) => row.total === 0
  const confirmDelete = (row: FlatRow) => {
    if (!canDelete(row)) {
      alert(
        `ลบไม่ได้: "${row.name}" ยังมีสินค้าอยู่ ${row.total} รายการ (รวมลูกหมวด)\nกรุณาย้ายสินค้าก่อน`
      )
      return
    }
    setDeleteTarget(row)
  }

  const confirmToggleHide = (row: FlatRow) => {
    // แจ้งถ้ามีสินค้า แต่ยอมให้ซ่อนได้
    if (row.total > 0) {
      setHideTarget(row)
    } else {
      // toggle ทันทีถ้าไม่มีสินค้า
      handleToggleHide(row)
    }
  }

  const handleToggleHide = async (row: FlatRow) => {
    const next: CatStatus = row.status === "ACTIVE" ? "HIDDEN" : "ACTIVE"
    const updated = await mockApi.update(row.id, { status: next })
    if (updated) await load()
    setHideTarget(null)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await mockApi.remove(deleteTarget.id)
    setDeleteTarget(null)
    await load()
  }

  const handleSave = async () => {
    const payload = {
      name: form.name.trim(),
      parentId: form.parentId,
      status: form.status
    } as const

    if (!payload.name) {
      alert("กรุณากรอกชื่อหมวดหมู่")
      return
    }
    if (!form.id) {
      await mockApi.create(payload)
    } else {
      await mockApi.update(form.id, payload)
    }
    setFormOpen(false)
    await load()
  }

  const statusBadge = (s: CatStatus) =>
    s === "ACTIVE" ? (
      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
        ACTIVE
      </Badge>
    ) : (
      <Badge className="bg-gray-200 text-gray-800 border-gray-300">
        HIDDEN
      </Badge>
    )

  const indent = (level: number) => (
    <span style={{ paddingLeft: level * 16 }} aria-hidden>
      {level > 0 ? "— ".repeat(1) : ""}
    </span>
  )

  const parentOptions = useMemo(() => {
    // ไม่อนุญาต parent เป็นตัวเองตอนแก้ไข — handle ง่ายๆด้วยการ filter
    return flatAll.filter((c) => c.id !== form.id)
  }, [flatAll, form.id])

  return (
    <div className="p-4">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle>Categories</CardTitle>
            <CardDescription>
              จัดการหมวดหมู่สินค้า (ลบได้เฉพาะหมวดที่ไม่มีสินค้า / ซ่อนได้เสมอ)
            </CardDescription>
          </div>

          <div className="flex flex-col md:flex-row gap-3 md:items-end">
            {/* Search + Suggest */}
            <div className="w-[320px]">
              <label className="block text-sm mb-1">Search</label>
              <Popover open={suggestOpen} onOpenChange={setSuggestOpen}>
                <PopoverAnchor asChild>
                  <div className="flex gap-2">
                    <Input
                      value={q}
                      onChange={(e) => {
                        setQ(e.target.value)
                        setPage(1)
                        setSuggestOpen(true)
                      }}
                      placeholder="ค้นหาด้วยชื่อหมวด"
                      onBlur={() =>
                        setTimeout(() => setSuggestOpen(false), 120)
                      }
                      onFocus={() => {
                        if (q.trim()) setSuggestOpen(true)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setSuggestOpen(false)
                      }}
                    />
                    <Button onClick={() => setSuggestOpen(false)}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </PopoverAnchor>
                <PopoverContent
                  className="w-[360px] p-0"
                  align="start"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <div className="max-h-72 overflow-auto">
                    {suggestList.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        ไม่มีคำแนะนำ
                      </div>
                    ) : (
                      suggestList.map((s) => (
                        <button
                          key={s.id}
                          className="w-full text-left px-3 py-2 hover:bg-accent"
                          onClick={() => {
                            setQ(s.name)
                            setSuggestOpen(false)
                          }}
                        >
                          <div className="text-sm">
                            {Array(s.level ?? 0)
                              .fill("• ")
                              .join("")}
                            {s.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            Status: {s.status} · Products (total): {s.total}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Status filter */}
            <div>
              <label className="block text-sm mb-1">Status</label>
              <Select
                value={statusFilter}
                onValueChange={(v: "ALL" | CatStatus) => {
                  setStatusFilter(v)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="HIDDEN">HIDDEN</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={openCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Category
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">
                    Products (direct)
                  </TableHead>
                  <TableHead className="text-right">Products (total)</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-sm text-muted-foreground"
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && pageData.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-sm text-muted-foreground"
                    >
                      ไม่มีข้อมูล
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  pageData.map((row) => {
                    const parentName =
                      flatAll.find((c) => c.id === row.parentId)?.name || "-"
                    const dangerDelete = !canDelete(row)
                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div className="flex items-center">
                            {indent(row.level)}
                            <span className="font-medium">{row.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{statusBadge(row.status)}</TableCell>
                        <TableCell className="text-right">
                          {row.direct}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.total}
                        </TableCell>
                        <TableCell>{parentName}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(row)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>

                            {row.status === "ACTIVE" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => confirmToggleHide(row)}
                                title={
                                  row.total > 0
                                    ? "หมวดนี้มีสินค้า — จะซ่อนทั้งที่มีสินค้า (ได้) แต่จะแจ้งเตือนก่อน"
                                    : "ซ่อนหมวดนี้"
                                }
                              >
                                <EyeOff className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleHide(row)}
                                title="ทำให้แสดงผลอีกครั้ง (Unhide)"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant={dangerDelete ? "outline" : "destructive"}
                              onClick={() => confirmDelete(row)}
                              title={
                                dangerDelete
                                  ? "ลบไม่ได้: ยังมีสินค้าอยู่ในหมวดนี้ (รวมลูกหมวด)"
                                  : "ลบหมวดนี้"
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-muted-foreground">
              Total: <span className="font-medium">{totalItems}</span>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v))
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Prev
                </Button>
                <div className="text-sm">
                  Page <span className="font-medium">{page}</span> /{" "}
                  {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== Create / Edit Dialog ===== */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Edit Category" : "Add Category"}
            </DialogTitle>
            <DialogDescription>
              {form.id
                ? "แก้ไขรายละเอียดหมวดหมู่"
                : "สร้างหมวดหมู่ใหม่ (สามารถเลือก parent ได้)"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Name</label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="เช่น Electronics"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Parent</label>
              <Select
                value={form.parentId ?? "__ROOT__"}
                onValueChange={(v) => {
                  setForm((f) => ({
                    ...f,
                    parentId: v === "__ROOT__" ? null : v
                  }))
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  <SelectItem value="__ROOT__">— Root —</SelectItem>
                  {parentOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {Array(c.level).fill("— ").join("")}
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm mb-1">Status</label>
              <Select
                value={form.status}
                onValueChange={(v: CatStatus) =>
                  setForm((f) => ({ ...f, status: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="HIDDEN">HIDDEN</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Hint: ลบได้เฉพาะหมวดที่ไม่มีสินค้า */}
            {form.id && (
              <div className="flex items-start gap-2 rounded border p-2 text-sm">
                <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-500" />
                <div className="text-muted-foreground">
                  การลบหมวดทำได้เฉพาะกรณีที่หมวด (รวมลูกหมวด) ไม่มีสินค้า
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Delete confirm (block if has products) ===== */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              การลบจะทำได้เฉพาะหมวดที่ไม่มีสินค้าอยู่ (รวมลูกหมวด)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-sm">
              หมวด: <span className="font-medium">{deleteTarget?.name}</span>
            </div>
            {deleteTarget && deleteTarget.total > 0 && (
              <div className="text-sm text-destructive">
                ลบไม่ได้ — มีสินค้า {deleteTarget.total} รายการในหมวดนี้
                (รวมลูกหมวด)
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!deleteTarget || deleteTarget.total > 0}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Hide confirm (allow even if has products) ===== */}
      <Dialog open={!!hideTarget} onOpenChange={() => setHideTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {hideTarget?.status === "ACTIVE"
                ? "Hide Category"
                : "Unhide Category"}
            </DialogTitle>
            <DialogDescription>
              {hideTarget?.status === "ACTIVE"
                ? "ยังมีสินค้าได้ แต่จะไม่แสดงบนหมวดฝั่งลูกค้า"
                : "เปิดให้แสดงหมวดนี้อีกครั้ง"}
            </DialogDescription>
          </DialogHeader>
          {hideTarget && hideTarget.total > 0 && (
            <div className="text-sm rounded border p-2 bg-amber-50 border-amber-200 text-amber-800">
              หมวดนี้มีสินค้า {hideTarget.total} รายการ (รวมลูกหมวด) •
              ระบบจะซ่อนหมวดได้ตามนโยบาย
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setHideTarget(null)}>
              Cancel
            </Button>
            <Button onClick={() => hideTarget && handleToggleHide(hideTarget)}>
              {hideTarget?.status === "ACTIVE" ? "Hide" : "Unhide"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
