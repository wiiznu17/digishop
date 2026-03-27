'use client'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Eye, EyeOff, Pencil, Trash2, Info } from 'lucide-react'
import type { AdminCategoryItem } from '@/utils/requesters/categoryRequester'

type Props = {
  loading: boolean
  rows: AdminCategoryItem[]
  onRowClick: (row: AdminCategoryItem) => void // navigate to children
  onQuickView: (row: AdminCategoryItem) => void
  onEdit: (row?: AdminCategoryItem) => void
  // onToggleHide: (row: AdminCategoryItem) => void
  onDelete: (row: AdminCategoryItem) => void
}

export function CategoryTable({
  loading,
  rows,
  onRowClick,
  onQuickView,
  onEdit,
  // onToggleHide,
  onDelete
}: Props) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            {/* <TableHead>Status</TableHead> */}
            <TableHead className="text-right">Products (direct)</TableHead>
            <TableHead className="text-right">Products (total)</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && (
            <TableRow>
              <TableCell colSpan={5} className="text-sm text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
          )}
          {!loading && rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-sm text-muted-foreground">
                ไม่มีข้อมูล
              </TableCell>
            </TableRow>
          )}
          {!loading &&
            rows.map((row) => (
              <TableRow key={row.uuid}>
                <TableCell>
                  <button
                    className="text-left font-medium hover:text-blue-600"
                    onClick={() => onRowClick(row)}
                    title="ดูหมวดลูก"
                  >
                    {row.name}
                  </button>
                </TableCell>
                {/* <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      row.status === "ACTIVE"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                    }`}
                  >
                    {row.status}
                  </span>
                </TableCell> */}
                <TableCell className="text-right">
                  {row.productCountDirect}
                </TableCell>
                <TableCell className="text-right">
                  {row.productCountTotal}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onQuickView(row)}
                      title="Quick view"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(row)}
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {/* <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onToggleHide(row)}
                      title={row.status === "ACTIVE" ? "Hide" : "Unhide"}
                    >
                      {row.status === "ACTIVE" ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button> */}
                    <Button
                      variant={
                        row.productCountTotal > 0 ? 'outline' : 'destructive'
                      }
                      size="sm"
                      onClick={() => onDelete(row)}
                      title={
                        row.productCountTotal > 0
                          ? 'ลบไม่ได้ (มีสินค้า) — เลือกย้ายสินค้า'
                          : 'Delete'
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  )
}
