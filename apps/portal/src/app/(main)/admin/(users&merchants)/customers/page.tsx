"use client"

import { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
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
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select"
import { Eye, Search } from "lucide-react"

import type { AdminUserLite } from "@/types/admin/users"
import {
  fetchAdminUserListRequester,
  fetchAdminUserSuggest
} from "@/utils/requesters/userMerchantRequester"
import { Pager } from "@/components/common/Pager"

// function Pager({ page, pageSize, total, onPage, onPageSize }: any) {
//   const totalPages = Math.max(1, Math.ceil(total / pageSize))
//   return (
//     <div className="flex items-center justify-between gap-3 py-3">
//       <div className="text-sm text-muted-foreground">{total} users</div>
//       <div className="flex items-center gap-2">
//         <Select
//           value={String(pageSize)}
//           onValueChange={(v) => onPageSize(Number(v))}
//         >
//           <SelectTrigger className="w-[120px]">
//             <SelectValue />
//           </SelectTrigger>
//           <SelectContent>
//             {[10, 20, 50, 100].map((s) => (
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
//         <div className="text-sm">
//           {page} / {totalPages}
//         </div>
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

export default function AdminCustomersPage() {
  const router = useRouter()

  // input states (ยังไม่ยิงค้นหา)
  const [qInput, setQInput] = useState("")
  const [openSuggest, setOpenSuggest] = useState(false)
  const [suggest, setSuggest] = useState<
    Array<{ id: number; name: string; email: string }>
  >([])

  // applied filters (ค่าที่กด Search แล้ว)
  const [applied, setApplied] = useState<{ q?: string }>({})

  // paging
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // data
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<AdminUserLite[]>([])
  const [total, setTotal] = useState(0)

  // โหลด list: ใช้เฉพาะตอน applied หรือ page/pageSize เปลี่ยน
  async function load() {
    setLoading(true)
    try {
      const { data, meta } = await fetchAdminUserListRequester({
        q: applied.q,
        page,
        pageSize,
        sortBy: "createdAt",
        sortDir: "desc"
      })
      setRows(data)
      setTotal(meta.total)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    void load()
  }, [applied, page, pageSize])

  // suggest: อนุญาตยิงได้ตามปกติ (ไม่ใช่ตัว list requester)
  useEffect(() => {
    let alive = true
    const t = setTimeout(async () => {
      const q = qInput.trim()
      if (!q) {
        setOpenSuggest(false)
        setSuggest([])
        return
      }
      const s = await fetchAdminUserSuggest(q)
      if (!alive) return
      setSuggest(s.slice(0, 8))
      setOpenSuggest(true)
    }, 240)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [qInput])

  const pageRows = useMemo(() => rows, [rows])

  const onSearch = () => {
    setApplied({ q: qInput.trim() || undefined })
    setPage(1)
    setOpenSuggest(false)
  }

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Browse users (no tier / no status)</CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Search</label>
              <Popover open={openSuggest} onOpenChange={setOpenSuggest}>
                <PopoverAnchor asChild>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Name / email"
                      value={qInput}
                      onChange={(e) => setQInput(e.target.value)}
                      onFocus={() => {
                        if (qInput.trim()) setOpenSuggest(true)
                      }}
                      onBlur={() =>
                        setTimeout(() => setOpenSuggest(false), 120)
                      }
                    />
                    <Button onClick={onSearch}>
                      <Search className="h-4 w-4 mr-2" /> Search
                    </Button>
                  </div>
                </PopoverAnchor>
                <PopoverContent
                  className="w-[520px] p-0"
                  align="start"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <div className="max-h-80 overflow-auto">
                    {suggest.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No suggestions
                      </div>
                    ) : (
                      suggest.map((s) => (
                        <button
                          key={s.id}
                          className="w-full text-left px-3 py-2 hover:bg-accent"
                          onClick={() => {
                            setQInput(s.email)
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
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  pageRows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.email}</TableCell>
                      <TableCell>
                        {new Date(r.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {!r.store ? (
                          "—"
                        ) : (
                          <button
                            className="text-primary hover:underline"
                            onClick={() =>
                              router.push(`/admin/merchants/${r.store!.id}`)
                            }
                          >
                            {r.store.storeName}
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="mr-2"
                          onClick={() =>
                            router.push(`/admin/customers/${r.id}`)
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            router.push(`/admin/customers/${r.id}`)
                          }
                        >
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                {!loading && pageRows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-sm text-muted-foreground"
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
            onPage={setPage}
            onPageSize={(s: number) => {
              setPageSize(s)
              setPage(1)
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
