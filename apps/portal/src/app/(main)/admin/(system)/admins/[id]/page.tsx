"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import type { AdminDetail } from "@/types/system/admin"
import { fetchAdminDetail } from "@/utils/requesters/adminRequester"

export default function AdminDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<AdminDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetchAdminDetail(Number(id))
        if (alive) setData(res)
      } finally {
        setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [id])

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <CardTitle className="text-xl">{data?.name ?? "Admin"}</CardTitle>
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
                <div>
                  <span className="text-muted-foreground">Roles:</span>{" "}
                  {data.roles.map((r) => r.slug).join(", ")}
                </div>
                <div>
                  <span className="text-muted-foreground">Last login:</span>{" "}
                  {data.lastLoginAt
                    ? new Date(data.lastLoginAt).toLocaleString()
                    : "-"}
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>{" "}
                  {new Date(data.createdAt).toLocaleString()}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/system/admins")}
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
                              p.effect === "ALLOW"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
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
                        <TableCell>{s.ip ?? "-"}</TableCell>
                        <TableCell
                          className="max-w-[320px] truncate"
                          title={s.userAgent ?? ""}
                        >
                          {s.userAgent ?? "-"}
                        </TableCell>
                        <TableCell>
                          {new Date(s.expiresAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {s.revokedAt
                            ? new Date(s.revokedAt).toLocaleString()
                            : "-"}
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
        </>
      )}
    </div>
  )
}
