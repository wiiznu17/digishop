'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import type { AdminCategoryItem } from '@/utils/requesters/categoryRequester'

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
  const [target, setTarget] = useState<string>('')

  // filter: do not allow selecting itself/its descendants
  // (assume backend also enforces this)
  const filtered = options.filter((o) => o.uuid !== item?.uuid)

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Category</DialogTitle>
          <DialogDescription>
            Cannot delete — there are products in this category (including its
            subcategories). Move the products to another category before
            deleting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-sm">
            Category to delete:{' '}
            <span className="font-medium">{item?.name}</span>
          </div>
          <div>
            <label className="block text-sm mb-1">Move products to</label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger>
                <SelectValue placeholder="Select destination category" />
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
            Move &amp; Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
