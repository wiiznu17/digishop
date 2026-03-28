'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MerchantHeader } from '@/components/dashboard-header'
import { ProductList } from '@/components/product/productList'
import { Pagination } from '@/components/order/pagination'
import ProductDialog from '@/components/product/productDialog'
import type { ProductFilterState } from '@/components/product/productFilters'
import { useToast } from '@/hooks/use-toast'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  applyProductsDraftFilters,
  clearSelectedProducts,
  closeQuickView,
  defaultProductFilters,
  openQuickView,
  removeProductsFromSelection,
  resetProductsFilters,
  setBulkStatusChoice,
  setProductsDraftFilters,
  setProductsPage,
  setProductsPageSize,
  setProductsSelectMode,
  setProductsStateFromUrl,
  toggleSelectedProduct,
  toggleSelectAllProductsOnPage
} from '@/store/slices/productsSlice'
import {
  findSelectedProduct,
  toProductListParams,
  useProductCategoriesQuery,
  useProductsListQuery
} from '@/hooks/queries/useProductQueries'
import {
  useBulkDeleteProductsMutation,
  useBulkUpdateProductStatusMutation,
  useDeleteProductMutation
} from '@/hooks/mutations/useProductMutations'
import type { FetchProductsParams } from '@/utils/requestUtils/requestProductUtils'

function fromSearchParams(searchParams: URLSearchParams): {
  filters: ProductFilterState
  page: number
  pageSize: number
} {
  const page = Number(searchParams.get('page') ?? 1)
  const pageSize = Number(searchParams.get('pageSize') ?? 20)
  const q = searchParams.get('q') ?? ''
  const categoryUuid = searchParams.get('categoryUuid') ?? undefined
  const status =
    (searchParams.get('status') as 'ACTIVE' | 'INACTIVE' | null) ?? undefined
  const reqStatus =
    (searchParams.get('reqStatus') as
      | 'PENDING'
      | 'APPROVED'
      | 'REJECT'
      | null) ?? undefined
  const inStockParam = searchParams.get('inStock')
  const stock =
    inStockParam == null ? 'all' : inStockParam === 'true' ? 'in' : 'out'
  const sortBy =
    (searchParams.get('sortBy') as FetchProductsParams['sortBy']) ?? 'createdAt'
  const sortDir =
    (searchParams.get('sortDir') as FetchProductsParams['sortDir']) ?? 'desc'

  return {
    filters: {
      q,
      categoryUuid,
      status,
      reqStatus,
      stock,
      sortBy,
      sortDir
    },
    page,
    pageSize
  }
}

