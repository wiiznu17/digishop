"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fetchAuditLogDetail } from "@/utils/requesters/auditLogRequester"
import type { AdminAuditLogItem } from "@/types/admin/audit"

export default function AuditLogDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<AdminAuditLogItem | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      try {
        const r = await fetchAuditLogDetail(Number(id))
        if (alive) setData(r)
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
        <CardHeader className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Audit log #{id}</CardTitle>
            <CardDescription>รายละเอียดเหตุการณ์</CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/system/audit-logs")}
          >
            Back
          </Button>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-sm text-muted-foreground">Loading...</div>
          )}
          {!loading && !data && (
            <div className="text-sm text-destructive">Not found</div>
          )}
          {data && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Actor: </span>
                {data.actorName || "-"} &lt;{data.actorEmail || "-"}&gt;
              </div>
              <div>
                <span className="text-muted-foreground">Date: </span>
                {new Date(data.createdAt).toLocaleString()}
              </div>
              <div>
                <span className="text-muted-foreground">Action: </span>
                {data.action}
              </div>
              <div>
                <span className="text-muted-foreground">Resource: </span>
                {data.resource}
                {data.targetId ? `#${data.targetId}` : ""}
              </div>
              <div>
                <span className="text-muted-foreground">IP: </span>
                {data.ip || "-"}
              </div>
              <div>
                <span className="text-muted-foreground">Correlation: </span>
                {data.correlationId || "-"}
              </div>
              <div className="md:col-span-2">
                <span className="text-muted-foreground">User agent: </span>
                {data.userAgent || "-"}
              </div>
              <div className="md:col-span-2">
                <span className="text-muted-foreground block">Meta JSON:</span>
                <pre className="mt-1 p-3 rounded border bg-muted/30 whitespace-pre-wrap break-words">
                  {JSON.stringify(data.meta ?? {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
