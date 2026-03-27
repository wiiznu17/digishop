import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../src/contexts/AuthContext'
import {
  fetchUserCart,
  deleteCart,
  createOrderId
} from '../../src/utils/requestOrderUtils'

interface CartItem {
  id: number
  quantity: number
  unitPriceMinor: number
  productItemId: number
  productItem?: {
    sku: string
    priceMinor: number
    productItemImage?: { url: string }[]
    product?: { id: number; name: string; uuid: string; store?: { id: number } }
  }
}

export default function CartScreen() {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const router = useRouter()

  const loadCart = useCallback(async () => {
    if (!user?.id) return
    try {
      const res = (await fetchUserCart(user.id)) as any
      setItems(res?.data || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadCart()
  }, [loadCart])

  const removeItem = async (id: number) => {
    await deleteCart([id])
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const total = items.reduce((s, i) => s + i.unitPriceMinor * i.quantity, 0)
  const fmt = (minor: number) => `฿${(minor / 100).toFixed(2)}`

  const handleCheckout = async () => {
    if (!user?.id || items.length === 0) return
    try {
      const orderData = items.map((item) => ({
        productItemId: item.productItemId,
        quantity: item.quantity,
        lineTotalMinor: item.unitPriceMinor * item.quantity,
        productItem: item.productItem
      }))
      const res = (await createOrderId({
        customerId: user.id,
        orderData
      })) as any
      router.push({
        pathname: '/checkout',
        params: { orderCode: res?.data }
      } as any)
    } catch (e: any) {
      Alert.alert(
        'Checkout Error',
        e?.response?.data?.error || 'Failed to create order'
      )
    }
  }

  if (loading)
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    )

  return (
    <View className="flex-1 bg-gray-50">
      {items.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-5xl mb-4">🛒</Text>
          <Text className="text-gray-500 text-lg">Your cart is empty</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm flex-row gap-3">
                <View className="w-16 h-16 bg-gray-100 rounded-xl items-center justify-center">
                  {item.productItem?.productItemImage?.[0]?.url ? (
                    <Image
                      source={{ uri: item.productItem.productItemImage[0].url }}
                      className="w-16 h-16 rounded-xl"
                      resizeMode="cover"
                    />
                  ) : (
                    <Text className="text-2xl">📦</Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text
                    className="text-gray-900 font-semibold"
                    numberOfLines={1}
                  >
                    {item.productItem?.product?.name || item.productItem?.sku}
                  </Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    Qty: {item.quantity}
                  </Text>
                  <Text className="text-blue-700 font-bold mt-1">
                    {fmt(item.unitPriceMinor * item.quantity)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => removeItem(item.id)}
                  className="p-1"
                >
                  <Text className="text-red-400 text-xl">✕</Text>
                </TouchableOpacity>
              </View>
            )}
          />
          <View className="bg-white px-6 py-4 border-t border-gray-100 shadow-lg">
            <View className="flex-row justify-between mb-4">
              <Text className="text-gray-600 text-base">
                Total ({items.length} items)
              </Text>
              <Text className="text-blue-700 text-xl font-bold">
                {fmt(total)}
              </Text>
            </View>
            <TouchableOpacity
              className="bg-blue-700 rounded-xl py-4 items-center"
              onPress={handleCheckout}
            >
              <Text className="text-white font-bold text-base">
                Proceed to Checkout
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  )
}
