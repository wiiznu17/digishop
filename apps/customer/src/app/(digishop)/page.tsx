'use client'
import React, { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Rubik } from 'next/font/google'
import { searchProduct } from '@/utils/requestUtils/requestProduct'
import { Product, Store } from '@/types/props/productProp'
const rubik = Rubik({
  subsets: ['latin'],
  weight: '500'
})
type ProductResponse = {
  product: Product[] // type ของ searchProduct
  productCount: number // ตัวนับจำนวนสินค้า
  store: Store[] // type ของ searchStore
}
const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState<string[]>()
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const handleSearch = (query = searchQuery) => {
    if (!query.trim()) return
    router.push(`/search?query=${query}`)
  }
  const clearSearch = () => {
    setSearchQuery('')
  }
  useEffect(() => {
    const abort = new AbortController()
    const query = searchQuery.trim()
    if (query.length > 0 && loading) {
      const timeOutId = setTimeout(async () => {
        const res = (await searchProduct(query)) as ProductResponse
        const productName = res.product.map((product: Product) => product.name)
        const storeName = res.store.map((store: Store) => store.storeName)
        const resultSearch = productName.concat(storeName)
        if (resultSearch.length > 0) {
          setSearchResult(resultSearch)
          setLoading(false)
        } else {
          setSearchResult(undefined)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-[#C2D1F4]">
      {/* Main Content */}
      <main className="">
        <div className="flex flex-col items-center justify-end pt-4 min-h-[calc(70vh-70px)] px-4">
          {/* Logo/Title */}
          <div className=" text-center mb-12">
            <h2
              className={`relative text-5xl md:text-6xl font-bold text-gray-800 mb-4 ${rubik.className}`}
            >
              Find Anything
            </h2>
            <p className="text-xl text-gray-600">
              Search millions of products from thousands of stores
            </p>
          </div>

          {/* Search Bar */}
          <div className="w-full max-w-3xl relative">
            <div className="relative ">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setLoading(true)
                }}
                placeholder="Search for products, brands, or categories..."
                className={`w-full px-6 py-4 text-xl border-2 z-50 border-gray-200 ${searchResult && searchQuery ? 'rounded-t-4xl' : 'rounded-full'} focus:border-blue-500 focus:outline-none shadow-lg text-black bg-white`}
              />
              {searchQuery && (
                <div className="absolute  w-full ">
                  {searchResult?.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(result)}
                      className={`flex bg-white text-xl flex-row w-full p-4 border-b-2 border-x-2 border-gray-200 hover:bg-gray-300 ${index === searchResult.length - 1 ? 'rounded-b-4xl' : ''}`}
                    >
                      {result}
                    </button>
                  ))}
                </div>
              )}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                )}
                <button
                  onClick={() => handleSearch()}
                  className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 transition-colors"
                >
                  <Search size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default SearchPage
