"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

import {
  listCategoriesRequester,
  getCategoryDetailRequester,
  patchCategoryStatusRequester,
  deleteCategoryRequester,
  createCategoryRequester,
  updateCategoryRequester,
  moveProductsRequester,
  suggestCategoriesRequester,
  listAllFlatCategoriesRequester,
  type AdminCategoryItem,
  // type AdminCategoryStatus,
  type ListCategoriesParams
} from "@/utils/requesters/categoryRequester"

import { CategoryBreadcrumbs } from "@/components/admin/categories/category-breadcrumbs"
import { CategorySearchBar } from "@/components/admin/categories/category-searchbar"
import { CategoryTable } from "@/components/admin/categories/category-table"
import { AdminPagination } from "@/components/common/pagination"
import { CategoryQuickViewDialog } from "@/components/admin/categories/category-quickview"
import { CategoryFormDialog } from "@/components/admin/categories/category-form"
// import { ConfirmHideDialog } from "@/components/admin/categories/confirm-hide"
import { DeleteOrMoveDialog } from "@/components/admin/categories/delete-or-move"
import { DashboardHeader } from "@/components/dashboard-header"
import AuthGuard from "@/components/AuthGuard"

// ——— URL query helpers ———
function useQueryState() {
  const router = useRouter()
  const sp = useSearchParams()

  const parentUuid = sp.get("parent") || null
  const q = sp.get("q") ?? ""
  // const status = (sp.get("status") as AdminCategoryStatus | "ALL") ?? "ALL"
  const page = Number(sp.get("page") ?? 1)
  const pageSize = Number(sp.get("pageSize") ?? 20)

  const push = (patch: Record<string, string | number | null | undefined>) => {
    const next = new URLSearchParams(sp.toString())
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") next.delete(k)
      else next.set(k, String(v))
    })
    router.push(`/admin/categories?${next.toString()}`)
  }

  return { parentUuid, q, status, page, pageSize, push }
}

