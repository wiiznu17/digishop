import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getStoreProduct } from '../../src/utils/requestProductUtils'
import { Store, Product } from '../../src/types'

export default function StoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    getStoreProduct(id as string)
      .then((res: any) => setStore(res?.data || null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading)
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    )
  if (!store)
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-500">Store not found</Text>
      </View>
    )

  const fmt = (v: number) => `฿${(v / 100).toFixed(2)}`

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-blue-700 px-5 py-6 items-center">
        <Text className="text-4xl mb-2">🏪</Text>
        <Text className="text-white text-2xl font-bold">{store.storeName}</Text>
      </View>

      <FlatList
        contentContainerStyle={{ padding: 16 }}
        data={store.products || []}
        numColumns={2}
        keyExtractor={(p) => String(p.id)}
        columnWrapperStyle={{ gap: 12 }}
        ListEmptyComponent={
          <View className="items-center mt-12">
            <Text className="text-5xl mb-3">📭</Text>
            <Text className="text-gray-500">No products in this store</Text>
          </View>
        }
        renderItem={({ item }: { item: Product }) => {
          const price = item.items?.[0]?.priceMinor
          const img =
            item.images?.[0]?.url || item.items?.[0]?.productItemImage?.[0]?.url
          return (
            <TouchableOpacity
              className="flex-1 bg-white rounded-2xl overflow-hidden shadow-sm mb-3"
              onPress={() =>
                router.push({
                  pathname: '/product/[id]',
                  params: { id: item.uuid }
                })
              }
            >
              {img ? (
                <Image
                  source={{ uri: img }}
                  className="w-full h-36"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-36 bg-gray-100 items-center justify-center">
                  <Text className="text-4xl">📦</Text>
                </View>
              )}
              <View className="p-3">
                <Text
                  className="text-gray-900 font-semibold text-sm"
                  numberOfLines={2}
                >
                  {item.name}
                </Text>
                {price !== undefined && (
                  <Text className="text-blue-700 font-bold text-sm mt-1">
                    {fmt(price)}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )
        }}
      />
    </View>
  )
}
