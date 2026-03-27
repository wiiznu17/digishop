// apps/portal/src/app/(main)/admin/(system)/admins/new/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useRouter } from 'next/navigation'
import {
  createAdminUser,
  sendAdminInviteById,
  fetchRoleOptions
} from '@/utils/requesters/adminRequester'
import type { RolesDetail } from '@/types/system/admin'
import { DashboardHeader } from '@/components/dashboard-header'

export default function NewAdminPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [roleSlug, setRoleSlug] = useState<string>('')
  const [sendInvite, setSendInvite] = useState(true)

  const [loading, setLoading] = useState(false)
  const [roleLoading, setRoleLoading] = useState(false)
  const [roleOptions, setRoleOptions] = useState<RolesDetail[]>([])
  const router = useRouter()

  useEffect(() => {
    let alive = true
    ;(async () => {
      setRoleLoading(true)
      try {
        const opts = await fetchRoleOptions()
        if (!alive) return

        // ตัด SUPER_ADMIN ออก
        const filtered = (opts ?? []).filter((o) => o.slug !== 'SUPER_ADMIN')
        const sorted = filtered.sort((a, b) =>
          (a.name ?? a.slug).localeCompare(b.name ?? b.slug)
        )
        setRoleOptions(sorted)

        if ((!roleSlug || roleSlug === 'SUPER_ADMIN') && sorted.length > 0) {
          setRoleSlug(sorted[0].slug)
        }
      } finally {
        setRoleLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [roleSlug])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!roleSlug) {
      alert('Please select a role.')
      return
    }
    if (roleSlug === 'SUPER_ADMIN') {
      alert('SUPER_ADMIN can only be assigned to a single user.')
      return
    }
    setLoading(true)
    try {
      const { id } = await createAdminUser({
        email: email.trim(),
        name: name.trim(),
        roleSlug
      })
      if (sendInvite) await sendAdminInviteById(id)
      router.push('/admin/admins')
    } catch (err) {
      console.error(err)
      alert('Failed to create admin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header ชิดขอบบนซ้าย */}
      <DashboardHeader
        title="Add New Admin"
        description="Create a new admin user for the system."
      />

      {/* เนื้อหา: การ์ดอยู่กึ่งกลาง */}
      <div className="flex-1 grid place-items-center p-4">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>Add admin</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm mb-1">Email</label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                  placeholder="admin@example.com"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Admin name"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Role</label>
                <Select
                  value={roleSlug}
                  onValueChange={setRoleSlug}
                  disabled={roleLoading || roleOptions.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        roleLoading ? 'Loading roles...' : 'Select a role'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((opt) => (
                      <SelectItem key={opt.id} value={opt.slug}>
                        <div className="flex items-center gap-2">
                          <span>{opt.name ?? opt.slug}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!roleLoading && roleOptions.length === 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    No roles available (SUPER_ADMIN is excluded). Please create
                    another role first.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="send-invite"
                  checked={sendInvite}
                  onCheckedChange={(v) => setSendInvite(Boolean(v))}
                />
                <label htmlFor="send-invite" className="text-sm">
                  Send invite email now
                </label>
              </div>

              <div className="pt-2 flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/admins')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || roleLoading || !roleSlug}
                >
                  {loading ? 'Saving...' : 'Create admin'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
