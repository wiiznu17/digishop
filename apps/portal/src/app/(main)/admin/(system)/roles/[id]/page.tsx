'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  fetchRoleDetail,
  type AdminRoleDetail
} from '@/utils/requesters/rolesRequester'

type Grouped = Record<
  string,
  {
    id: number
    slug: string
    resource: string
    action: string
    effect: 'ALLOW' | 'DENY'
  }[]
>

function groupByResource(perms: AdminRoleDetail['allPermissions']): Grouped {
  return perms.reduce((acc, p) => {
    acc[p.resource] = acc[p.resource] || []
    acc[p.resource].push(p)
    return acc
  }, {} as Grouped)
}

export default function RoleViewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<AdminRoleDetail | null>(null)
  const [loading, setLoading] = useState(false)

  // สำหรับแสดงผลเท่านั้น
  const [filterText, setFilterText] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetchRoleDetail(Number(id))
        if (!alive) return
        setData(res)
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [id])

  const groups = useMemo(
    () => groupByResource(data?.allPermissions ?? []),
    [data]
  )

  const grantedSet = useMemo(
    () => new Set((data?.permissions ?? []).map((p) => p.id)),
    [data]
  )

  const filteredGroups = useMemo(() => {
    const kw = filterText.trim().toLowerCase()
    if (!kw) return groups
    const out: Grouped = {}
    Object.entries(groups).forEach(([resource, items]) => {
      const f = items.filter(
        (p) =>
          p.slug.toLowerCase().includes(kw) ||
          p.action.toLowerCase().includes(kw) ||
          resource.toLowerCase().includes(kw)
      )
      if (f.length) out[resource] = f
    })
    return out
  }, [groups, filterText])

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <CardTitle className="text-xl">{data?.name ?? 'Role'}</CardTitle>
            <CardDescription>View role & permissions</CardDescription>
            {!!data && (
              <div className="mt-2 text-sm space-y-1">
                <div>
                  <span className="text-muted-foreground">Slug: </span>
                  <span className="font-mono text-xs">{data.slug}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">System:</span>
                  <Badge variant="outline">
                    {data.isSystem ? 'Yes' : 'No'}
                  </Badge>
                </div>
                {data.description && (
                  <div>
                    <span className="text-muted-foreground">Description: </span>
                    <span>{data.description}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Updated:</span>{' '}
                  {data ? new Date(data.updatedAt).toLocaleString() : '-'}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/system/roles')}
            >
              Back
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading && (
            <div className="text-sm text-muted-foreground">Loading...</div>
          )}
          {!loading && !data && (
            <div className="text-sm text-destructive">Not found</div>
          )}

          {!!data && (
            <>
              <Separator className="my-4" />

              {/* Filter (ดูอย่างเดียว) */}
              <div className="flex items-end justify-between gap-3">
                <div className="w-full md:w-1/2">
                  <label className="block text-sm mb-1">
                    Filter permissions
                  </label>
                  <Input
                    placeholder="Search by slug / resource / action"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Granted:{' '}
                  <span className="font-medium">{grantedSet.size}</span>
                </div>
              </div>

              {/* Permissions (read-only) */}
              <div className="mt-4 space-y-6">
                {Object.keys(filteredGroups).length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    No permissions
                  </div>
                )}

                {Object.entries(filteredGroups).map(([resource, items]) => (
                  <div key={resource} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{resource}</div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {items.map((p) => {
                        const granted = grantedSet.has(p.id)
                        return (
                          <div
                            key={p.id}
                            className={`flex items-center justify-between rounded border p-2 ${
                              granted ? 'bg-green-50 dark:bg-green-950/20' : ''
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-mono text-xs truncate">
                                {p.slug}
                              </div>
                              {/* <div className="text-xs text-muted-foreground">
                                {p.action} · effect: {p.effect}
                              </div> */}
                            </div>
                            <Badge
                              variant={granted ? 'default' : 'outline'}
                              className="ml-2 shrink-0"
                            >
                              {granted ? 'GRANTED' : 'NOT GRANTED'}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