function AdminCategoriesPage() {
  const { parentUuid, q, status, page, pageSize, push } = useQueryState()

  // data
  const [rows, setRows] = useState<AdminCategoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // breadcrumbs
  const [crumbs, setCrumbs] = useState<{ uuid: string | null; name: string }[]>(
    [{ uuid: null, name: "Root" }]
  )

  // dialogs / modals state
  const [quickView, setQuickView] = useState<AdminCategoryItem | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<AdminCategoryItem | null>(null)
  // const [hideItem, setHideItem] = useState<AdminCategoryItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<AdminCategoryItem | null>(null)

  // options for move dialog
  const [flatOptions, setFlatOptions] = useState<AdminCategoryItem[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    const params: ListCategoriesParams = {
      parentUuid: parentUuid,
      q: q || undefined,
      // status: status === "ALL" ? undefined : status,
      page,
      pageSize
    }
    const res = await listCategoriesRequester(params)
    setRows(res?.data ?? [])
    setTotalItems(res?.meta?.total ?? 0)
    setTotalPages(res?.meta?.totalPages ?? 1)
    setLoading(false)
  }, [parentUuid, q, page, pageSize])

  // build breadcrumb by walking parents
  const loadCrumbs = useCallback(async () => {
    const trail: { uuid: string | null; name: string }[] = [
      { uuid: null, name: "Root" }
    ]
    if (!parentUuid) {
      setCrumbs(trail)
      return
    }
    // ascend
    let cur: string | null = parentUuid
    const stack: { uuid: string; name: string; parentUuid: string | null }[] =
      []
    // ให้เรียกซ้ำๆ (ความลึกไม่น่ามาก)
    while (cur) {
      const d = await getCategoryDetailRequester(cur)
      if (!d) break
      stack.push({ uuid: d.uuid, name: d.name, parentUuid: d.parentUuid })
      cur = d.parentUuid
    }
    stack.reverse().forEach((n) => trail.push({ uuid: n.uuid, name: n.name }))
    setCrumbs(trail)
  }, [parentUuid])

  // flat options for Move dialog
  const loadFlatOptions = useCallback(async () => {
    const res = await listAllFlatCategoriesRequester()
    setFlatOptions(res ?? [])
  }, [])

  useEffect(() => {
    void load()
    void loadCrumbs()
  }, [load, loadCrumbs])

  // handlers
  const goTo = (nextParent: string | null) => {
    push({ parent: nextParent, page: 1 })
  }

  const onSearchApply = (next: {
    q: string
    // status: AdminCategoryStatus | "ALL"
  }) => {
    push({
      q: next.q,
      // status: next.status,
      page: 1
    })
  }

  const onPageChange = (p: number) => push({ page: p })
  const onPageSizeChange = (s: number) => push({ pageSize: s, page: 1 })

  const onRowClick = (row: AdminCategoryItem) => goTo(row.uuid)

  const onQuickView = (row: AdminCategoryItem) => setQuickView(row)

  const onEdit = (row?: AdminCategoryItem) => {
    setEditItem(row ?? null)
    setFormOpen(true)
  }

  const onSubmitForm = async (payload: {
    name: string
    // status: AdminCategoryStatus
    parentUuid: string | null
  }) => {
    if (!editItem) {
      await createCategoryRequester(payload)
    } else {
      await updateCategoryRequester(editItem.uuid, payload)
    }
    setFormOpen(false)
    setEditItem(null)
    await load()
  }

  // const onToggleHide = async (row: AdminCategoryItem) => {
  //   // มีสินค้าก็เตือนแต่ให้ซ่อนได้
  //   const willHide = row.status === "ACTIVE"
  //   if (willHide && row.productCountTotal > 0) {
  //     setHideItem(row)
  //   } else {
  //     await patchCategoryStatusRequester(
  //       row.uuid,
  //       willHide ? "HIDDEN" : "ACTIVE"
  //     )
  //     await load()
  //   }
  // }

  // const onConfirmHide = async () => {
  //   if (!hideItem) return
  //   const willHide = hideItem.status === "ACTIVE"
  //   await patchCategoryStatusRequester(
  //     hideItem.uuid,
  //     willHide ? "HIDDEN" : "ACTIVE"
  //   )
  //   setHideItem(null)
  //   await load()
  // }

  const onDelete = async (row: AdminCategoryItem) => {
    // ลบได้เฉพาะไม่มีสินค้า (รวมลูก)
    if (row.productCountTotal > 0) {
      // เปิด dialog ที่มีปุ่ม go-to move products
      setDeleteItem(row)
      await loadFlatOptions()
      return
    }
    await deleteCategoryRequester(row.uuid) // ฝั่ง BE ต้อง cascade ลูก
    await load()
  }

  const onMoveAndDelete = async (sourceUuid: string, targetUuid: string) => {
    // ย้ายสินค้าก่อน -> แล้วค่อยลบ
    await moveProductsRequester(sourceUuid, targetUuid)
    await deleteCategoryRequester(sourceUuid)
    setDeleteItem(null)
    await load()
  }

  // suggest function for searchbar
  const suggest = useCallback(async (term: string) => {
    if (!term.trim()) return []
    const out = await suggestCategoriesRequester(term.trim())
    return (out ?? []).map((c) => ({ id: c.uuid, label: c.name }))
  }, [])

  return (
    <div>
      <DashboardHeader
        title="Category"
        description="Manage all categories in platform"
      ></DashboardHeader>
      <div className="p-4">
        <Card>
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle>Categories</CardTitle>
              <CardDescription>Click to see Subcategories</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button className="gap-2" onClick={() => onEdit(undefined)}>
                <Plus className="h-4 w-4" />
                Add Category
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <CategoryBreadcrumbs items={crumbs} onNavigate={(u) => goTo(u)} />

            <CategorySearchBar
              defaultValue={{ q }}
              onApply={onSearchApply}
              suggest={suggest}
            />

            <CategoryTable
              loading={loading}
              rows={rows}
              onRowClick={onRowClick}
              onQuickView={onQuickView}
              onEdit={onEdit}
              // onToggleHide={onToggleHide}
              onDelete={onDelete}
            />

            <AdminPagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={pageSize}
              onPageChange={onPageChange}
              onItemsPerPageChange={onPageSizeChange}
              showItemsPerPageSelector
            />
          </CardContent>
        </Card>

        {/* Quick view */}
        <CategoryQuickViewDialog
          item={quickView}
          onOpenChange={() => setQuickView(null)}
        />

        {/* Create / Edit */}
        <CategoryFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          initial={
            editItem
              ? {
                  name: editItem.name,
                  // status: editItem.status,
                  parentUuid: editItem.parentUuid
                }
              : {
                  name: "",
                  // status: "ACTIVE",
                  parentUuid: parentUuid ?? null
                }
          }
          parentDefaultName={crumbs[crumbs.length - 1]?.name ?? "Root"}
          onSubmit={onSubmitForm}
        />

        {/* Hide confirm */}
        {/* <ConfirmHideDialog
        item={hideItem}
        onCancel={() => setHideItem(null)}
        onConfirm={onConfirmHide}
      /> */}

        {/* Delete or Move */}
        <DeleteOrMoveDialog
          item={deleteItem}
          options={flatOptions}
          onCancel={() => setDeleteItem(null)}
          onMoveAndDelete={(targetUuid) => {
            if (!deleteItem) return
            onMoveAndDelete(deleteItem.uuid, targetUuid)
          }}
        />
      </div>
    </div>
  )
}

function Guard({ children }: { children: React.ReactNode }) {
  "use client"
  return <AuthGuard requiredPerms={["CATEGORIES_READ"]}>{children}</AuthGuard>
}

export default function Page() {
  return (
    <Guard>
      <AdminCategoriesPage />
    </Guard>
  )
}
