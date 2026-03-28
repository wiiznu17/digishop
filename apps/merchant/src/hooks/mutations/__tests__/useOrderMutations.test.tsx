import { act, renderHook } from '@testing-library/react'
import {
  useHandOverOrderMutation,
  useUpdateOrderStatusMutation,
  useUpdateOrderTrackingMutation
} from '@/hooks/mutations/useOrderMutations'
import { orderQueryKeys } from '@/lib/react-query/keys/orderKeys'
import { createQueryWrapper, createTestQueryClient } from '@/test/test-utils'
import type { Order } from '@/types/props/orderProp'
import {
  handOverOrderRequester,
  updateOrderRequester,
  type ListOrdersResponse
} from '@/utils/requestUtils/requestOrderUtils'

const toastSpy = vi.hoisted(() => vi.fn())

vi.mock('@/utils/requestUtils/requestOrderUtils', () => ({
  handOverOrderRequester: vi.fn(),
  updateOrderRequester: vi.fn()
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: toastSpy,
    toasts: [],
    dismiss: vi.fn()
  })
}))

vi.mock('@/hooks/useOrderStatus', () => ({
  useOrderStatus: () => ({
    getStatusText: (status: string) => status
  })
}))

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function createOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'ord-1',
    orderCode: 'ORD-001',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    grandTotal: 1000,
    status: 'PAID',
    payment: {
      captured: 1000
    },
    statusHistory: ['PAID'],
    trackingNumber: null,
    ...overrides
  }
}

function seedOrderCache(
  queryClient: ReturnType<typeof createTestQueryClient>,
  order: Order
) {
  const listData: ListOrdersResponse = {
    data: [order],
    meta: { page: 1, pageSize: 20, total: 1 }
  }
  const listKey = orderQueryKeys.list({ page: 1, pageSize: 20 })

  queryClient.setQueryData(orderQueryKeys.summary(), {
    totalOrders: 1,
    pendingPayment: 0,
    paidOrders: 1,
    processing: 0,
    handedOver: 0,
    refundRequests: 0,
    canceledOrders: 0,
    totalRevenue: 1000,
    refundSuccessOrders: 0,
    completed: 0
  })
  queryClient.setQueryData(listKey, listData)
  queryClient.setQueryData(orderQueryKeys.detail(order.id), { data: order })
  return { listKey }
}

describe('useOrderMutations', () => {
  beforeEach(() => {
    toastSpy.mockReset()
  })

  it('optimistically updates status across list and detail caches and rolls back on failure', async () => {
    const queryClient = createTestQueryClient()
    const wrapper = createQueryWrapper(queryClient)
    const order = createOrder()
    seedOrderCache(queryClient, order)

    const pending = deferred<{ data: Order }>()
    vi.mocked(updateOrderRequester).mockReturnValue(pending.promise)

    const { result } = renderHook(() => useUpdateOrderStatusMutation(), {
      wrapper
    })

    let mutationPromise: Promise<unknown>
    await act(async () => {
      mutationPromise = result.current.mutateAsync({
        orderId: order.id,
        newStatus: 'PROCESSING'
      })
    })

    const optimisticList = queryClient.getQueryData<ListOrdersResponse>(
      orderQueryKeys.list({ page: 1, pageSize: 20 })
    )
    const optimisticDetail = queryClient.getQueryData<{ data: Order }>(
      orderQueryKeys.detail(order.id)
    )

    expect(optimisticList?.data[0].status).toBe('PROCESSING')
    expect(optimisticDetail?.data.status).toBe('PROCESSING')
    expect(optimisticDetail?.data.statusHistory).toEqual(['PAID', 'PROCESSING'])

    await act(async () => {
      pending.reject(new Error('update failed'))
      await expect(mutationPromise!).rejects.toThrow('update failed')
    })

    expect(queryClient.getQueryData(orderQueryKeys.detail(order.id))).toEqual({
      data: order
    })
  })

  it('stores server-confirmed tracking updates in cache', async () => {
    const queryClient = createTestQueryClient()
    const wrapper = createQueryWrapper(queryClient)
    const order = createOrder()
    seedOrderCache(queryClient, order)

    const updated = createOrder({
      trackingNumber: 'TRACK-001',
      carrier: 'DHL'
    })
    vi.mocked(updateOrderRequester).mockResolvedValue({ data: updated })

    const { result } = renderHook(() => useUpdateOrderTrackingMutation(), {
      wrapper
    })

    await act(async () => {
      await result.current.mutateAsync({
        orderId: order.id,
        trackingNumber: 'TRACK-001',
        carrier: 'DHL'
      })
    })

    expect(
      queryClient.getQueryData<{ data: Order }>(orderQueryKeys.detail(order.id))
    ).toEqual({ data: updated })
  })

  it('optimistically hands over an order and keeps server result', async () => {
    const queryClient = createTestQueryClient()
    const wrapper = createQueryWrapper(queryClient)
    const order = createOrder({
      status: 'READY_TO_SHIP',
      statusHistory: ['PAID', 'READY_TO_SHIP']
    })
    seedOrderCache(queryClient, order)

    const handedOver = createOrder({
      status: 'HANDED_OVER',
      statusHistory: ['PAID', 'READY_TO_SHIP', 'HANDED_OVER'],
      trackingNumber: 'TRACK-999',
      carrier: 'Flash'
    })
    vi.mocked(handOverOrderRequester).mockResolvedValue({ data: handedOver })

    const { result } = renderHook(() => useHandOverOrderMutation(), {
      wrapper
    })

    await act(async () => {
      await result.current.mutateAsync({
        orderId: order.id,
        trackingNumber: 'TRACK-999',
        carrier: 'Flash'
      })
    })

    expect(
      queryClient.getQueryData<{ data: Order }>(orderQueryKeys.detail(order.id))
    ).toEqual({ data: handedOver })
  })

  it('shows refund failure feedback and invalidates summary after refund-related status changes', async () => {
    const queryClient = createTestQueryClient()
    const wrapper = createQueryWrapper(queryClient)
    const order = createOrder()
    const { listKey } = seedOrderCache(queryClient, order)

    const refundFailed = createOrder({
      status: 'REFUND_FAIL',
      statusHistory: ['PAID', 'MERCHANT_CANCELED']
    })
    vi.mocked(updateOrderRequester).mockResolvedValue({ data: refundFailed })

    const { result } = renderHook(() => useUpdateOrderStatusMutation(), {
      wrapper
    })

    await act(async () => {
      await result.current.mutateAsync({
        orderId: order.id,
        newStatus: 'MERCHANT_CANCELED'
      })
    })

    expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Refund failed',
        variant: 'destructive'
      })
    )
    expect(
      queryClient.getQueryState(orderQueryKeys.summary())?.isInvalidated
    ).toBe(true)
    expect(
      queryClient.getQueryState(orderQueryKeys.detail(order.id))?.isInvalidated
    ).toBe(true)
    expect(queryClient.getQueryState(listKey)?.isInvalidated).toBe(true)
  })
})
