"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { Search, RotateCcw } from "lucide-react"
// import type { AdminCategoryStatus } from "@/utils/requesters/categoryRequester"

type Props = {
  defaultValue: { q: string }
  onApply: (v: { q: string }) => void
  suggest: (q: string) => Promise<{ id: string; label: string }[]>
}

export function CategorySearchBar({ defaultValue, onApply, suggest }: Props) {
  const [q, setQ] = useState(defaultValue.q)
  // const [status, setStatus] = useState<AdminCategoryStatus | "ALL">(
  //   defaultValue.status
  // )
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<{ id: string; label: string }[]>([])
  const timer = useRef<number | null>(null)

  useEffect(() => setQ(defaultValue.q), [defaultValue.q])
  // useEffect(() => setStatus(defaultValue.status), [defaultValue.status])

  useEffect(() => {
    const term = q.trim()
    if (!term) {
      setOpen(false)
      setItems([])
      return
    }
    if (timer.current) window.clearTimeout(timer.current)
    setLoading(true)
    timer.current = window.setTimeout(async () => {
      const s = await suggest(term)
      setItems(s)
      setLoading(false)
      setOpen(true)
    }, 250)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [q, suggest])

  const apply = () => onApply({ q })
  const reset = () => {
    setQ("")
    // setStatus("ALL")
    onApply({ q: "" })
  }

  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:flex-1">
        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Search</label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverAnchor asChild>
              <Input
                placeholder="Search by category name"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onFocus={() => q.trim() && setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 120)}
                onKeyDown={(e) => e.key === "Enter" && apply()}
                autoComplete="off"
              />
            </PopoverAnchor>
            <PopoverContent
              className="w-[420px] p-0"
              align="start"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <div className="max-h-72 overflow-auto">
                {loading && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Searching...
                  </div>
                )}
                {!loading && items.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No suggestions
                  </div>
                )}
                {!loading &&
                  items.map((s) => (
                    <button
                      key={s.id}
                      className="w-full text-left px-3 py-2 hover:bg-accent"
                      onClick={() => {
                        setQ(s.label)
                        setOpen(false)
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* <div>
          <label className="block text-sm mb-1">Status</label>
          <Select
            value={status}
            onValueChange={(v: AdminCategoryStatus | "ALL") => setStatus(v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="ACTIVE">ACTIVE</SelectItem>
              <SelectItem value="HIDDEN">HIDDEN</SelectItem>
            </SelectContent>
          </Select>
        </div> */}
      </div>

      <div className="flex gap-2">
        <Button onClick={apply} className="gap-2">
          <Search className="h-4 w-4" />
          Search
        </Button>
        <Button variant="outline" onClick={reset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Clear
        </Button>
      </div>
    </div>
  )
}
