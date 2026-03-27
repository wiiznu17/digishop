import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  FlatList
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getProduct } from '../../src/utils/requestProductUtils'
import { createWishList } from '../../src/utils/requestOrderUtils'
import { useAuth } from '../../src/contexts/AuthContext'
import { Product, ProductItem } from '../../src/types'

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [choices, setChoices] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ProductItem | null>(null)
  const [qty, setQty] = useState(1)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    getProduct(id as string)
      .then((res: any) => {
        setProduct(res?.data || null)
        setChoices(res?.choices || null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const fmt = (v: number) => `฿${(v / 100).toFixed(2)}`

  const handleAddToCart = async () => {
    if (!user?.id) {
      Alert.alert('Login Required', 'Please login to add items to cart')
      return
    }
    const item = selected || product?.items?.[0]
    if (!item) {
      Alert.alert('Error', 'Please select a variant')
      return
    }
    try {
      await createWishList({
        customerId: user.id,
        productItemId: [item.id],
        quantity: [qty]
      })
      Alert.alert('Added', `${product?.name} added to cart`, [
        { text: 'View Cart', onPress: () => router.push('/(tabs)/cart') },
        { text: 'Continue' }
      ])
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed to add to cart')
    }
  }

  if (loading)
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#1D4ED8" />
      </View>
    )
  if (!product)
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-500">Product not found</Text>
      </View>
    )

  const displayItem = selected || product.items?.[0]

  return (
    <View className="flex-1 bg-white">
      <ScrollView>
        {/* Images */}
        {product.items?.[0]?.productItemImage?.[0]?.url ? (
          <Image
            source={{ uri: product.items[0].productItemImage![0].url }}
            className="w-full h-72"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-72 bg-gray-100 items-center justify-center">
            <Text className="text-6xl">📦</Text>
          </View>
        )}

        <View className="p-5">
          <Text className="text-2xl font-bold text-gray-900">
            {product.name}
          </Text>
          {displayItem && (
            <Text className="text-3xl font-bold text-blue-700 mt-2">
              {fmt(displayItem.priceMinor)}
            </Text>
          )}

          {/* Store */}
          {product.store && (
            <TouchableOpacity
              className="flex-row items-center mt-4 bg-gray-50 rounded-xl p-3"
              onPress={() =>
                router.push({
                  pathname: '/store/[id]',
                  params: { id: product.store!.uuid }
                })
              }
            >
              <Text className="text-2xl mr-3">🏪</Text>
              <View>
                <Text className="text-gray-500 text-xs">Store</Text>
                <Text className="text-gray-900 font-semibold">
                  {product.store.storeName}
                </Text>
              </View>
              <Text className="ml-auto text-gray-400">›</Text>
            </TouchableOpacity>
          )}

          {/* Variants */}
          {product.items && product.items.length > 1 && (
            <View className="mt-4">
              <Text className="text-gray-700 font-semibold mb-2">
                Select Variant
              </Text>
              <FlatList
                horizontal
                data={product.items}
                keyExtractor={(i) => String(i.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className={`px-3 py-2 rounded-lg border mr-2 ${selected?.id === item.id ? 'border-blue-700 bg-blue-50' : 'border-gray-200 bg-white'}`}
                    onPress={() => setSelected(item)}
                  >
                    <Text
                      className={
                        selected?.id === item.id
                          ? 'text-blue-700 font-medium'
                          : 'text-gray-700'
                      }
                    >
                      {item.configurations?.[0]?.variationOption?.value ||
                        item.sku}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* Description */}
          {product.description && (
            <View className="mt-4">
              <Text className="text-gray-700 font-semibold mb-1">
                Description
              </Text>
              <Text className="text-gray-600 leading-6">
                {product.description}
              </Text>
            </View>
          )}

          {/* Qty */}
          <View className="flex-row items-center mt-5">
            <Text className="text-gray-700 font-semibold mr-4">Quantity</Text>
            <TouchableOpacity
              onPress={() => setQty(Math.max(1, qty - 1))}
              className="w-8 h-8 border border-gray-300 rounded-full items-center justify-center"
            >
              <Text className="text-gray-600 font-bold">−</Text>
            </TouchableOpacity>
            <Text className="mx-4 text-gray-900 font-bold text-lg">{qty}</Text>
            <TouchableOpacity
              onPress={() => setQty(qty + 1)}
              className="w-8 h-8 border border-gray-300 rounded-full items-center justify-center"
            >
              <Text className="text-gray-600 font-bold">+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View className="px-5 py-4 bg-white border-t border-gray-100">
        <TouchableOpacity
          className="bg-blue-700 rounded-xl py-4 items-center"
          onPress={handleAddToCart}
        >
          <Text className="text-white font-bold text-base">🛒 Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
