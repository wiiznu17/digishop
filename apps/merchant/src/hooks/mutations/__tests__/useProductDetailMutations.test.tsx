import { act, renderHook } from '@testing-library/react'
import type { Product } from '@/types/props/productProp'
import {
  useCreateProductMutation,
  useDeleteProductDetailMutation,
  useToggleProductItemMutation,
  useUpdateProductDesiredMutation
} from '@/hooks/mutations/useProductDetailMutations'
import { productQueryKeys } from '@/lib/react-query/keys/productKeys'
import { createQueryWrapper, createTestQueryClient } from '@/test/test-utils'
import {
  createProductDesiredRequester,
  deleteProductRequester,
  updateProductDesiredRequester,
  updateProductItemRequester
} from '@/utils/requestUtils/requestProductUtils'

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

describe('useProductDetailMutations', () => {
  it('creates a product through the mutation hook', async () => {
    const queryClient = createTestQueryClient()
    const wrapper = createQueryWrapper(queryClient)
    const created = createProductDetail()

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
  })

  it('updates product detail cache after edit success', async () => {
    const queryClient = createTestQueryClient()
    const wrapper = createQueryWrapper(queryClient)
    const initial = createProductDetail()
    const updated = createProductDetail({ name: 'Updated Product' })

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
  })
})
