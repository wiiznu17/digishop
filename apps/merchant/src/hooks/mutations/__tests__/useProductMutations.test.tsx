import { act, renderHook } from '@testing-library/react'
import {
  useBulkDeleteProductsMutation,
  useBulkUpdateProductStatusMutation
} from '@/hooks/mutations/useProductMutations'
import { productQueryKeys } from '@/lib/react-query/keys/productKeys'
import { createQueryWrapper, createTestQueryClient } from '@/test/test-utils'
import {
  ProductStatus,
  reqStatus,
  type ProductListItem
} from '@/types/props/productProp'
import type { ProductListResponse } from '@/utils/requestUtils/requestProductUtils'
import {
  bulkDeleteProductsRequester,
  bulkUpdateProductStatusRequester
} from '@/utils/requestUtils/requestProductUtils'

vi.mock('@/utils/requestUtils/requestProductUtils', () => ({
  bulkDeleteProductsRequester: vi.fn(),
  bulkUpdateProductStatusRequester: vi.fn(),
  deleteProductRequester: vi.fn()
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
    toasts: [],
    dismiss: vi.fn()
  })
}))

function createProduct(
  uuid: string,
  status: ProductListItem['status'] = ProductStatus.ACTIVE
): ProductListItem {
  return {
    uuid,
    name: `Product ${uuid}`,
    status,
    reqStatus: reqStatus.APPROVED,
    totalImageCount: 0,
    productImageCount: 0,
    itemImageCount: 0,
    minPriceMinor: 1000,
    totalStock: 10,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function seedProductLists(
  queryClient: ReturnType<typeof createTestQueryClient>
) {
  const pageOneKey = productQueryKeys.list({ page: 1, pageSize: 10 })
  const pageTwoKey = productQueryKeys.list({ page: 2, pageSize: 10 })

  const pageOne: ProductListResponse = {
    data: [
      createProduct('prod-1'),
      createProduct('prod-2', ProductStatus.INACTIVE)
    ],
    meta: { page: 1, pageSize: 10, total: 3, totalPages: 1 }
  }
  const pageTwo: ProductListResponse = {
    data: [createProduct('prod-3')],
    meta: { page: 2, pageSize: 10, total: 3, totalPages: 1 }
  }

  queryClient.setQueryData(pageOneKey, pageOne)
  queryClient.setQueryData(pageTwoKey, pageTwo)

  return { pageOneKey, pageTwoKey, pageOne, pageTwo }
}

describe('useProductMutations', () => {
  it('optimistically updates product status across cached lists and rolls back on failure', async () => {
    const queryClient = createTestQueryClient()
    const wrapper = createQueryWrapper(queryClient)
    const { pageOneKey, pageTwoKey, pageOne, pageTwo } =
      seedProductLists(queryClient)

    const pending = deferred<number>()
    vi.mocked(bulkUpdateProductStatusRequester).mockReturnValue(pending.promise)

    const { result } = renderHook(() => useBulkUpdateProductStatusMutation(), {
      wrapper
    })

    let mutationPromise: Promise<unknown>
    await act(async () => {
      mutationPromise = result.current.mutateAsync({
        productUuids: ['prod-1', 'prod-3'],
        status: ProductStatus.INACTIVE
      })
    })

    expect(
      queryClient.getQueryData<ProductListResponse>(pageOneKey)?.data[0].status
    ).toBe('INACTIVE')
    expect(
      queryClient.getQueryData<ProductListResponse>(pageTwoKey)?.data[0].status
    ).toBe('INACTIVE')

    await act(async () => {
      pending.reject(new Error('bulk update failed'))
      await expect(mutationPromise!).rejects.toThrow('bulk update failed')
    })

    expect(queryClient.getQueryData(pageOneKey)).toEqual(pageOne)
    expect(queryClient.getQueryData(pageTwoKey)).toEqual(pageTwo)
  })

  it('optimistically removes products from cached lists, updates totals, and invalidates lists', async () => {
    const queryClient = createTestQueryClient()
    const wrapper = createQueryWrapper(queryClient)
    const { pageOneKey, pageTwoKey } = seedProductLists(queryClient)

    vi.mocked(bulkDeleteProductsRequester).mockResolvedValue(true)

    const { result } = renderHook(() => useBulkDeleteProductsMutation(), {
      wrapper
    })

    await act(async () => {
      await result.current.mutateAsync(['prod-1', 'prod-3'])
    })

    expect(queryClient.getQueryData<ProductListResponse>(pageOneKey)).toEqual({
      data: [createProduct('prod-2', ProductStatus.INACTIVE)],
      meta: { page: 1, pageSize: 10, total: 2, totalPages: 1 }
    })
    expect(queryClient.getQueryData<ProductListResponse>(pageTwoKey)).toEqual({
      data: [],
      meta: { page: 2, pageSize: 10, total: 2, totalPages: 1 }
    })
    expect(queryClient.getQueryState(pageOneKey)?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(pageTwoKey)?.isInvalidated).toBe(true)
  })
})