function pushProductsQuery(
  router: ReturnType<typeof useRouter>,
  searchParams: URLSearchParams,
  filters: ProductFilterState,
  page: number,
  pageSize: number
) {
  const next = new URLSearchParams(searchParams.toString())
  const payload: Record<string, string | number | undefined> = {
    q: filters.q || undefined,
    categoryUuid: filters.categoryUuid,
    status: filters.status,
    reqStatus: filters.reqStatus,
    inStock:
      filters.stock === 'all' ? undefined : String(filters.stock === 'in'),
    sortBy: filters.sortBy,
    sortDir: filters.sortDir,
    page,
    pageSize
  }

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === '') next.delete(key)
    else next.set(key, String(value))
  })

  router.push(`/products?${next.toString()}`)
}

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const {
    draftFilters,
    appliedFilters,
    page,
    pageSize,
    quickViewProductUuid,
    quickViewOpen,
    selectMode,
    selectedUuids,
    bulkStatusChoice
  } = useAppSelector((state) => state.products)
  const { toast } = useToast()
  const productsErrorSignatureRef = useRef<string | null>(null)
  const categoriesErrorSignatureRef = useRef<string | null>(null)

  const urlState = useMemo(
    () => fromSearchParams(new URLSearchParams(searchParams.toString())),
    [searchParams]
  )

  useEffect(() => {
    dispatch(setProductsStateFromUrl(urlState))
  }, [dispatch, urlState])

  const listParams = useMemo(
    () => toProductListParams(appliedFilters, page, pageSize),
    [appliedFilters, page, pageSize]
  )

  const productsQuery = useProductsListQuery(listParams)
  const categoriesQuery = useProductCategoriesQuery()
  const deleteProductMutation = useDeleteProductMutation()
  const bulkStatusMutation = useBulkUpdateProductStatusMutation()
  const bulkDeleteMutation = useBulkDeleteProductsMutation()

  useEffect(() => {
    if (!productsQuery.error) {
      productsErrorSignatureRef.current = null
      return
    }

    const signature = String(productsQuery.error)
    if (productsErrorSignatureRef.current === signature) return
    productsErrorSignatureRef.current = signature
    toast({ title: 'Failed to load products', variant: 'destructive' })
  }, [productsQuery.error, toast])

  useEffect(() => {
    if (!categoriesQuery.error) {
      categoriesErrorSignatureRef.current = null
      return
    }

    const signature = String(categoriesQuery.error)
    if (categoriesErrorSignatureRef.current === signature) return
    categoriesErrorSignatureRef.current = signature
    toast({ title: 'Failed to load categories', variant: 'destructive' })
  }, [categoriesQuery.error, toast])

  const products = productsQuery.data?.data ?? []
  const totalPages = productsQuery.data?.meta.totalPages ?? 1
  const totalItems = productsQuery.data?.meta.total ?? 0
  const selectedProduct = findSelectedProduct(products, quickViewProductUuid)
  const applying = bulkStatusMutation.isPending || bulkDeleteMutation.isPending

  const handleApplyFilters = () => {
    dispatch(applyProductsDraftFilters())
    pushProductsQuery(
      router,
      new URLSearchParams(searchParams.toString()),
      draftFilters,
      1,
      pageSize
    )
  }

  const handleResetFilters = () => {
    dispatch(resetProductsFilters())
    pushProductsQuery(
      router,
      new URLSearchParams(searchParams.toString()),
      defaultProductFilters,
      1,
      pageSize
    )
  }

  const handlePageChange = (nextPage: number) => {
    dispatch(setProductsPage(nextPage))
    pushProductsQuery(
      router,
      new URLSearchParams(searchParams.toString()),
      appliedFilters,
      nextPage,
      pageSize
    )
  }

  const handleItemsPerPageChange = (nextPageSize: number) => {
    dispatch(setProductsPageSize(nextPageSize))
    pushProductsQuery(
      router,
      new URLSearchParams(searchParams.toString()),
      appliedFilters,
      1,
      nextPageSize
    )
  }

  const handleDelete = async (uuid: string) => {
    if (!confirm('Delete this product?')) return
    await deleteProductMutation.mutateAsync(uuid)
    dispatch(removeProductsFromSelection([uuid]))
    if (quickViewProductUuid === uuid) {
      dispatch(closeQuickView())
    }
  }

  const handleApplyBulkStatus = async () => {
    if (selectedUuids.length === 0) return
    await bulkStatusMutation.mutateAsync({
      productUuids: selectedUuids,
      status: bulkStatusChoice
    })
    dispatch(clearSelectedProducts())
  }

  const handleApplyBulkDelete = async () => {
    if (selectedUuids.length === 0) return
    if (!confirm(`Delete ${selectedUuids.length} selected product(s)?`)) return
    const deleting = [...selectedUuids]
    await bulkDeleteMutation.mutateAsync(deleting)
    dispatch(clearSelectedProducts())
    if (quickViewProductUuid && deleting.includes(quickViewProductUuid)) {
      dispatch(closeQuickView())
    }
  }

  return (
    <div>
      <MerchantHeader title="Products" description="Manage your product" />

      <div className="flex flex-1 flex-col gap-4 p-4">
        {productsQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : (
          <ProductList
            products={products}
            onEdit={(product) => router.push(`/products/${product.uuid}/edit`)}
            onDelete={handleDelete}
            onQuickView={(product) => dispatch(openQuickView(product.uuid))}
            filters={draftFilters}
            onFiltersChange={(patch) =>
              dispatch(setProductsDraftFilters(patch))
            }
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
            categories={categoriesQuery.data ?? []}
            selectMode={selectMode}
            selectedUuids={selectedUuids}
            bulkStatusChoice={bulkStatusChoice}
            applying={applying}
            onSelectModeChange={(enabled) =>
              dispatch(setProductsSelectMode(enabled))
            }
            onBulkStatusChoiceChange={(status) =>
              dispatch(setBulkStatusChoice(status))
            }
            onToggleRow={(uuid, checked) =>
              dispatch(toggleSelectedProduct({ uuid, checked }))
            }
            onToggleAllOnPage={(uuids, checked) =>
              dispatch(toggleSelectAllProductsOnPage({ uuids, checked }))
            }
            onClearSelection={() => dispatch(clearSelectedProducts())}
            onApplyBulkStatus={handleApplyBulkStatus}
            onApplyBulkDelete={handleApplyBulkDelete}
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
        onOpenChange={(open) => {
          if (!open) dispatch(closeQuickView())
        }}
        product={selectedProduct}
      />
    </div>
  )
}
