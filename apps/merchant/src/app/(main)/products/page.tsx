"use client"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"

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
  type CategoryDto
} from "@/utils/requestUtils/requestProductUtils"
import ProductDialog from "@/components/product/productDialog"
import type { ProductFilterState } from "@/components/product/productFilters"

type ProductRow = ProductListResponse["data"][number]

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const page = Number(searchParams.get("page") ?? 1)
  const pageSize = Number(searchParams.get("pageSize") ?? 20)
  const q = searchParams.get("q") ?? ""
  const categoryUuid = searchParams.get("categoryUuid") ?? undefined
  const status =
    (searchParams.get("status") as "ACTIVE" | "INACTIVE" | null) ?? undefined
  const reqStatus =
    (searchParams.get("reqStatus") as
      | "PENDING"
      | "APPROVED"
      | "REJECT"
      | null) ?? undefined
  const inStockParam = searchParams.get("inStock")
  const inStock = inStockParam == null ? undefined : inStockParam === "true"
  const sortBy =
    (searchParams.get("sortBy") as FetchProductsParams["sortBy"]) ?? "createdAt"
  const sortDir =
    (searchParams.get("sortDir") as FetchProductsParams["sortDir"]) ?? "desc"

  const [filters, setFilters] = useState<ProductFilterState>({
    q,
    categoryUuid,
    status,
    reqStatus,
    stock: inStock === undefined ? "all" : inStock ? "in" : "out",
    sortBy,
    sortDir
  })

  useEffect(() => {
    setFilters({
      q,
      categoryUuid,
      status,
      reqStatus,
      stock: inStock === undefined ? "all" : inStock ? "in" : "out",
      sortBy,
      sortDir
    })
  }, [q, categoryUuid, status, reqStatus, inStock, sortBy, sortDir])

  const [products, setProducts] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalItems, setTotalItems] = useState<number>(0)
  const [categories, setCategories] = useState<CategoryDto[]>([])

  const [quickViewOpen, setQuickViewOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(
    null
  )

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
      reqStatus,
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
  }, [
    q,
    categoryUuid,
    status,
    reqStatus,
    inStock,
    sortBy,
    sortDir,
    page,
    pageSize
  ])

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
    pushQuery({
      q: filters.q,
      categoryUuid: filters.categoryUuid,
      status: filters.status,
      reqStatus: filters.reqStatus,
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
      reqStatus: undefined,
      stock: "all",
      sortBy: "createdAt",
      sortDir: "desc"
    })
    pushQuery({
      q: undefined,
      categoryUuid: undefined,
      status: undefined,
      reqStatus: undefined,
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

  const onQuickView = (p: ProductRow) => {
    setSelectedProduct(p)
    setQuickViewOpen(true)
  }

  return (
    <div>
      <MerchantHeader title="Products" description="Manage your product" />

      <div className="flex flex-1 flex-col gap-4 p-4">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : (
          <ProductList
            products={products}
            onEdit={onEdit}
            onDelete={onDelete}
            onQuickView={onQuickView}
            filters={filters}
            onFiltersChange={(patch) =>
              setFilters((prev) => ({ ...prev, ...patch }))
            }
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
            categories={categories}
            onBulkCompleted={fetchList} // ← refresh หลัง bulk
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

      <ProductDialog
        isOpen={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        product={selectedProduct}
      />
    </div>
  )
}
