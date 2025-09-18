"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { AdminCategoryItem } from "@/utils/requesters/categoryRequester"

export function ConfirmHideDialog({
  item,
  onCancel,
  onConfirm
}: {
  item: AdminCategoryItem | null
  onCancel: () => void
  onConfirm: () => Promise<void> | void
}) {
  const open = !!item
  const willHide = item?.status === "ACTIVE"
  return (
    <Dialog open={open} onOpenChange={() => onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {willHide ? "Hide Category" : "Unhide Category"}
          </DialogTitle>
          <DialogDescription>
            {willHide
              ? "หมวดนี้มีสินค้าได้และจะไม่แสดงฝั่งลูกค้า"
              : "เปิดให้แสดงผลหมวดนี้อีกครั้ง"}
          </DialogDescription>
        </DialogHeader>
        {willHide && item && item.productCountTotal > 0 && (
          <div className="text-sm rounded border p-2 bg-amber-50 border-amber-200 text-amber-800">
            มีสินค้า {item.productCountTotal} รายการในหมวดนี้ (รวมลูกหมวด) —
            ยืนยันการซ่อน?
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onConfirm()}>
            {willHide ? "Hide" : "Unhide"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
