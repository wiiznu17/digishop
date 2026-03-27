import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  fetchOrders,
  cancelOrder,
  updateOrderStatus
} from '../../src/utils/requestOrderUtils'
import { useAuth } from '../../src/contexts/AuthContext'
import { Order } from '../../src/types'

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#FEF3C7',
  PAID: '#DBEAFE',
  DELIVERED: '#D1FAE5',
  COMPLETE: '#A7F3D0',
  CUSTOMER_CANCELED: '#FEE2E2',
  REFUND_REQUEST: '#FED7AA'
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user?.id) return
    fetchOrders(id as string, user.id)
      .then((res: any) => setOrders(res?.body || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id, user?.id])

  const fmt = (v: number) => `฿${(v / 100).toFixed(2)}`

  const handleCancel = (orderId: number) => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelOrder(orderId, { reason: 'Customer requested' })
            Alert.alert('Success', 'Order cancelled successfully')
            router.back()
          } catch (e: any) {
            Alert.alert(
              'Error',
              e?.response?.data?.error || 'Cannot cancel this order'
            )
          }
        }
      }
    ])
  }

  const handleConfirmReceived = async (orderId: number) => {
    try {
      await updateOrderStatus(orderId)
      Alert.alert('Thank you!', 'Order marked as received')
      router.back()
    } catch {}
  }

  if (loading)
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    )
  if (!orders.length)
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-500">Order not found</Text>
      </View>
    )

  const order = orders[0]
  const bgColor = STATUS_COLORS[order.status] || '#F3F4F6'

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ padding: 16 }}
    >
      {/* Status Banner */}
      <View
        className="rounded-2xl p-4 mb-4 items-center"
        style={{ backgroundColor: bgColor }}
      >
        <Text className="text-gray-700 font-bold text-lg">
          {order.status.replace(/_/g, ' ')}
        </Text>
        <Text className="text-gray-500 text-xs mt-1">
          Order #{order.checkout?.orderCode || order.reference}
        </Text>
      </View>

      {/* Items */}
      <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
        <Text className="font-bold text-gray-800 mb-3">Items</Text>
        {order.items?.map((item) => (
          <View
            key={item.id}
            className="flex-row items-center py-2 border-b border-gray-50"
          >
            <View className="w-12 h-12 bg-gray-100 rounded-xl items-center justify-center mr-3">
              <Text className="text-2xl">📦</Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-medium" numberOfLines={1}>
                {item.productNameSnapshot || 'Product'}
              </Text>
              <Text className="text-gray-500 text-sm">
                Qty: {item.quantity}
              </Text>
            </View>
            <Text className="text-blue-700 font-semibold">
              {fmt(item.unitPriceMinor * item.quantity)}
            </Text>
          </View>
        ))}
      </View>

      {/* Price Summary */}
      <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
        <Text className="font-bold text-gray-800 mb-3">Summary</Text>
        <View className="space-y-2 gap-2">
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Subtotal</Text>
            <Text className="text-gray-900">{fmt(order.subtotalMinor)}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-600">Shipping</Text>
            <Text className="text-gray-900">{fmt(order.shippingFeeMinor)}</Text>
          </View>
          <View className="flex-row justify-between pt-2 border-t border-gray-100">
            <Text className="font-bold text-gray-900">Total</Text>
            <Text className="font-bold text-blue-700 text-lg">
              {fmt(order.grandTotalMinor)}
            </Text>
          </View>
        </View>
      </View>

      {/* Shipping */}
      {order.shippingInfo?.address && (
        <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
          <Text className="font-bold text-gray-800 mb-2">
            📍 Shipping Address
          </Text>
          <Text className="text-gray-700">
            {order.shippingInfo.address.recipientName}
          </Text>
          <Text className="text-gray-600 text-sm mt-1">
            {order.shippingInfo.address.address_number}{' '}
            {order.shippingInfo.address.street},{' '}
            {order.shippingInfo.address.district},{' '}
            {order.shippingInfo.address.province}
          </Text>
        </View>
      )}

      {/* Payment */}
      {order.checkout?.payment && (
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
          <Text className="font-bold text-gray-800 mb-2">💳 Payment</Text>
          <Text className="text-gray-600">
            {order.checkout.payment.payment_method}
          </Text>
          <Text className="text-gray-600 text-sm mt-1">
            Status: {order.checkout.payment.pgw_status}
          </Text>
        </View>
      )}

      {/* Actions */}
      {['PENDING', 'PAID'].includes(order.status) && (
        <TouchableOpacity
          className="bg-red-50 border border-red-200 rounded-xl py-4 items-center mb-3"
          onPress={() => handleCancel(order.id)}
        >
          <Text className="text-red-600 font-bold">Cancel Order</Text>
        </TouchableOpacity>
      )}
      {['DELIVERED', 'CANCELED_REFUND'].includes(order.status) && (
        <TouchableOpacity
          className="bg-green-600 rounded-xl py-4 items-center mb-3"
          onPress={() => handleConfirmReceived(order.id)}
        >
          <Text className="text-white font-bold">✅ Confirm Received</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}
