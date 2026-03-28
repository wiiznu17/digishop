import { act, renderHook } from '@testing-library/react'
import {
  ProductStatus,
  reqStatus,
  type Product
} from '@/types/props/productProp'
import {
  useCreateProductMutation,
  useDeleteProductDetailMutation,
  useDuplicateProductMutation,
  useToggleProductItemMutation,
  useUpdateProductDesiredMutation
} from '@/hooks/mutations/useProductDetailMutations'
import { productQueryKeys } from '@/lib/react-query/keys/productKeys'
import { createQueryWrapper, createTestQueryClient } from '@/test/test-utils'
import {
  createProductDesiredRequester,
  deleteProductRequester,
  duplicateProductRequester,
  updateProductDesiredRequester,
  updateProductItemRequester
} from '@/utils/requestUtils/requestProductUtils'
import type { ProductListResponse } from '@/utils/requestUtils/requestProductUtils'

vi.mock('@/utils/requestUtils/requestProductUtils', () => ({
  createProductDesiredRequester: vi.fn(),
  deleteProductRequester: vi.fn(),
  duplicateProductRequester: vi.fn(),
  updateProductDesiredRequester: vi.fn(),
  updateProductItemRequester: vi.fn()
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
    toasts: [],
    dismiss: vi.fn()
  })
}))

function createProductDetail(overrides: Partial<Product> = {}): Product {
  return {
    uuid: 'prod-1',
    name: 'Test Product',
    description: 'desc',
    category: { uuid: 'cat-1', name: 'Category' },
    status: 'ACTIVE' as Product['status'],
    reqStatus: 'APPROVED' as Product['reqStatus'],
    images: [],
    variations: [],
    items: [
      {
        uuid: 'item-1',
        sku: 'SKU-1',
        priceMinor: 1200,
        stockQuantity: 5,
        isEnable: true
      }
    ],
    ...overrides
  }
}

function seedProductList(
  queryClient: ReturnType<typeof createTestQueryClient>
) {
  const listKey = productQueryKeys.list({ page: 1, pageSize: 10 })
  const listValue: ProductListResponse = {
    data: [
      {
        uuid: 'prod-1',
        name: 'Test Product',
        status: 'ACTIVE' as Product['status'],
        reqStatus: 'APPROVED' as Product['reqStatus'],
        totalImageCount: 0,
        productImageCount: 0,
        itemImageCount: 0,
        minPriceMinor: 1200,
        totalStock: 5,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      }
    ],
    meta: {
      page: 1,
      pageSize: 10,
      total: 1,
      totalPages: 1
    }
  }

  queryClient.setQueryData(listKey, listValue)
  return { listKey, listValue }
}

