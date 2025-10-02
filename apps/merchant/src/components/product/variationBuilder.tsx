"use client"

import { useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import { ImageLike, ImageUpload } from "./imageUpload"
import { Switch } from "../ui/switch"

// ===== Types for Draft on client =====
export type OptionDraft = {
  cid: string
  value: string
  sortOrder: number
}

export type VariationDraft = {
  cid: string
  name: string
  options: OptionDraft[]
}

export type ItemDraft = {
  key: string
  optionCids: string[]
  label: string
  enabled: boolean
  sku: string
  price: string
  stock: string
  image?: ImageLike | null
}

type Props = {
  variations: VariationDraft[]
  onVariationsChange: (v: VariationDraft[]) => void
  items: ItemDraft[]
  onItemsChange: (rows: ItemDraft[]) => void
  skuPrefix?: string
}

// ===== Helpers =====
const cuid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

function cartesian<T>(arr: T[][]): T[][] {
  if (arr.length === 0) return []
  return arr.reduce<T[][]>(
    (acc, curr) =>
      acc
        .map((a) => curr.map((c) => [...a, c]))
        .reduce((x, y) => x.concat(y), []),
    [[]]
  )
}

function ItemImageCell({
  value,
  onChange
}: {
  value: ImageLike | null
  onChange: (v: ImageLike | null) => void
}) {
  const arr = value ? [value] : []
  return (
    <div
      className="
        w-20 h-20
      "
    >
      <ImageUpload
        variant="compact"
        mode="local"
        images={arr}
        onImagesChange={(imgs) => onChange(imgs[0] ?? null)}
        maxImages={1}
        cropAspect={1}
      />
    </div>
  )
}

function buildRows(variations: VariationDraft[]): ItemDraft[] {
  const optionMatrix = variations.map((v) => v.options)
  if (optionMatrix.length === 0 || optionMatrix.some((o) => o.length === 0)) {
    return []
  }
  const combos = cartesian(optionMatrix)
  return combos.map((opts) => {
    const optionCids = opts.map((o) => o.cid)
    const label = opts.map((o) => o.value).join(" / ")
    const key = optionCids.join("|")
    return {
      key,
      optionCids,
      label,
      enabled: true,
      sku: "",
      price: "",
      stock: ""
    }
  })
}

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
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, max)
  if (t) return t
  return Math.abs(hashString(s)).toString(36).toUpperCase().slice(0, max) || "X"
}

