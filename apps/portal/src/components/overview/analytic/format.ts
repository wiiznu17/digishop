// apps/portal/src/app/(main)/admin/analytics/_components/format.ts
export const toNum = (x: unknown): number => {
  const n = Number(x ?? 0)
  return Number.isFinite(n) ? n : 0
}

export const fmtTHB = (minor: number | string): string =>
  (toNum(minor) / 100).toLocaleString("th-TH", {
    style: "currency",
    currency: "THB"
  })

export const fmtCompact = (n: unknown): string =>
  new Intl.NumberFormat("en", { notation: "compact" }).format(toNum(n))

export const fmtDateShort = (iso: string): string => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("th-TH", { month: "short", day: "numeric" })
}
