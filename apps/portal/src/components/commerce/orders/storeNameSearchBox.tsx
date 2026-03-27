'use client'

import React, { useEffect, useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { fetchAdminStoreNameSuggestRequester } from '@/utils/requesters/orderRequester'
import type { AdminStoreNameSuggestItem } from '@/types/commerce/orders'

function useDebounce<T>(val: T, ms = 250) {
  const [v, setV] = useState(val)
  useEffect(() => {
    const t = setTimeout(() => setV(val), ms)
    return () => clearTimeout(t)
  }, [val, ms])
  return v
}

export function StoreNameSearchBox({
  value,
  onChange,
  placeholder = 'Store name eg. My Store'
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<AdminStoreNameSuggestItem[]>([])
  const [isPending, startTransition] = useTransition()

  const debounced = useDebounce(value, 250)

  useEffect(() => {
    const term = debounced.trim()
    let cancelled = false
    if (!term) {
      setItems([])
      setOpen(false)
      return
    }
    setLoading(true)
    fetchAdminStoreNameSuggestRequester(term)
      .then((rows) => {
        if (cancelled) return
        startTransition(() => {
          setItems(rows)
          setOpen(true)
        })
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [debounced])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="flex gap-2">
          <Input
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => {
              if (value.trim()) setOpen(true)
            }}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="w-[560px] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-80 overflow-auto">
          {(loading || isPending) && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Searching...
            </div>
          )}
          {!loading && !isPending && items.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No suggestions
            </div>
          ) : (
            items.map((s) => (
              <button
                key={s.currentStoreName}
                className="w-full text-left px-3 py-2 hover:bg-accent"
                onClick={() => {
                  onChange(String(s.currentStoreName))
                  setOpen(false)
                }}
              >
                <div className="text-sm font-medium">{s.currentStoreName}</div>
                <div className="text-xs text-muted-foreground">
                  {s.storeNameSnapshot ?? '-'} · {s.orderCount ?? 0} orders
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
