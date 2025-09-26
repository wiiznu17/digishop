"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  fetchRoleDetail,
  updateRoleMeta,
  replaceRolePermissions,
  type AdminRoleDetail
} from "@/utils/requesters/rolesRequester"

type Grouped = Record<
  string,
  {
    id: number
    slug: string
    resource: string
    action: string
    effect: "ALLOW" | "DENY"
  }[]
>

function groupByResource(perms: AdminRoleDetail["allPermissions"]): Grouped {
  return perms.reduce((acc, p) => {
    acc[p.resource] = acc[p.resource] || []
    acc[p.resource].push(p)
    return acc
  }, {} as Grouped)
}

export default function RoleEditPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<AdminRoleDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [savingMeta, setSavingMeta] = useState(false)
  const [savingPerms, setSavingPerms] = useState(false)

  // meta draft
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  // permission state
  const [granted, setGranted] = useState<Set<number>>(new Set())
  const [filterText, setFilterText] = useState("")

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetchRoleDetail(Number(id))
        if (!alive) return
        setData(res)
        setName(res.name)
        setDescription(res.description ?? "")
        setGranted(new Set(res.permissions.map((p) => p.id)))
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

  const toggle = (pid: number, checked: boolean | string) => {
    setGranted((prev) => {
      const n = new Set(prev)
      if (checked) n.add(pid)
      else n.delete(pid)
      return n
    })
  }

  const selectAllResource = (resource: string) => {
    const ids = (groups[resource] || []).map((p) => p.id)
    setGranted((prev) => new Set([...prev, ...ids]))
  }
  const unselectAllResource = (resource: string) => {
    const ids = new Set((groups[resource] || []).map((p) => p.id))
    setGranted((prev) => new Set([...prev].filter((id) => !ids.has(id))))
  }

  const onSaveMeta = useCallback(async () => {
    if (!data) return
    setSavingMeta(true)
    try {
      await updateRoleMeta(data.id, {
        name: name.trim(),
        description: description.trim() || null
      })
    } finally {
      setSavingMeta(false)
    }
  }, [data, name, description])

  const onSavePerms = useCallback(async () => {
    if (!data) return
    setSavingPerms(true)
    try {
      await replaceRolePermissions(data.id, Array.from(granted))
      // refresh (optional)
      const res = await fetchRoleDetail(data.id)
      setData(res)
      setGranted(new Set(res.permissions.map((p) => p.id)))
    } finally {
      setSavingPerms(false)
    }
  }, [data, granted])

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <CardTitle className="text-xl">{data?.name ?? "Role"}</CardTitle>
            <CardDescription>Edit role & permissions</CardDescription>
            {!!data && (
              <div className="mt-2 text-sm space-y-1">
                <div>
                  <span className="text-muted-foreground">Slug: </span>
                  <span className="font-mono text-xs">{data.slug}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">System:</span>
                  <Badge variant="outline">
                    {data.isSystem ? "Yes" : "No"}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Updated:</span>{" "}
                  {new Date(data.updatedAt).toLocaleString()}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/system/roles")}
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
              {/* Meta */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={data.isSystem}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Description</label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={data.isSystem}
                  />
                </div>
              </div>
              <div className="mt-3">
                <Button
                  onClick={onSaveMeta}
                  disabled={data.isSystem || savingMeta}
                >
                  Save meta
                </Button>
              </div>

              <Separator className="my-6" />

              {/* Permissions */}
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
                  Granted: <span className="font-medium">{granted.size}</span>
                </div>
              </div>

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
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => selectAllResource(resource)}
                        >
                          Select all
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => unselectAllResource(resource)}
                        >
                          Unselect all
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {items.map((p) => (
                        <label
                          key={p.id}
                          className="flex items-center gap-2 rounded border p-2"
                        >
                          <Checkbox
                            checked={granted.has(p.id)}
                            onCheckedChange={(ck: boolean) => toggle(p.id, ck)}
                            disabled={data.isSystem}
                          />
                          <div className="flex-1">
                            <div className="font-mono text-xs">{p.slug}</div>
                            <div className="text-xs text-muted-foreground">
                              {p.action} · effect: {p.effect}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <Button
                  onClick={onSavePerms}
                  disabled={data.isSystem || savingPerms}
                >
                  Save permissions
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
