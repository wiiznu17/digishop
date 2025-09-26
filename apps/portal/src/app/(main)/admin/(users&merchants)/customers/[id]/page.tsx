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
import type { AdminUserDetail } from "@/types/admin/users"
import { fetchAdminUserDetail } from "@/utils/requesters/userMerchantRequester"

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<AdminUserDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetchAdminUserDetail(Number(id))
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
            <CardTitle className="text-xl">{data?.name ?? "User"}</CardTitle>
            <CardDescription>User detail</CardDescription>
            {!!data && (
              <div className="mt-2 text-sm space-y-1">
                <div>
                  <span className="text-muted-foreground">Email: </span>
                  {data.email}
                </div>
                <div>
                  <span className="text-muted-foreground">Created: </span>
                  {new Date(data.createdAt).toLocaleString()}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/customers")}
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

      {!!data?.store && (
        <Card>
          <CardHeader>
            <CardTitle>Store</CardTitle>
            <CardDescription>This user owns a store</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium">{data.store.storeName}</div>
              <div className="text-muted-foreground">
                Status: {data.store.status}
              </div>
            </div>
            <Button
              onClick={() => router.push(`/admin/merchants/${data.store!.id}`)}
            >
              Open store detail
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
