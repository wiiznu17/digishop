// apps/portal/src/components/commerce/orders/OrdersSearchBox.tsx
"use client"

import React, { useEffect, useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { Search } from "lucide-react"
import { AdminOrderListItem } from "@/types/commerce/orders"
import { fetchAdminOrderSuggestRequester } from "@/utils/requesters/orderRequester"

const THB = (n?: number | null) =>
  n == null
    ? "-"
    : (n / 100).toLocaleString("th-TH", { style: "currency", currency: "THB" })

function useDebounce<T>(val: T, ms = 400) {
  const [v, setV] = useState(val)
  useEffect(() => {
    const t = setTimeout(() => setV(val), ms)
    return () => clearTimeout(t)
  }, [val, ms])
  return v
}

export function OrdersSearchBox({
  value,
  onChange // ,
  // onSubmit,
  // autoSubmitOnPick = true
}: {
  value: string
  onChange: (v: string) => void
  // onSubmit: () => void
  /** เลือกจาก suggest แล้ว submit เลย (ค่าเริ่มต้น: true) */
  // autoSubmitOnPick?: boolean
}) {
  const [openSuggest, setOpenSuggest] = useState(false)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [suggestItems, setSuggestItems] = useState<AdminOrderListItem[]>([])
  const [isPendingUI, startTransition] = useTransition()

  // รอหยุดพิมพ์ 2 วิ ค่อยยิง suggest
  const debounced = useDebounce(value, 2000)

  useEffect(() => {
    const term = debounced.trim()
    let cancelled = false
    if (!term) {
      setSuggestItems([])
      setOpenSuggest(false)
      return
    }
    setSuggestLoading(true)
    fetchAdminOrderSuggestRequester(term)
      .then((list) => {
        if (cancelled) return
        const rows: AdminOrderListItem[] = list.map((s) => ({
          id: s.id,
          orderCode: s.orderCode,
          customerName: s.customerName,
          customerEmail: s.customerEmail,
          storeName: "",
          status: s.status,
          currencyCode: "THB",
          grandTotalMinor: s.grandTotalMinor,
          createdAt: s.createdAt
        }))
        startTransition(() => {
          setSuggestItems(rows)
          setOpenSuggest(true)
        })
      })
      .finally(() => !cancelled && setSuggestLoading(false))
    return () => {
      cancelled = true
    }
  }, [debounced])

  return (
    <Popover open={openSuggest} onOpenChange={setOpenSuggest}>
      <PopoverAnchor asChild>
        <div className="flex gap-2">
          <Input
            placeholder="Order code / Order ID / Customer / Email"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => {
              if (value.trim()) setOpenSuggest(true)
            }}
            onBlur={() => setTimeout(() => setOpenSuggest(false), 120)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                // onSubmit()
              }
            }}
          />
          {/* <Button className="shrink-0" onClick={onSubmit}>
            <Search className="h-4 w-4 mr-2" /> Search
          </Button> */}
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="w-[560px] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-80 overflow-auto">
          {(suggestLoading || isPendingUI) && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Searching...
            </div>
          )}
          {!suggestLoading && !isPendingUI && suggestItems.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No suggestions
            </div>
          ) : (
            suggestItems.map((s) => (
              <button
                key={s.id}
                className="w-full text-left px-3 py-2 hover:bg-accent"
                onClick={() => {
                  onChange(s.orderCode)
                  setOpenSuggest(false)
                  // if (autoSubmitOnPick) onSubmit()
                }}
              >
                <div className="text-sm font-medium">
                  {s.orderCode} — {s.customerName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {s.customerEmail} · {s.status} · {THB(s.grandTotalMinor)} ·{" "}
                  {new Date(s.createdAt).toLocaleString()}
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
