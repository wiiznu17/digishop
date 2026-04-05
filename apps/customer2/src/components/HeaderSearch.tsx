'use client'
import React, { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { searchProduct } from '@/utils/requestUtils/requestProduct'
import { Product, Store } from '@/types/props/productProp'

type ProductResponse = {
  product: Product[]
  productCount: number
  store: Store[]
}

export const HeaderSearch = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState<string[]>()
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSearch = (query = searchQuery) => {
    if (!query.trim()) return
    setSearchResult(undefined)
    router.push(`/search?query=${query}`)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResult(undefined)
  }

  useEffect(() => {
    const abort = new AbortController()
    const query = searchQuery.trim()
    if (query.length > 0 && loading) {
      const timeOutId = setTimeout(async () => {
        try {
          const res = (await searchProduct(query)) as ProductResponse
          const productName = res.product?.map((product: Product) => product.name) || []
          const storeName = res.store?.map((store: Store) => store.storeName) || []
          const resultSearch = productName.concat(storeName)
          if (resultSearch.length > 0) {
            setSearchResult(resultSearch)
          } else {
            setSearchResult(undefined)
          }
        } catch (e) {
          setSearchResult(undefined)
        } finally {
          setLoading(false)
        }
      }, 500)
      return () => {
        clearTimeout(timeOutId)
        abort.abort()
      }
    }
  }, [searchQuery, loading])

  return (
    <div className="relative w-full max-w-3xl">
      <div className="flex bg-white rounded-md overflow-hidden shadow-sm border border-transparent focus-within:border-blue-pastel-400 focus-within:ring-2 ring-blue-pastel-200 transition-all">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setLoading(true)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch()
            }
          }}
          placeholder="Search items or stores..."
          className="w-full px-4 py-2 text-gray-800 focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="p-2 text-gray-400 hover:text-gray-600 bg-white"
          >
            <X size={18} />
          </button>
        )}
        <button
          onClick={() => handleSearch()}
          className="bg-blue-pastel-500 hover:bg-blue-pastel-600 text-white px-6 py-2 transition-colors flex items-center justify-center"
        >
          <Search size={20} />
        </button>
      </div>
      
      {searchQuery && searchResult && searchResult.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
          {searchResult.map((result, index) => (
            <button
              key={index}
              onClick={() => handleSearch(result)}
              className="flex w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-blue-50 text-gray-700 last:border-b-0"
            >
              {result}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