// ===== UI =====
export default function VariationBuilder({
  variations,
  onVariationsChange,
  items,
  onItemsChange,
  skuPrefix
}: Props) {
  // เมื่อ variations เปลี่ยน → regenerate rows โดย merge ค่าที่เคยกรอก
  useEffect(() => {
    const optionMatrix = variations.map((v) => v.options)
    if (optionMatrix.length === 0 || optionMatrix.some((o) => o.length === 0)) {
      onItemsChange([])
      return
    }
    const next = buildRows(variations)
    const prevMap = new Map(items.map((r) => [r.key, r]))
    const merged = next.map((r) => {
      const prev = prevMap.get(r.key)
      return prev
        ? {
            ...r,
            enabled: prev.enabled,
            sku: prev.sku,
            price: prev.price,
            stock: prev.stock,
            image: prev.image ?? null
          }
        : r
    })
    onItemsChange(merged)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(variations)])

  // map cid -> option value
  const optionLabelByCid = useMemo(() => {
    const m = new Map<string, string>()
    for (const v of variations) for (const o of v.options) m.set(o.cid, o.value)
    return m
  }, [JSON.stringify(variations)])

  const autoGenerateSkus = (overwriteExisting = false) => {
    const seen = new Set(
      items
        .map((r) => (r.sku || "").trim())
        .filter(Boolean)
        .map((s) => s.toUpperCase())
    )
    const prefix = toCode((skuPrefix ?? "").trim(), 6) || "PRD"

    const next = items.map((r) => {
      if (!overwriteExisting && (r.sku || "").trim()) return r
      const optCodes = r.optionCids.map((cid) =>
        toCode(optionLabelByCid.get(cid) ?? "OPT", 3)
      )
      let base = [prefix, ...optCodes].join("-").replace(/-+/g, "-")
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

  const addVariation = () => {
    const nv: VariationDraft = {
      cid: cuid(),
      name: `Variation ${variations.length + 1}`,
      options: [
        { cid: cuid(), value: "Option A", sortOrder: 0 },
        { cid: cuid(), value: "Option B", sortOrder: 1 }
      ]
    }
    onVariationsChange([...variations, nv])
  }

  const removeVariation = (cid: string) => {
    onVariationsChange(variations.filter((v) => v.cid !== cid))
  }

  const renameVariation = (cid: string, name: string) => {
    onVariationsChange(
      variations.map((v) => (v.cid === cid ? { ...v, name } : v))
    )
  }

  const addOption = (varCid: string) => {
    onVariationsChange(
      variations.map((v) =>
        v.cid === varCid
          ? {
              ...v,
              options: [
                ...v.options,
                {
                  cid: cuid(),
                  value: `Option ${v.options.length + 1}`,
                  sortOrder: v.options.length
                }
              ]
            }
          : v
      )
    )
  }

  const removeOption = (varCid: string, optCid: string) => {
    onVariationsChange(
      variations.map((v) =>
        v.cid === varCid
          ? {
              ...v,
              options: v.options
                .filter((o) => o.cid !== optCid)
                .map((o, i) => ({ ...o, sortOrder: i }))
            }
          : v
      )
    )
  }

  const renameOption = (varCid: string, optCid: string, value: string) => {
    onVariationsChange(
      variations.map((v) =>
        v.cid === varCid
          ? {
              ...v,
              options: v.options.map((o) =>
                o.cid === optCid ? { ...o, value } : o
              )
            }
          : v
      )
    )
  }

  const patchRow = (key: string, patch: Partial<ItemDraft>) => {
    onItemsChange(items.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  const hasVariations = variations.length > 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Variations</div>
        <Button type="button" size="sm" onClick={addVariation}>
          <Plus className="h-4 w-4 mr-1" />
          Add variation
        </Button>
      </div>

      {/* Variations editor */}
      <div className="grid gap-3 md:grid-cols-2">
        {variations.map((v) => (
          <Card key={v.cid} className="p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Input
                value={v.name}
                onChange={(e) => renameVariation(v.cid, e.target.value)}
                placeholder="Variation name (e.g. Color, Size)"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeVariation(v.cid)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {v.options.map((o) => (
                <div key={o.cid} className="flex items-center gap-2">
                  <Input
                    value={o.value}
                    onChange={(e) => renameOption(v.cid, o.cid, e.target.value)}
                    placeholder="Option value (e.g. Red, Large)"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeOption(v.cid, o.cid)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => addOption(v.cid)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add option
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Generated items */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Generated Items (SKUs)</div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => autoGenerateSkus(false)}
            >
              Auto-generate SKUs
            </Button>
          </div>
        </div>

        {!hasVariations && (
          <div className="text-sm text-muted-foreground">
            Add at least one variation with options to generate items.
          </div>
        )}

        {hasVariations && items.length === 0 && (
          <div className="text-sm text-muted-foreground">No combinations</div>
        )}

        {items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-[820px] w-full text-sm border rounded">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left p-2 w-[88px]">Enable</th>
                  <th className="text-left p-2 w-[124px]">Image</th>
                  <th className="text-left p-2">Combination</th>
                  <th className="text-left p-2">SKU</th>
                  <th className="text-left p-2">Price (THB)</th>
                  <th className="text-left p-2">Stock</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.key} className="border-t align-top">
                    <td className="p-2 align-top">
                      {/* <input
                        type="checkbox"
                        checked={r.enabled}
                        onChange={(e) =>
                          patchRow(r.key, { enabled: e.target.checked })
                        }
                      /> */}
                      <Switch
                        checked={!!r.enabled}
                        onCheckedChange={(checked) =>
                          patchRow(r.key, { enabled: checked })
                        }
                        aria-label={`Toggle enable for ${r.sku || r.label}`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {r.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </td>
                    <td className="p-2 align-top">
                      <ItemImageCell
                        value={r.image ?? null}
                        onChange={(img) => patchRow(r.key, { image: img })}
                      />
                    </td>
                    <td className="p-2">{r.label}</td>
                    <td className="p-2">
                      <Input
                        value={r.sku}
                        onChange={(e) =>
                          patchRow(r.key, { sku: e.target.value })
                        }
                        placeholder="SKU"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={r.price}
                        onChange={(e) =>
                          patchRow(r.key, { price: e.target.value })
                        }
                        placeholder="0.00"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        min="0"
                        value={r.stock}
                        onChange={(e) =>
                          patchRow(r.key, { stock: e.target.value })
                        }
                        placeholder="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
