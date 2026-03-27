'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import type { AdminCategoryItem } from '@/utils/requesters/categoryRequester'

export function CategoryQuickViewDialog({
  item,
  onOpenChange
}: {
  item: AdminCategoryItem | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Category Info</DialogTitle>
          <DialogDescription>ดูข้อมูลหมวดหมู่แบบย่อ</DialogDescription>
        </DialogHeader>
        {item && (
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Name:</span> {item.name}
            </div>
            <div>
              <span className="text-muted-foreground">UUID:</span> {item.uuid}
            </div>
            {/* <div>
              <span className="text-muted-foreground">Status:</span>{" "}
              {item.status}
            </div> */}
            <div>
              <span className="text-muted-foreground">Products (direct):</span>{' '}
              {item.productCountDirect}
            </div>
            <div>
              <span className="text-muted-foreground">Products (total):</span>{' '}
              {item.productCountTotal}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
