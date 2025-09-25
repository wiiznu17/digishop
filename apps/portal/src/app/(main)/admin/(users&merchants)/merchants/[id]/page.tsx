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
import { Badge } from "@/components/ui/badge"
import type { AdminStoreDetail } from "@/types/admin/stores"
import { fetchAdminStoreDetail } from "@/utils/requesters/userMerchantRequester"

export default function AdminStoreDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<AdminStoreDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetchAdminStoreDetail(Number(id))
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
            <CardTitle className="text-xl">
              {data?.storeName ?? "Store"}
            </CardTitle>
            <CardDescription>Store detail</CardDescription>
            {!!data && (
              <div className="mt-2 text-sm space-y-1">
                <div>
                  <span className="text-muted-foreground">Email: </span>
                  {data.email}
                </div>
                <div>
                  <span className="text-muted-foreground">Owner: </span>
                  {data.ownerName} ({data.ownerEmail})
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="outline">{data.status}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Products:</span>{" "}
                  {data.productCount}
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
              onClick={() => router.push("/admin/merchants")}
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
    </div>
  )
}