describe('useProductDetailMutations', () => {
  it('creates a product through the mutation hook', async () => {
    const queryClient = createTestQueryClient()
    const wrapper = createQueryWrapper(queryClient)
    const created = createProductDetail()
    const { listKey } = seedProductList(queryClient)

    vi.mocked(createProductDesiredRequester).mockResolvedValue(created)

    const { result } = renderHook(() => useCreateProductMutation(), {
      wrapper
    })

    await act(async () => {
      const response = await result.current.mutateAsync({
        payload: {
          product: {
            name: 'Test Product',
            description: 'desc',
            status: 'ACTIVE',
            categoryUuid: null
          },
          images: { product: [] },
          variations: [],
          items: []
        },
        productImages: [],
        itemImages: []
      })

      expect(response.uuid).toBe('prod-1')
    })

    expect(queryClient.getQueryData(productQueryKeys.detail('prod-1'))).toEqual(
      created
    )
    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true)
  })

  it('updates product detail cache after edit success', async () => {
    const queryClient = createTestQueryClient()
    const wrapper = createQueryWrapper(queryClient)
    const initial = createProductDetail()
    const { listKey } = seedProductList(queryClient)
    const updated = createProductDetail({
      name: 'Updated Product',
      description: 'updated desc',
      category: { uuid: 'cat-2', name: 'Updated Category' },
      status: ProductStatus.INACTIVE,
      reqStatus: reqStatus.PENDING,
      items: [
        {
          uuid: 'item-1',
          sku: 'SKU-1',
          priceMinor: 2500,
          stockQuantity: 8,
          isEnable: true
        },
        {
          uuid: 'item-2',
          sku: 'SKU-2',
          priceMinor: 1800,
          stockQuantity: 3,
          isEnable: true
        }
      ],
      updatedAt: '2025-02-01T00:00:00.000Z'
    })

    queryClient.setQueryData(productQueryKeys.detail('prod-1'), initial)
    vi.mocked(updateProductDesiredRequester).mockResolvedValue(updated)

    const { result } = renderHook(
      () => useUpdateProductDesiredMutation('prod-1'),
      { wrapper }
    )

    await act(async () => {
      await result.current.mutateAsync({
        payload: {
          product: {
            name: 'Updated Product',
            description: 'desc',
            status: 'ACTIVE',
            categoryUuid: null
          },
          images: { product: [] },
          variations: [],
          items: []
        },
        productImages: [],
        itemImages: []
      })
    })

    expect(queryClient.getQueryData(productQueryKeys.detail('prod-1'))).toEqual(
      updated
    )
    expect(
      queryClient.getQueryData<ProductListResponse>(listKey)?.data[0]
    ).toEqual(
      expect.objectContaining({
        uuid: 'prod-1',
        name: 'Updated Product',
        description: 'updated desc',
        category: { uuid: 'cat-2', name: 'Updated Category' },
        status: ProductStatus.INACTIVE,
        reqStatus: reqStatus.PENDING,
        minPriceMinor: 1800,
        totalStock: 11,
        updatedAt: '2025-02-01T00:00:00.000Z'
      })
    )
    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true)
  })

  it('reconciles only the edited product summary in cached lists after detail edits', async () => {
    const queryClient = createTestQueryClient()
    const wrapper = createQueryWrapper(queryClient)
    const listKey = productQueryKeys.list({ page: 1, pageSize: 10 })

    queryClient.setQueryData(listKey, {
      data: [
        {
          uuid: 'prod-1',
          name: 'Old Product',
          description: 'old desc',
          category: { uuid: 'cat-1', name: 'Category' },
          status: ProductStatus.ACTIVE,
          reqStatus: reqStatus.APPROVED,
          totalImageCount: 0,
          productImageCount: 0,
          itemImageCount: 0,
          minPriceMinor: 1200,
          totalStock: 5,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z'
        },
        {
          uuid: 'prod-2',
          name: 'Neighbor Product',
          description: 'neighbor desc',
          category: { uuid: 'cat-9', name: 'Neighbor Category' },
          status: ProductStatus.ACTIVE,
          reqStatus: reqStatus.APPROVED,
          totalImageCount: 0,
          productImageCount: 0,
          itemImageCount: 0,
          minPriceMinor: 999,
          totalStock: 1,
          createdAt: '2025-01-02T00:00:00.000Z',
          updatedAt: '2025-01-02T00:00:00.000Z'
        }
      ],
      meta: {
        page: 1,
        pageSize: 10,
        total: 2,
        totalPages: 1
      }
    } satisfies ProductListResponse)

    const updated = createProductDetail({
      name: 'Edited Product',
      description: 'edited desc',
      category: { uuid: 'cat-3', name: 'Edited Category' },
      items: [
        {
          uuid: 'item-1',
          sku: 'SKU-1',
          priceMinor: 1900,
          stockQuantity: 4,
          isEnable: true
        }
      ],
      updatedAt: '2025-03-01T00:00:00.000Z'
    })

    vi.mocked(updateProductDesiredRequester).mockResolvedValue(updated)

    const { result } = renderHook(
      () => useUpdateProductDesiredMutation('prod-1'),
      { wrapper }
    )

    await act(async () => {
      await result.current.mutateAsync({
        payload: {
          product: {
            name: 'Edited Product',
            description: 'edited desc',
            status: 'ACTIVE',
            categoryUuid: 'cat-3'
          },
          images: { product: [] },
          variations: [],
          items: []
        },
        productImages: [],
        itemImages: []
      })
    })

    expect(
      queryClient.getQueryData<ProductListResponse>(listKey)?.data
    ).toEqual([
      expect.objectContaining({
        uuid: 'prod-1',
        name: 'Edited Product',
        description: 'edited desc',
        category: { uuid: 'cat-3', name: 'Edited Category' },
        minPriceMinor: 1900,
        totalStock: 4,
        updatedAt: '2025-03-01T00:00:00.000Z'
      }),
      expect.objectContaining({
        uuid: 'prod-2',
        name: 'Neighbor Product',
        description: 'neighbor desc',
        category: { uuid: 'cat-9', name: 'Neighbor Category' },
        minPriceMinor: 999,
        totalStock: 1,
        updatedAt: '2025-01-02T00:00:00.000Z'
      })
    ])
  })

  it('applies and rolls back optimistic item toggles on failure', async () => {
    const queryClient = createTestQueryClient()
    const wrapper = createQueryWrapper(queryClient)
    const initial = createProductDetail()

    queryClient.setQueryData(productQueryKeys.detail('prod-1'), initial)
    vi.mocked(updateProductItemRequester).mockRejectedValue(new Error('nope'))

    const { result } = renderHook(
      () => useToggleProductItemMutation('prod-1'),
      {
        wrapper
      }
    )

    await act(async () => {
      await expect(
        result.current.mutateAsync({ itemUuid: 'item-1', next: false })
      ).rejects.toThrow('nope')
    })

    expect(queryClient.getQueryData(productQueryKeys.detail('prod-1'))).toEqual(
      initial
    )
  })

  it('removes detail cache on delete success', async () => {
    const queryClient = createTestQueryClient()
    const wrapper = createQueryWrapper(queryClient)
    const { listKey } = seedProductList(queryClient)

    queryClient.setQueryData(
      productQueryKeys.detail('prod-1'),
      createProductDetail()
    )
    vi.mocked(deleteProductRequester).mockResolvedValue(true)

    const { result } = renderHook(
      () => useDeleteProductDetailMutation('prod-1'),
      { wrapper }
    )

    await act(async () => {
      await result.current.mutateAsync()
    })

    expect(queryClient.getQueryData(productQueryKeys.detail('prod-1'))).toBe(
      undefined
    )
    expect(
      queryClient.getQueryData<ProductListResponse>(listKey)?.data
    ).toEqual([])
    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true)
  })

  it('prewarms duplicated detail cache and invalidates product lists without mutating the source detail cache', async () => {
    const queryClient = createTestQueryClient()
    const wrapper = createQueryWrapper(queryClient)
    const { listKey } = seedProductList(queryClient)
    const original = createProductDetail()
    const duplicated = createProductDetail({
      uuid: 'prod-2',
      name: 'Test Product Copy'
    })

    queryClient.setQueryData(productQueryKeys.detail('prod-1'), original)
    vi.mocked(duplicateProductRequester).mockResolvedValue(duplicated)

    const { result } = renderHook(() => useDuplicateProductMutation(), {
      wrapper
    })

    await act(async () => {
      const response = await result.current.mutateAsync('prod-1')
      expect(response.uuid).toBe('prod-2')
    })

    expect(queryClient.getQueryData(productQueryKeys.detail('prod-1'))).toEqual(
      original
    )
    expect(queryClient.getQueryData(productQueryKeys.detail('prod-2'))).toEqual(
      duplicated
    )
    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true)
  })
})
