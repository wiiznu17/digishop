"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"

const statusTextMap: Record<string, { title: string; desc: string }> = {
  PENDING: {
    title: "ร้านค้าของคุณกำลังรอการอนุมัติ",
    desc: "ทีมงานกำลังตรวจสอบข้อมูลร้านค้าของคุณ โปรดรอการยืนยัน หากเกินกำหนดโปรดติดต่อฝ่ายสนับสนุน"
  },
  REJECTED: {
    title: "ร้านค้าของคุณถูกปฏิเสธการอนุมัติ",
    desc: "ขออภัย ขณะนี้ร้านค้าไม่ผ่านการอนุมัติ โปรดตรวจสอบข้อมูลและยื่นคำขอใหม่ หรือติดต่อฝ่ายสนับสนุน"
  },
  SUSPENDED: {
    title: "ร้านค้าของคุณถูกระงับชั่วคราว",
    desc: "บัญชีร้านค้าถูกระงับการใช้งาน โปรดติดต่อฝ่ายสนับสนุนเพื่อขอรายละเอียดเพิ่มเติม"
  }
}

export default function StoreStatusPage() {
  const sp = useSearchParams()
  const router = useRouter()
  const { storeStatus, isLoading } = useAuth()

  const queryStatus = (sp.get("status") || "").toUpperCase()

  // ถ้ากลับมา approved แล้ว ให้พากลับหน้าแรกของ merchant
  useEffect(() => {
    if (!isLoading && storeStatus === "APPROVED") {
      router.replace("/")
    }
  }, [isLoading, storeStatus, router])

  const info =
    statusTextMap[queryStatus] ??
    statusTextMap[storeStatus ?? "PENDING"] ?? // fallback PENDING
    statusTextMap["PENDING"]

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-xl w-full border rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-2">{info.title}</h1>
        <p className="text-muted-foreground mb-6">{info.desc}</p>

        <div className="flex gap-3">
          <button
            onClick={() => router.refresh()}
            className="px-4 py-2 rounded-lg border"
          >
            ลองตรวจสอบอีกครั้ง
          </button>
          <a
            href="mailto:support@example.com"
            className="px-4 py-2 rounded-lg border"
          >
            ติดต่อฝ่ายสนับสนุน
          </a>
          <button
            onClick={() => router.replace("/")}
            className="px-4 py-2 rounded-lg border"
          >
            กลับหน้าแรก
          </button>
        </div>
      </div>
    </div>
  )
}
