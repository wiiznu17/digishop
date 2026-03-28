'use client'

import {
  useMutation,
  useQueryClient,
  type QueryClient
} from '@tanstack/react-query'
import type { OrderStatus } from '@/types/props/orderProp'
import { useToast } from '@/hooks/use-toast'
import { extractErrorMessage } from '@/utils/errorToToast'
import {
  handOverOrderRequester,
  updateOrderRequester
} from '@/utils/requestUtils/requestOrderUtils'
import { orderQueryKeys } from '@/lib/react-query/keys/orderKeys'
import {
  appendOrderStatusHistory,
  captureOrderCacheSnapshot,
  restoreOrderCacheSnapshot,
  updateOrderAcrossCaches
} from '@/lib/react-query/helpers/orderCache'
import { invalidateQueryGroups } from '@/lib/react-query/helpers/cacheSnapshots'
import { useOrderStatus } from '@/hooks/useOrderStatus'

function invalidateOrderQueries(queryClient: QueryClient, orderId: string) {
  invalidateQueryGroups(queryClient, [
    orderQueryKeys.lists(),
    orderQueryKeys.summary(),
    orderQueryKeys.detail(orderId)
  ])
}

export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { getStatusText } = useOrderStatus()

  return useMutation({
    mutationFn: ({
      orderId,
      newStatus
    }: {
      orderId: string
      newStatus: OrderStatus
    }) => updateOrderRequester(orderId, { status: newStatus }),
    onMutate: async ({ orderId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: orderQueryKeys.all })
      const snapshot = captureOrderCacheSnapshot(queryClient, orderId)

      updateOrderAcrossCaches(queryClient, orderId, (order) => ({
        ...order,
        status: newStatus,
        statusHistory: appendOrderStatusHistory(order, newStatus)
      }))

      return { snapshot, orderId, newStatus }
    },
    onError: (error, _variables, context) => {
      restoreOrderCacheSnapshot(queryClient, context?.snapshot)
      const { title, description } = extractErrorMessage(error)
      toast({
        title: `Failed to update · ${title}`,
        description,
        variant: 'destructive'
      })
    },
    onSuccess: (result, variables) => {
      const updated = result.data
      updateOrderAcrossCaches(queryClient, variables.orderId, () => updated)

      toast({
        title: 'Status updated',
        description: `New status: ${getStatusText(updated.status)}`
      })

      if (
        ['MERCHANT_CANCELED', 'REFUND_APPROVED', 'REFUND_RETRY'].includes(
          variables.newStatus
        ) &&
        updated.status === 'REFUND_FAIL'
      ) {
        toast({ title: 'Refund failed', variant: 'destructive' })
      }
    },
    onSettled: (_data, _error, variables) => {
      invalidateOrderQueries(queryClient, variables.orderId)
    }
  })
}

export function useUpdateOrderTrackingMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      orderId,
      trackingNumber,
      carrier
    }: {
      orderId: string
      trackingNumber: string
      carrier?: string
    }) =>
      updateOrderRequester(orderId, {
        trackingNumber,
        ...(carrier ? { carrier } : {})
      }),
    onMutate: async ({ orderId, trackingNumber, carrier }) => {
      await queryClient.cancelQueries({ queryKey: orderQueryKeys.all })
      const snapshot = captureOrderCacheSnapshot(queryClient, orderId)

      updateOrderAcrossCaches(queryClient, orderId, (order) => ({
        ...order,
        trackingNumber,
        ...(carrier ? { carrier } : {})
      }))

      return { snapshot, orderId }
    },
    onError: (error, _variables, context) => {
      restoreOrderCacheSnapshot(queryClient, context?.snapshot)
      const { title, description } = extractErrorMessage(error)
      toast({
        title: `Failed to update tracking · ${title}`,
        description,
        variant: 'destructive'
      })
    },
    onSuccess: (result, variables) => {
      updateOrderAcrossCaches(queryClient, variables.orderId, () => result.data)
      toast({ title: 'Tracking updated' })
    },
    onSettled: (_data, _error, variables) => {
      invalidateOrderQueries(queryClient, variables.orderId)
    }
  })
}

export function useHandOverOrderMutation() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({
      orderId,
      trackingNumber,
      carrier
    }: {
      orderId: string
      trackingNumber: string
      carrier?: string
    }) => handOverOrderRequester(orderId, trackingNumber, carrier),
    onMutate: async ({ orderId, trackingNumber, carrier }) => {
      await queryClient.cancelQueries({ queryKey: orderQueryKeys.all })
      const snapshot = captureOrderCacheSnapshot(queryClient, orderId)

      updateOrderAcrossCaches(queryClient, orderId, (order) => ({
        ...order,
        status: 'HANDED_OVER',
        statusHistory: appendOrderStatusHistory(order, 'HANDED_OVER'),
        trackingNumber,
        ...(carrier ? { carrier } : {})
      }))

      return { snapshot, orderId }
    },
    onError: (error, _variables, context) => {
      restoreOrderCacheSnapshot(queryClient, context?.snapshot)
      const { title, description } = extractErrorMessage(error)
      toast({
        title: `Failed to hand over · ${title}`,
        description,
        variant: 'destructive'
      })
    },
    onSuccess: (result, variables) => {
      updateOrderAcrossCaches(queryClient, variables.orderId, () => result.data)
      toast({ title: 'Parcel handed over' })
    },
    onSettled: (_data, _error, variables) => {
      invalidateOrderQueries(queryClient, variables.orderId)
    }
  })
}
