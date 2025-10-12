// apps/portal/src/app/(main)/admin/(system)/admins/new/page.tsx
"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import {
  createAdminUser,
  sendAdminInviteById
} from "@/utils/requesters/adminRequester"

export default function NewAdminPage() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [roleSlug, setRoleSlug] = useState("ADMIN")
  const [sendInvite, setSendInvite] = useState(true)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { id } = await createAdminUser({
        email: email.trim(),
        name: name.trim(),
        roleSlug
      })
      if (sendInvite) {
        await sendAdminInviteById(id)
      }
      router.push("/admin/admins") // กลับไปลิสต์
    } catch (err) {
      console.error(err)
      alert("Failed to create admin")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4">
      <Card className="max-w-xl">
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
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Role</label>
              <Select value={roleSlug} onValueChange={setRoleSlug}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLATFORM_ADMIN">PLATFORM_ADMIN</SelectItem>
                  <SelectItem value="RBAC_ADMIN">RBAC_ADMIN</SelectItem>
                  <SelectItem value="OPERATIONS_MANAGER">
                    OPERATIONS_MANAGER
                  </SelectItem>
                  <SelectItem value="ANALYST">ANALYST</SelectItem>
                </SelectContent>
              </Select>
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

            <div className="pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Create admin"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
