"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import type { AdminCategoryItem } from "@/utils/requesters/categoryRequester"

export function DeleteOrMoveDialog({
  item,
  options,
  onCancel,
  onMoveAndDelete
}: {
  item: AdminCategoryItem | null
  options: AdminCategoryItem[]
  onCancel: () => void
  onMoveAndDelete: (targetUuid: string) => Promise<void> | void
}) {
  const open = !!item
  const [target, setTarget] = useState<string>("")

  // filter: ห้ามเลือกตัวเอง/ลูกหลานตัวเอง (ตรงนี้ assume backend กันอีกชั้น)
  const filtered = options.filter((o) => o.uuid !== item?.uuid)

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Category</DialogTitle>
          <DialogDescription>
            ลบไม่ได้ — มีสินค้าอยู่ในหมวดนี้ (รวมลูกหมวด)
            ต้องย้ายสินค้าไปหมวดอื่นก่อนลบ
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-sm">
            หมวดที่จะลบ: <span className="font-medium">{item?.name}</span>
          </div>
          <div>
            <label className="block text-sm mb-1">ย้ายสินค้าไปหมวด</label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกหมวดปลายทาง" />
              </SelectTrigger>
              <SelectContent className="max-h-[280px]">
                {filtered.map((c) => (
                  <SelectItem key={c.uuid} value={c.uuid}>
                    {c.name}
                    {/* {c.status === "HIDDEN" ? "(hidden)" : ""} */}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            disabled={!target}
            onClick={() => target && onMoveAndDelete(target)}
          >
            Move & Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
