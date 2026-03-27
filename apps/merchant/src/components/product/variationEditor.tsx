'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { GripVertical, Trash2, Plus, Check, X } from 'lucide-react'

// SKU: สำหรับเชื่อมกับ items ภายนอก (optional)
type ItemLike = {
  key: string
  optionCids: string[]
  sku: string
  label: string
}

export type VariationDraftOption = {
  clientId: string
  uuid?: string // ไม่มีแปลว่าเป็นของใหม่
  value: string
  sortOrder: number
}

export type VariationDraft = {
  clientId: string
  uuid?: string // ไม่มีแปลว่าเป็นของใหม่
  name: string
  options: VariationDraftOption[]
}

type Props = {
  value: VariationDraft[]
  onChange: (next: VariationDraft[]) => void
  // NEW: เพิ่ม optional items + onItemsChange + skuPrefix สำหรับเติม SKU
  items?: ItemLike[]
  onItemsChange?: (next: ItemLike[]) => void
  skuPrefix?: string
}

const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)

// NEW: ฟังก์ชันผลิตโค้ดสั้น
const hashString = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return h
}
const toCode = (s: string, max = 4) => {
  const t = s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, max)
  if (t) return t
  return Math.abs(hashString(s)).toString(36).toUpperCase().slice(0, max) || 'X'
}

