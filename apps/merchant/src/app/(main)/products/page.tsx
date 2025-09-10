// apps/merchant/src/app/(main)/products/page.tsx
"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MerchantHeader } from "@/components/dashboard-header"
import { ProductList } from "@/components/product/productList"
import { Pagination } from "@/components/order/pagination"
import {
  fetchProductsRequester,
  deleteProductRequester,
  type FetchProductsParams,
  type ProductListResponse,
  fetchCategoriesRequester,
  CategoryDto
} from "@/utils/requestUtils/requestProductUtils"
// ดึงเฉพาะ type เพื่อไม่ให้ component ถูก import มาด้วย
import type { ProductFilterState } from "@/components/product/productFilters"

type ProductRow = ProductListResponse["data"][number]

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // อ่านค่าจาก URL
  const page = Number(searchParams.get("page") ?? 1)
  const pageSize = Number(searchParams.get("pageSize") ?? 20)
  const q = searchParams.get("q") ?? ""
  const categoryUuid = searchParams.get("categoryUuid") ?? undefined
  const status = searchParams.get("status") ?? undefined
  const inStockParam = searchParams.get("inStock")
  const inStock = inStockParam == null ? undefined : inStockParam === "true"
  const sortBy =
    (searchParams.get("sortBy") as FetchProductsParams["sortBy"]) ?? "createdAt"
  const sortDir =
    (searchParams.get("sortDir") as FetchProductsParams["sortDir"]) ?? "desc"

  // draft filters (แก้ค่าได้โดยไม่ reload / ไม่เปลี่ยน URL จนกด Search)
  const [filters, setFilters] = useState<ProductFilterState>({
    q,
    categoryUuid,
    status,
    stock: inStock === undefined ? "all" : inStock ? "in" : "out",
    sortBy,
    sortDir
  })

  // sync filters เมื่อ URL เปลี่ยน (หลังจากกด Search)
  useEffect(() => {
    setFilters({
      q,
      categoryUuid,
      status,
      stock: inStock === undefined ? "all" : inStock ? "in" : "out",
      sortBy,
      sortDir
    })
  }, [q, categoryUuid, status, inStock, sortBy, sortDir])

  const [products, setProducts] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalItems, setTotalItems] = useState<number>(0)
  const [categories, setCategories] = useState<CategoryDto[]>([])

  useEffect(() => {
    ;(async () => {
      const cats = await fetchCategoriesRequester()
      setCategories(cats)
    })()
  }, [])

  const fetchList = useCallback(async () => {
    setLoading(true)
    const res = await fetchProductsRequester({
      q,
      categoryUuid,
      status,
      inStock,
      sortBy,
      sortDir,
      page,
      pageSize
    })
    setLoading(false)
    if (!res) return
    setProducts(res.data)
    setTotalItems(res.meta.total)
    setTotalPages(res.meta.totalPages || 1)
  }, [q, categoryUuid, status, inStock, sortBy, sortDir, page, pageSize])

  useEffect(() => {
    void fetchList()
  }, [fetchList])

  const pushQuery = (kv: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams(searchParams.toString())
    Object.entries(kv).forEach(([k, v]) => {
      if (v === undefined || v === "") sp.delete(k)
      else sp.set(k, String(v))
    })
    router.push(`/products?${sp.toString()}`)
  }

  const handleApplyFilters = () => {
    // กด Search ค่อยอัปเดต URL -> fetch ใหม่
    pushQuery({
      q: filters.q,
      categoryUuid: filters.categoryUuid,
      status: filters.status,
      inStock:
        filters.stock === "all" ? undefined : String(filters.stock === "in"),
      sortBy: filters.sortBy,
      sortDir: filters.sortDir,
      page: 1
    })
  }

  const handleResetFilters = () => {
    setFilters({
      q: "",
      categoryUuid: undefined,
      status: undefined,
      stock: "all",
      sortBy: "createdAt",
      sortDir: "desc"
    })
    pushQuery({
      q: undefined,
      categoryUuid: undefined,
      status: undefined,
      inStock: undefined,
      sortBy: "createdAt",
      sortDir: "desc",
      page: 1,
      pageSize
    })
  }

  const handlePageChange = (next: number) => {
    pushQuery({ page: next })
  }

  const handleItemsPerPageChange = (v: number) => {
    pushQuery({ pageSize: v, page: 1 })
  }

  const onEdit = (p: ProductRow) => router.push(`/products/${p.uuid}/edit`)

  const onDelete = async (uuid: string) => {
    if (!confirm("Delete this product?")) return
    const ok = await deleteProductRequester(uuid)
    if (ok) await fetchList()
  }

  return (
    <div>
      <MerchantHeader title="Products" description="Manage your product" />

      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* ให้ ProductList เป็นคน render ProductFilters เพียงที่เดียว */}
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : (
          <ProductList
            products={products}
            onEdit={onEdit}
            onDelete={onDelete}
            filters={filters}
            onFiltersChange={(patch) =>
              setFilters((prev) => ({ ...prev, ...patch }))
            }
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
            categories={categories}
          />
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={pageSize}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          showItemsPerPageSelector
        />
      </div>
    </div>
  )
}
