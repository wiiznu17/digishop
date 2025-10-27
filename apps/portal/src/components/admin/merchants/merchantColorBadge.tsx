import { Badge } from "@/components/ui/badge"

const STORE_STATUS_CLASS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-300",
  APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-300",

  // เผื่อมีสถานะอื่นปะปนเข้ามา
  ACTIVE: "bg-blue-100 text-blue-800 border-blue-300",
  SUSPENDED: "bg-rose-100 text-rose-800 border-rose-300",
  INACTIVE: "bg-slate-100 text-slate-800 border-slate-300"
}

export function StatusBadge({ status }: { status: string }) {
  const cls =
    STORE_STATUS_CLASS[status] ??
    "bg-muted text-foreground border-muted-foreground/20"
  return (
    <Badge variant="outline" className={`border font-medium ${cls}`}>
      {status}
    </Badge>
  )
}
