"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/utils/tailwindUtils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"

type Ctx = {
  open: boolean
  setOpen: (v: boolean) => void
  value: string[]
  setValue: (v: string[]) => void
}
const MultiSelectCtx = React.createContext<Ctx | null>(null)

function useMS() {
  const ctx = React.useContext(MultiSelectCtx)
  if (!ctx) throw new Error("MultiSelect.* must be used inside <MultiSelect>")
  return ctx
}

export function MultiSelect({
  value,
  onValueChange,
  children,
  className
}: {
  value: string[]
  onValueChange: (v: string[]) => void
  children: React.ReactNode
  className?: string
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <MultiSelectCtx.Provider
      value={{ open, setOpen, value, setValue: onValueChange }}
    >
      <div className={cn("w-full", className)}>
        <Popover open={open} onOpenChange={setOpen}>
          {children}
        </Popover>
      </div>
    </MultiSelectCtx.Provider>
  )
}

export function MultiSelectTrigger({
  children,
  className
}: React.PropsWithChildren<{ className?: string }>) {
  const { setOpen, open } = useMS()
  return (
    <PopoverTrigger asChild>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className={cn("w-full justify-between items-center", className)}
        onClick={() => setOpen(!open)}
      >
        {/* โซนค่า: ชิดซ้าย + เลื่อนแนวนอน + เห็นสกอร์บาร์ */}
        <div className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap pr-2 text-left">
          <div className="inline-flex items-center gap-1">
            {children}
          </div>
        </div>

        <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 shrink-0" />
      </Button>
    </PopoverTrigger>
  )
}

export function MultiSelectValue({ placeholder }: { placeholder?: string }) {
  const { value, setValue } = useMS()

  if (!value?.length) {
    return (
      <span className="text-muted-foreground truncate">
        {placeholder ?? "Select…"}
      </span>
    )
  }

  const remove = (target: string) => {
    setValue(value.filter((v) => v !== target))
  }

  return (
    // ชิปชิดซ้าย
    <div className="flex items-center gap-1 justify-start">
      {value.map((v) => (
        <Badge key={v} variant="secondary" className="px-2 pr-1">
          <span className="mr-1">{v}</span>

          {/* ใช้ปุ่มจริง ๆ เพื่อให้โฟกัส/คีย์บอร์ดได้ + กันไม่ให้กดแล้วไปคลิกปุ่มหลัก */}
          <button
            type="button"
            aria-label={`Remove ${v}`}
            className="rounded-sm outline-none ring-0 focus:ring-2 focus:ring-ring/40"
            // กัน mousedown ไม่ให้ไปกด <Button> ที่เป็น PopoverTrigger
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation()
              remove(v)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                remove(v)
              }
            }}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  )
}

export function MultiSelectContent({
  children,
  searchPlaceholder = "Search…",
  emptyText = "No results"
}: React.PropsWithChildren<{
  searchPlaceholder?: string
  emptyText?: string
}>) {
  const { setOpen } = useMS()
  return (
    <PopoverContent
      className="w-[--radix-popover-trigger-width] p-0"
      align="start"
    >
      <Command shouldFilter defaultValue="">
        <CommandInput placeholder={searchPlaceholder} />
        <CommandList className="max-h-56 overflow-y-auto">
          {" "}
          {/* scroll ได้ + เห็นแถบ */}
          <CommandEmpty>{emptyText}</CommandEmpty>
          <CommandGroup
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false)
            }}
          >
            {children}
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  )
}

export function MultiSelectItem({
  value: itemValue,
  children
}: {
  value: string
  children: React.ReactNode
}) {
  const { value, setValue } = useMS()
  const selected = value.includes(itemValue)

  return (
    <CommandItem
      key={itemValue}
      className="cursor-pointer"
      onSelect={() => {
        setValue(
          selected
            ? value.filter((v) => v !== itemValue)
            : [...value, itemValue]
        )
      }}
    >
      <span className="mr-2 flex h-4 w-4 items-center justify-center rounded-sm border">
        {selected ? <Check className="h-3 w-3" /> : null}
      </span>
      <span>{children}</span>
    </CommandItem>
  )
}
