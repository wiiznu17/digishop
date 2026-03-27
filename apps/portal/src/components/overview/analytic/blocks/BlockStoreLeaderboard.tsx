'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { fetchAnaStores } from '@/utils/requesters/analyticsRequester'
import type { StoreLeaderboardResponse } from '@/types/admin/analytics'

const fmtTHB = (minor: number) =>
  (minor / 100).toLocaleString('th-TH', { style: 'currency', currency: 'THB' })

export default function BlockStoreLeaderboard({
  from,
  to,
  refreshKey
}: {
  from: string
  to: string
  refreshKey: number
}) {
  const [segment, setSegment] = useState<'ALL' | 'TOP' | 'LOW'>('ALL')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [data, setData] = useState<StoreLeaderboardResponse>({
    total: 0,
    rows: []
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setPage(1)
  }, [segment, q])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const resp = await fetchAnaStores({
          from,
          to,
          q: q || undefined,
          segment,
          page,
          pageSize
        })
        if (!mounted) return
        setData(resp)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [from, to, refreshKey, segment, q, page, pageSize])

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(data.total / pageSize)),
    [data.total, pageSize]
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Stores (by GMV)</CardTitle>
        <CardDescription>
          {loading ? 'Loading…' : 'เรียงจากมากไปน้อยตามช่วงวันที่เลือก'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2 pb-3">
          <Input
            placeholder="Search store name"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-[240px]"
          />
          <Select
            value={segment}
            onValueChange={(v: 'ALL' | 'TOP' | 'LOW') => setSegment(v)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="TOP">Top 10</SelectItem>
              <SelectItem value="LOW">Lowest 10</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto flex items-center gap-2">
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
          </div>
        </div>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Store</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">GMV</TableHead>
                <TableHead className="text-right">AOV</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((r, idx) => (
                <TableRow key={`${r.storeId ?? 'null'}:${idx}`}>
                  <TableCell>{(page - 1) * pageSize + idx + 1}</TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell className="text-right">
                    {r.orders.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {fmtTHB(r.gmvMinor)}
                  </TableCell>
                  <TableCell className="text-right">
                    {fmtTHB(r.aovMinor)}
                  </TableCell>
                </TableRow>
              ))}
              {data.rows.length === 0 && (
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

        <div className="flex items-center justify-between gap-3 py-3">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + (data.rows.length ? 1 : 0)}-
            {Math.min(page * pageSize, data.total)} of {data.total}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 border rounded-md"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Prev
            </button>
            <div className="text-sm">
              Page {page} / {totalPages}
            </div>
            <button
              className="px-3 py-1 border rounded-md"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
