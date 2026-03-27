// apps/portal/src/app/(main)/admin/(system)/admins/[id]/page.tsx
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import type {
  AdminDetail,
  AdminRoleSlug,
  RolesDetail
} from '@/types/system/admin'
import {
  fetchAdminDetail,
  sendAdminInviteById,
  resetAdminPasswordById,
  fetchRoleOptions,
  updateAdminRoles
} from '@/utils/requesters/adminRequester'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronDown } from 'lucide-react'

export default function AdminDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<AdminDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [now, setNow] = useState<number>(Date.now())
  const [sendingInvite, setSendingInvite] = useState(false)
  const [resettingPass, setResettingPass] = useState(false)

  // role editor state
  // role editor state
  const [roleOptions, setRoleOptions] = useState<RolesDetail[]>([])
  const [roleDraft, setRoleDraft] = useState<AdminRoleSlug[]>([])

  const [rolePopoverOpen, setRolePopoverOpen] = useState(false)
  const [savingRoles, setSavingRoles] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetchAdminDetail(Number(id))
        if (!alive) return
        setData(res)
        setRoleDraft(res.roles.map((r) => r.slug)) // AdminRoleSlug[]

        const opts = await fetchRoleOptions() // ← ควรคืนเป็น RolesDetail[]
        if (!alive) return
        setRoleOptions(opts)
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [id])

  useEffect(() => {
    if (!data?.reinviteAvailableAt) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [data?.reinviteAvailableAt])

  const countdown = useMemo(() => {
    if (!data?.reinviteAvailableAt) return null
    const availableTs = new Date(data.reinviteAvailableAt).getTime()
    const ms = availableTs - now
    if (ms <= 0) return null
    const sec = Math.ceil(ms / 1000)
    const mm = Math.floor(sec / 60)
    const ss = sec % 60
    return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
  }, [data?.reinviteAvailableAt, now])

  function formatDT(iso?: string | null) {
    if (!iso) return '-'
    try {
      return new Date(iso).toLocaleString()
    } catch {
      return iso
    }
  }

  async function handleReinvite() {
    if (!data) return
    setSendingInvite(true)
    try {
      await sendAdminInviteById(data.id)
      alert('Invite email has been sent.')
      const res = await fetchAdminDetail(Number(id))
      setData(res)
    } catch (e) {
      console.error(e)
      alert('Failed to send invite.')
    } finally {
      setSendingInvite(false)
    }
  }

  async function handleResetPassword() {
    if (!data) return
    setResettingPass(true)
    try {
      await resetAdminPasswordById(data.id)
      alert('Password reset email has been sent.')
    } catch (e) {
      console.error(e)
      alert('Failed to send reset email.')
    } finally {
      setResettingPass(false)
    }
  }

  // === Save roles ===
  const hasRoleChanged = useMemo(() => {
    if (!data) return false
    const original = new Set(data.roles.map((r) => r.slug))
    const draft = new Set(roleDraft)
    if (original.size !== draft.size) return true
    for (const s of draft) if (!original.has(s)) return true
    return false
  }, [data, roleDraft])

  async function handleSaveRoles() {
    if (!data) return
    if (roleDraft.length === 0) {
      alert('Select at least one role.')
      return
    }
    setSavingRoles(true)
    try {
      await updateAdminRoles(data.id, roleDraft)
      const res = await fetchAdminDetail(Number(id))
      setData(res)
      setRoleDraft(res.roles.map((r) => r.slug))
      setRolePopoverOpen(false)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error(e)
      alert(e?.response?.data?.error ?? 'Failed to update roles.')
    } finally {
      setSavingRoles(false)
    }
  }

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <CardTitle className="text-xl">{data?.name ?? 'Admin'}</CardTitle>
            <CardDescription>
              Admin detail (roles, sessions, permissions)
            </CardDescription>
            {!!data && (
              <div className="mt-2 text-sm space-y-1">
                <div>
                  <span className="text-muted-foreground">Email: </span>
                  {data.email}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="outline">{data.status}</Badge>
                </div>

                {/* Roles (ดู/แก้) */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-muted-foreground">Roles:</span>
                  {roleDraft.map((s) => (
                    <Badge key={s} variant="outline" className="font-mono">
                      {s}
                    </Badge>
                  ))}
                  <Popover
                    open={rolePopoverOpen}
                    onOpenChange={setRolePopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1">
                        Edit roles <ChevronDown className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Select roles</div>
                        <div className="max-h-60 overflow-auto pr-1">
                          {roleOptions.map((opt) => {
                            const checked = roleDraft.includes(opt.slug)
                            return (
                              <label
                                key={opt.id}
                                className="flex items-center gap-2 py-1 cursor-pointer"
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(v) => {
                                    const on = Boolean(v)
                                    setRoleDraft((prev) =>
                                      on
                                        ? [...new Set([...prev, opt.slug])]
                                        : prev.filter((s) => s !== opt.slug)
                                    )
                                  }}
                                />
                                <span className="text-sm">{opt.name}</span>
                                <span className="ml-auto text-xs text-muted-foreground">
                                  {opt.slug}
                                </span>
                              </label>
                            )
                          })}

                          {roleOptions.length === 0 && (
                            <div className="text-xs text-muted-foreground py-2">
                              No roles
                            </div>
                          )}
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRoleDraft(data?.roles.map((r) => r.slug) ?? [])
                              setRolePopoverOpen(false)
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveRoles}
                            disabled={savingRoles || !hasRoleChanged}
                          >
                            {savingRoles ? 'Saving...' : 'Save'}
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <span className="text-muted-foreground">Last login:</span>{' '}
                  {data.lastLoginAt
                    ? new Date(data.lastLoginAt).toLocaleString()
                    : '-'}
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>{' '}
                  {data ? new Date(data.createdAt).toLocaleString() : '-'}
                </div>
                {data.lastInviteAt && (
                  <div>
                    <span className="text-muted-foreground">Last invite:</span>{' '}
                    <span title={data.lastInviteAt}>
                      {formatDT(data.lastInviteAt)}
                    </span>
                  </div>
                )}
                {data.reinviteAvailableAt && countdown && (
                  <div>
                    <span className="text-muted-foreground">Re-invite in:</span>{' '}
                    <span
                      title={formatDT(data.reinviteAvailableAt)}
                      className="font-mono"
                    >
                      {countdown}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {Boolean(data?.canReinvite) && (
              <Button
                variant="default"
                onClick={handleReinvite}
                disabled={sendingInvite || !data}
              >
                {sendingInvite ? 'Sending...' : 'Re-invite'}
              </Button>
            )}
            {!Boolean(data?.canReinvite) &&
              data?.reinviteAvailableAt &&
              countdown && (
                <Button
                  variant="default"
                  disabled
                  title={`Available at ${formatDT(data.reinviteAvailableAt)}`}
                >
                  Re-invite ({countdown})
                </Button>
              )}
            {Boolean(data?.canResetPassword) && (
              <Button
                variant="secondary"
                onClick={handleResetPassword}
                disabled={resettingPass || !data}
              >
                {resettingPass ? 'Sending...' : 'Reset password'}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => router.push('/admin/system/admins')}
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
        </CardContent>
      </Card>

      {!!data && (
        <>
          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>สิทธิ์ทั้งหมดที่ได้จาก roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Slug</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Effect</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.permissions.map((p) => (
                      <TableRow key={p.slug}>
                        <TableCell className="font-mono text-xs">
                          {p.slug}
                        </TableCell>
                        <TableCell>{p.resource}</TableCell>
                        <TableCell>{p.action}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              p.effect === 'ALLOW'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            }
                          >
                            {p.effect}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {data.permissions.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-sm text-muted-foreground py-8"
                        >
                          No permissions
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Sessions */}
          <Card>
            <CardHeader>
              <CardTitle>Sessions</CardTitle>
              <CardDescription>การเข้าสู่ระบบล่าสุด</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Created</TableHead>
                      <TableHead>JTI</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>User-agent</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Revoked</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.sessions.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          {new Date(s.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {s.jti}
                        </TableCell>
                        <TableCell>{s.ip ?? '-'}</TableCell>
                        <TableCell
                          className="max-w-[320px] truncate"
                          title={s.userAgent ?? ''}
                        >
                          {s.userAgent ?? '-'}
                        </TableCell>
                        <TableCell>
                          {new Date(s.expiresAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {s.revokedAt
                            ? new Date(s.revokedAt).toLocaleString()
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                    {data.sessions.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-sm text-muted-foreground py-8"
                        >
                          No sessions
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          {/* Role History */}
          <Card>
            <CardHeader>
              <CardTitle>Role History</CardTitle>
              <CardDescription>
                ประวัติการได้รับบทบาท / ช่วงเวลา (ล่าสุดมาก่อน)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.roleHistory.length > 0 ? (
                      data.roleHistory.map((h) => (
                        <TableRow key={h.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {h.roleName ?? '-'}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono">
                                {h.roleSlug ?? '-'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                h.status === 'ACTIVE'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                              }
                            >
                              {h.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDT(h.startAt)}</TableCell>
                          <TableCell>{formatDT(h.endAt)}</TableCell>
                          <TableCell className="text-xs">
                            {formatDT(h.createdAt)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {formatDT(h.updatedAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-sm text-muted-foreground py-8"
                        >
                          No role history
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