export function VariationEditor({
  value,
  onChange,
  items,
  onItemsChange,
  skuPrefix
}: Props) {
  // inline editing state (UI only)
  const [editingVarId, setEditingVarId] = useState<string | null>(null)
  const [editingVarName, setEditingVarName] = useState<string>('')

  const [editingOptKey, setEditingOptKey] = useState<{
    v: string
    o: string
  } | null>(null)
  const [editingOptValue, setEditingOptValue] = useState<string>('')

  const [dragging, setDragging] = useState<{ v: string; o: string } | null>(
    null
  )

  // State สำหรับ add variation (input ใน UI)
  const [newVarName, setNewVarName] = useState<string>('')

  // State สำหรับ add option per variation (input ใน UI)
  const [newOptValues, setNewOptValues] = useState<Record<string, string>>({})

  // State สำหรับ confirmation delete (inline, ไม่ใช้ dialog)
  const [pendingDeleteVar, setPendingDeleteVar] = useState<string | null>(null)
  const [pendingDeleteOpt, setPendingDeleteOpt] = useState<{
    v: string
    o: string
  } | null>(null)

  const setVars = (updater: (prev: VariationDraft[]) => VariationDraft[]) =>
    onChange(updater(value))

  // ----- Variation ops -----
  const addVariation = () => {
    const name = newVarName.trim()
    if (!name) return
    setVars((prev) => [...prev, { clientId: uid(), name, options: [] }])
    setNewVarName('') // Clear input หลัง add
  }

  const beginEditVar = (vId: string, current: string) => {
    setEditingVarId(vId)
    setEditingVarName(current)
  }
  const cancelEditVar = () => {
    setEditingVarId(null)
    setEditingVarName('')
  }
  const saveEditVar = () => {
    const vId = editingVarId
    const name = editingVarName.trim()
    if (!vId || !name) return
    setVars((prev) =>
      prev.map((v) => (v.clientId === vId ? { ...v, name } : v))
    )
    cancelEditVar()
  }

  const confirmDeleteVariation = (vId: string) => {
    setVars((prev) => prev.filter((v) => v.clientId !== vId))
    setPendingDeleteVar(null)
  }

  const cancelDeleteVariation = () => {
    setPendingDeleteVar(null)
  }

  // ----- Option ops -----
  const addOption = (vId: string) => {
    const val = (newOptValues[vId] ?? '').trim()
    if (!val) return
    setVars((prev) =>
      prev.map((v) =>
        v.clientId === vId
          ? {
              ...v,
              options: [
                ...v.options,
                {
                  clientId: uid(),
                  value: val,
                  sortOrder: v.options.length // ← กำหนด sortOrder ตอนไส้ใหม่
                }
              ]
            }
          : v
      )
    )
    setNewOptValues((prev) => ({ ...prev, [vId]: '' })) // Clear input หลัง add
  }

  const beginEditOpt = (vId: string, optKey: string, current: string) => {
    setEditingOptKey({ v: vId, o: optKey })
    setEditingOptValue(current)
  }
  const cancelEditOpt = () => {
    setEditingOptKey(null)
    setEditingOptValue('')
  }
  const saveEditOpt = () => {
    const k = editingOptKey
    const val = editingOptValue.trim()
    if (!k || !val) return
    setVars((prev) =>
      prev.map((v) =>
        v.clientId === k.v
          ? {
              ...v,
              options: v.options.map((o) =>
                o.clientId === k.o ? { ...o, value: val } : o
              )
            }
          : v
      )
    )
    cancelEditOpt()
  }

  const confirmDeleteOption = (vId: string, optKey: string) => {
    setVars((prev) =>
      prev.map((v) =>
        v.clientId === vId
          ? { ...v, options: v.options.filter((o) => o.clientId !== optKey) }
          : v
      )
    )
    setPendingDeleteOpt(null)
  }

  const cancelDeleteOption = () => {
    setPendingDeleteOpt(null)
  }

  // ----- Drag reorder (per-variation) -----
  const onDragStart = (vId: string, oKey: string) => (e: React.DragEvent) => {
    setDragging({ v: vId, o: oKey })
    e.dataTransfer.effectAllowed = 'move'
  }

  const onDragOverRow = (vId: string) => (e: React.DragEvent) => {
    if (dragging?.v === vId) e.preventDefault()
  }

  const onDropRow = (vId: string, dropKey: string) => (e: React.DragEvent) => {
    e.preventDefault()
    const drag = dragging
    setDragging(null)
    if (!drag || drag.v !== vId) return
    setVars((prev) => {
      const vIdx = prev.findIndex((v) => v.clientId === vId)
      if (vIdx === -1) return prev
      const v = prev[vIdx]
      const from = v.options.findIndex((o) => o.clientId === drag.o)
      const to = v.options.findIndex((o) => o.clientId === dropKey)
      if (from === -1 || to === -1 || from === to) return prev
      const nextOpts = v.options.slice()
      const [moved] = nextOpts.splice(from, 1)
      nextOpts.splice(to, 0, moved)
      // ← รีเขียน sortOrder ให้เรียง 0..n ใหม่
      const normalized = nextOpts.map((o, i) => ({ ...o, sortOrder: i }))
      const next = prev.slice()
      next[vIdx] = { ...v, options: normalized }
      return next
    })
  }

  const buildOptionLabelMap = () => {
    const m = new Map<string, string>()
    for (const v of value) {
      for (const o of v.options) {
        if (o.uuid) m.set(o.uuid, o.value)
        m.set(o.clientId, o.value)
      }
    }
    return m
  }

  // NEW: เติม SKU เฉพาะช่องว่าง สำหรับ items ที่ส่งมาผ่าน props
  const fillEmptySkus = () => {
    if (!items || !onItemsChange) return
    const optionLabelById = buildOptionLabelMap()
    const seen = new Set(
      items
        .map((r) => (r.sku || '').trim())
        .filter(Boolean)
        .map((s) => s.toUpperCase())
    )
    const prefix = toCode((skuPrefix ?? '').trim(), 6) || 'PRD'

    const next = items.map((r) => {
      if ((r.sku || '').trim()) return r
      const optCodes = r.optionCids.map((id) =>
        toCode(optionLabelById.get(id) ?? 'OPT', 3)
      )
      let base = [prefix, ...optCodes].join('-').replace(/-+/g, '-')
      base = base.slice(0, 28)
      let candidate = base
      let i = 1
      while (seen.has(candidate.toUpperCase())) {
        candidate = `${base}-${i++}`
      }
      seen.add(candidate.toUpperCase())
      return { ...r, sku: candidate }
    })

    onItemsChange(next)
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Variastions</div>

        {/* NEW: โชว์ปุ่มเฉพาะเมื่อมี items + onItemsChange */}
        {items && onItemsChange && (
          <Button
            size="sm"
            variant="secondary"
            onClick={fillEmptySkus}
            title="Fill SKU for new/empty only"
          >
            Fill empty SKUs
          </Button>
        )}
      </div>

      {/* Input สำหรับ add variation ใหม่ (อยู่ใน UI) */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="New variation name"
          value={newVarName}
          onChange={(e) => setNewVarName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addVariation()
          }}
        />
        <Button size="sm" onClick={addVariation} disabled={!newVarName.trim()}>
          <Plus className="h-4 w-4 mr-1" />
          Add Variation
        </Button>
      </div>

      {value.length === 0 && (
        <div className="text-sm text-muted-foreground">No variations</div>
      )}

      <div className="space-y-4">
        {value.map((v) => (
          <div key={v.clientId} className="border rounded-lg">
            <div className="flex items-center gap-2 p-3 border-b">
              {editingVarId === v.clientId ? (
                <>
                  <Input
                    className="max-w-xs"
                    value={editingVarName}
                    onChange={(e) => setEditingVarName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEditVar()
                      if (e.key === 'Escape') cancelEditVar()
                    }}
                  />
                  <Button size="sm" onClick={saveEditVar}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEditVar}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <div className="font-medium">{v.name}</div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => beginEditVar(v.clientId, v.name)}
                  >
                    Rename
                  </Button>
                  {pendingDeleteVar === v.clientId ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => confirmDeleteVariation(v.clientId)}
                      >
                        Sure?
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelDeleteVariation}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    // ปุ่มลบ Variation
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setPendingDeleteVar(v.clientId)}
                      disabled={value.length <= 1} // ← กันลบชุดสุดท้าย
                      title={
                        value.length <= 1
                          ? 'Must have at least 1 variation'
                          : undefined
                      }
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  )}
                </>
              )}
            </div>

            <div className="p-3 space-y-2">
              {[...v.options]
                .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)) // ← แสดงตาม sortOrder
                .map((o) => {
                  const editing =
                    editingOptKey?.v === v.clientId &&
                    editingOptKey?.o === o.clientId
                  const isPendingDelete =
                    pendingDeleteOpt?.v === v.clientId &&
                    pendingDeleteOpt?.o === o.clientId
                  return (
                    <div
                      key={o.clientId}
                      draggable
                      onDragStart={onDragStart(v.clientId, o.clientId)}
                      onDragOver={onDragOverRow(v.clientId)}
                      onDrop={onDropRow(v.clientId, o.clientId)}
                      className="flex items-center gap-2 p-2 border rounded-md bg-muted/30"
                    >
                      <GripVertical className="h-4 w-4 shrink-0" />
                      {editing ? (
                        <>
                          <Input
                            value={editingOptValue}
                            onChange={(e) => setEditingOptValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditOpt()
                              if (e.key === 'Escape') cancelEditOpt()
                            }}
                          />
                          <Button size="sm" onClick={saveEditOpt}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditOpt}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="flex-1">{o.value}</div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              beginEditOpt(v.clientId, o.clientId, o.value)
                            }
                          >
                            Rename
                          </Button>
                          {isPendingDelete ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  confirmDeleteOption(v.clientId, o.clientId)
                                }
                              >
                                Sure?
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelDeleteOption}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            // ปุ่มลบ Option
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                setPendingDeleteOpt({
                                  v: v.clientId,
                                  o: o.clientId
                                })
                              }
                              disabled={v.options.length <= 1} // ← กันลบ option สุดท้ายในชุด
                              title={
                                v.options.length <= 1
                                  ? 'Each variation must have at least 1 option'
                                  : undefined
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}

              {/* Input สำหรับ add option ใหม่ (อยู่ใน UI, per variation) */}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="New option value"
                  value={newOptValues[v.clientId] ?? ''}
                  onChange={(e) =>
                    setNewOptValues((prev) => ({
                      ...prev,
                      [v.clientId]: e.target.value
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addOption(v.clientId)
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addOption(v.clientId)}
                  disabled={!(newOptValues[v.clientId] ?? '').trim()}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Option
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
