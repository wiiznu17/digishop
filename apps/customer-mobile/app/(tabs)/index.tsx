import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native'
import { useRouter } from 'expo-router'
import { searchProduct } from '../../src/utils/requestProductUtils'
import { Product, Store } from '../../src/types'

type SearchResult = { type: 'product' | 'store'; id: string; name: string }

export default function HomeScreen() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSearch = useCallback(
    async (q = query) => {
      if (!q.trim()) return
      router.push({ pathname: '/search-results', params: { query: q } } as any)
    },
    [query]
  )

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSuggestions([])
      return
    }
    setLoading(true)
    try {
      const res = (await searchProduct(q)) as any
      const products: SearchResult[] = (res?.product || []).map(
        (p: Product) => ({ type: 'product' as const, id: p.uuid, name: p.name })
      )
      const stores: SearchResult[] = (res?.store || []).map((s: Store) => ({
        type: 'store' as const,
        id: s.uuid,
        name: s.storeName
      }))
      setSuggestions([...products, ...stores].slice(0, 10))
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <View className="flex-1 bg-gradient-to-b from-blue-50 to-white">
      <View className="bg-blue-700 pt-6 pb-10 px-6 items-center">
        <Text className="text-white text-4xl font-bold">DigiShop</Text>
        <Text className="text-blue-200 mt-1">Find Anything</Text>
      </View>

      <View className="mx-4 -mt-5">
        <View className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
          <View className="flex-row items-center px-4 py-3">
            <Text className="text-gray-400 mr-2 text-lg">🔍</Text>
            <TextInput
              className="flex-1 text-gray-900 text-base"
              placeholder="Search products and stores..."
              value={query}
              onChangeText={(t) => {
                setQuery(t)
                fetchSuggestions(t)
              }}
              onSubmitEditing={() => handleSearch()}
              returnKeyType="search"
            />
            {loading && <ActivityIndicator size="small" color="#1D4ED8" />}
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setQuery('')
                  setSuggestions([])
                }}
              >
                <Text className="text-gray-400 text-xl ml-2">✕</Text>
              </TouchableOpacity>
            )}
          </View>
          {suggestions.length > 0 && (
            <FlatList
              data={suggestions}
              keyExtractor={(item, i) => `${item.type}-${item.id}-${i}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="px-4 py-3 border-t border-gray-100 flex-row items-center"
                  onPress={() => {
                    if (item.type === 'product')
                      router.push({
                        pathname: '/product/[id]',
                        params: { id: item.id }
                      })
                    else
                      router.push({
                        pathname: '/store/[id]',
                        params: { id: item.id }
                      })
                  }}
                >
                  <Text className="mr-2">
                    {item.type === 'product' ? '📦' : '🏪'}
                  </Text>
                  <Text className="text-gray-800">{item.name}</Text>
                </TouchableOpacity>
              )}
              scrollEnabled={false}
            />
          )}
        </View>
      </View>

      <View className="flex-1 items-center justify-center">
        <Text className="text-6xl mb-4">🛍️</Text>
        <Text className="text-gray-500 text-base px-8 text-center">
          Search for products and stores above to get started
        </Text>
      </View>
    </View>
  )
}
