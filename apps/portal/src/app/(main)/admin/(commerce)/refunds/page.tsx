// apps/portal/src/app/(main)/admin/refunds/page.tsx
"use client"

import { useMemo, useState } from "react"
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

type Refund = {
  id: number
  orderCode: string
  reason: string
  amountMinor: number
  status: "REQUESTED" | "APPROVED" | "PROCESSING" | "SUCCESS" | "FAIL"
  requestedAt: string
}

const MOCK: Refund[] = Array.from({ length: 52 }).map((_, i) => ({
  id: 9000 + i,
  orderCode: `ORD-${(6500 + i).toString(36).toUpperCase()}`,
  reason: ["Customer cancel", "Wrong item", "Damaged"][i % 3],
  amountMinor: 29900 + (i % 4) * 5000,
  status: (
    [
      "REQUESTED",
      "APPROVED",
      "PROCESSING",
      "SUCCESS",
      "FAIL"
    ] as Refund["status"][]
  )[i % 5],
  requestedAt: new Date(Date.now() - i * 7200000).toISOString()
}))
const formatTHB = (m: number) =>
  (m / 100).toLocaleString("th-TH", { style: "currency", currency: "THB" })

function Pager({ page, pageSize, total, onPage, onPageSize }: any) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className="flex items-center justify-between py-3">
      <div className="text-sm text-muted-foreground">{total} refunds</div>
      <div className="flex items-center gap-2">
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSize(Number(v))}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 50, 100].map((s) => (
              <SelectItem key={s} value={String(s)}>
                {s} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          Prev
        </Button>
        <div className="text-sm">
          {page} / {totalPages}
        </div>
        <Button
          variant="outline"
          onClick={() => onPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

export default function AdminRefundsPage() {
  const router = useRouter()
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<Refund["status"] | "ALL">("ALL")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const filtered = useMemo(() => {
    let base = MOCK
    const t = q.toLowerCase().trim()
    if (t)
      base = base.filter(
        (r) =>
          r.orderCode.toLowerCase().includes(t) ||
          r.reason.toLowerCase().includes(t)
      )
    if (status !== "ALL") base = base.filter((r) => r.status === status)
    return base
  }, [q, status])

  const total = filtered.length
  const rows = useMemo(() => {
    const s = (page - 1) * pageSize
    return filtered.slice(s, s + pageSize)
  }, [filtered, page, pageSize])

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Refunds</CardTitle>
          <CardDescription>Refund requests & results (mock)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Search</label>
              <Input
                placeholder="Order / reason"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Status</label>
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v as any)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="REQUESTED">REQUESTED</SelectItem>
                  <SelectItem value="APPROVED">APPROVED</SelectItem>
                  <SelectItem value="PROCESSING">PROCESSING</SelectItem>
                  <SelectItem value="SUCCESS">SUCCESS</SelectItem>
                  <SelectItem value="FAIL">FAIL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Requested at</TableHead>
                  <TableHead className="text-right">Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.orderCode}</TableCell>
                    <TableCell>{r.reason}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatTHB(r.amountMinor)}
                    </TableCell>
                    <TableCell>
                      {new Date(r.requestedAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => router.push(`/admin/refunds/${r.id}`)}
                      >
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
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
