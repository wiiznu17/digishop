'use client'
import { CardStore } from '@/components/productCard'
import { Product, StoreProduct } from '@/types/props/productProp'
import { getStoreProduct } from '@/utils/requestUtils/requestProduct'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Search, X, Store as StoreIcon } from 'lucide-react'

export default function StorePage() {
  const { id } = useParams()
  const [products, setProducts] = useState<StoreProduct>()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchEngine, setSearchEngine] = useState<string[] | undefined>(
    undefined
  )
  const [showProduct, setShowProduct] = useState<Product[]>()
  const [loading, setLoading] = useState(true)

  const handleSearch = (query = searchQuery) => {
    if (!query.trim()) return
    if (!products) return
    const filterProduct = products.products.filter((product) =>
      product.name.toLowerCase().includes(query.toLowerCase())
    )
    setShowProduct(filterProduct)
  }
  const clearSearch = () => {
    setSearchQuery('')
    setShowProduct(products?.products)
  }
  useEffect(() => {
    const timeout = setTimeout(() => {
      const filterProduct = products?.products
        .map((product) => product.name)
        .filter((product) =>
          product.toLowerCase().includes(searchQuery.toLowerCase())
        )
      if (filterProduct) {
        setSearchEngine(filterProduct)
      } else {
        setSearchEngine(undefined)
      }
    }, 500)
    return () => clearTimeout(timeout)
  }, [searchQuery, products])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const data = (await getStoreProduct(String(id))) as { data: StoreProduct }
        setProducts(data.data)
      } finally {
        setTimeout(() => setLoading(false), 500)
      }
    }
    fetchData()
  }, [id])

  useEffect(() => {
    if (!products) return
    setShowProduct(products.products)
  }, [products])

  if (loading) {
    return (
       <div className="max-w-6xl mx-auto py-8 px-4 animate-pulse">
         <div className="h-48 bg-white rounded-2xl shadow-sm mb-8" />
         <div className="h-16 bg-white rounded-full shadow-sm mb-8 max-w-2xl mx-auto" />
         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
           {[1,2,3,4,5,6,7,8,9,10].map(i => (
             <div key={i} className="h-64 bg-white rounded-2xl shadow-sm" />
           ))}
         </div>
       </div>
    )
  }

  if (!products) return null

  return (
    <div className="max-w-6xl mx-auto pt-8 px-4 min-h-screen">
      {/* Store Header Board */}
      <div className="relative bg-gradient-to-r from-blue-pastel-500 to-blue-pastel-300 rounded-3xl p-8 mb-10 overflow-hidden shadow-lg border border-blue-pastel-200">
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-24 left-10 w-48 h-48 bg-white opacity-10 rounded-full blur-xl"></div>
        
        <div className="relative flex flex-col md:flex-row items-center md:items-stretch gap-6 z-10 text-center md:text-left">
          <div className="h-28 w-28 rounded-full bg-white flex items-center justify-center shadow-md flex-shrink-0">
             <span className="text-5xl font-bold text-blue-pastel-500">
               {products.storeName.charAt(0)}
             </span>
          </div>
          <div className="flex flex-col justify-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-2 drop-shadow-sm">{products.storeName}</h1>
            <p className="text-blue-pastel-50 text-lg flex items-center justify-center md:justify-start gap-2 max-w-2xl">
              <StoreIcon size={18} /> {products.description || 'Welcome to our official store.'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="mt-4 mb-8">
        <div className="flex justify-center my-2">
          <div className="relative w-full max-w-2xl py-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
              }}
              placeholder={`Find products in ${products.storeName} ...`}
              className="w-full px-8 py-4 text-lg border-2 border-transparent shadow-md rounded-full focus:border-blue-pastel-300 focus:ring-4 focus:ring-blue-pastel-50 focus:outline-none text-gray-800 bg-white transition-all"
            />
            {searchQuery && (
              <div className="absolute right-0 top-full mt-2 z-50 w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                {searchEngine?.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => {
                        setSearchQuery(result)
                        handleSearch(result)
                    }}
                    className={`flex items-center text-left w-full px-6 py-4 border-b border-gray-50 hover:bg-blue-pastel-50 text-gray-700 hover:text-blue-pastel-600 transition-colors cursor-pointer last:border-0`}
                  >
                    <Search size={16} className="mr-3 opacity-50" />
                    {result}
                  </button>
                ))}
              </div>
            )}
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="p-2 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
              <button
                onClick={() => handleSearch()}
                className="bg-blue-pastel-500 text-white p-3 rounded-full hover:bg-blue-pastel-600 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <Search size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
          
      {/* Product Grid */}
      <div className="mb-12">
        {showProduct && showProduct.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {showProduct.map((item: Product, index: number) => (
              <div
                key={index}
                className="cursor-pointer group flex justify-center hover:-translate-y-1 hover:shadow-xl transition-all duration-300 rounded-b-2xl overflow-hidden bg-white shadow-sm border border-gray-100"
                onClick={() => router.push(`/product/${String(item.uuid)}`)}
              >
                <CardStore data={item} />
              </div>
            ))}
          </div>
        ) : (
            <div className="text-center py-20 text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">
                No products found in this store.
            </div>
        )}
      </div>

    </div>
  )
}
