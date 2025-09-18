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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
// import type { AdminCategoryStatus } from "@/utils/requesters/categoryRequester"

export function CategoryFormDialog({
  open,
  onOpenChange,
  initial,
  parentDefaultName,
  onSubmit
}: {
  open: boolean
  onOpenChange: (b: boolean) => void
  initial: {
    name: string
    // status: AdminCategoryStatus
    parentUuid: string | null
  }
  parentDefaultName: string
  onSubmit: (v: {
    name: string
    // status: AdminCategoryStatus
    parentUuid: string | null
  }) => Promise<void> | void
}) {
  const [name, setName] = useState(initial.name)
  // const [status, setStatus] = useState<AdminCategoryStatus>(initial.status)

  // ถ้าจะให้เลือก parent จริง ๆ เพิ่ม Select อีกตัวและโหลด flat options ได้
  // ตอนนี้ใช้ parent จาก context (breadcrumb) เป็นค่า default
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initial.name ? "Edit Category" : "Add Category"}
          </DialogTitle>
          <DialogDescription>Parent: {parentDefaultName}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น Electronics"
            />
          </div>
          {/* <div>
            <label className="block text-sm mb-1">Status</label>
            <Select
              value={status}
              onValueChange={(v: AdminCategoryStatus) => setStatus(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                <SelectItem value="HIDDEN">HIDDEN</SelectItem>
              </SelectContent>
            </Select>
          </div> */}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              onSubmit({
                name: name.trim(),
                // status,
                parentUuid: initial.parentUuid
              })
            }
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
